import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSlackLeaveNotification } from '@/lib/webhooks/slack'
import { sendInterviewEmail } from '@/lib/webhooks/resend'

// --- ZOD SCHEMAS FOR WEBHOOK PAYLOADS ---

const LeaveRecordSchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  status: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional().nullable(),
  leave_policy_id: z.string().uuid(),
})

const CandidateRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  stage: z.string(),
  requisition_id: z.string().uuid(),
})

const WebhookPayloadSchema = z.discriminatedUnion('event_type', [
  z.object({
    event_type: z.literal('leave.status_change'),
    record: LeaveRecordSchema,
    old_record: LeaveRecordSchema.optional().nullable(),
  }),
  z.object({
    event_type: z.literal('candidate.stage_change'),
    record: CandidateRecordSchema,
    old_record: CandidateRecordSchema.optional().nullable(),
  }),
])

type WebhookPayload = z.infer<typeof WebhookPayloadSchema>

// --- WEBHOOK EVENT HANDLERS ---

async function handleLeaveStatusChange(record: z.infer<typeof LeaveRecordSchema>) {
  const supabase = createAdminClient()

  // 1. Fetch Employee Name
  const { data: employee, error: empError } = await supabase
    .from('employee')
    .select('first_name, last_name')
    .eq('id', record.employee_id)
    .single()

  if (empError || !employee) {
    console.error(`Webhook Warning: Could not find employee name for ID ${record.employee_id}. Details:`, empError?.message)
  }
  const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'

  // 2. Fetch Leave Policy Type
  // ASSUMPTION: The policy table name is leave_policy as defined in other scripts.
  const { data: policy, error: policyError } = await supabase
    .from('leave_policy')
    .select('name')
    .eq('id', record.leave_policy_id)
    .single()

  if (policyError || !policy) {
    console.error(`Webhook Warning: Could not find leave policy name for ID ${record.leave_policy_id}. Details:`, policyError?.message)
  }
  const leaveType = policy ? policy.name : 'Paid Time Off'

  // 3. Send Slack Notification
  await sendSlackLeaveNotification({
    employeeName,
    leaveType,
    startDate: record.start_date,
    endDate: record.end_date,
    status: record.status,
    reason: record.reason,
  })
}

async function handleCandidateStageChange(record: z.infer<typeof CandidateRecordSchema>) {
  const supabase = createAdminClient()

  // 1. Fetch Job Requisition Title
  // ASSUMPTION: The recruitment model maps candidate.requisition_id to job_requisition.id.
  const { data: job, error: jobError } = await supabase
    .from('job_requisition')
    .select('title')
    .eq('id', record.requisition_id)
    .single()

  if (jobError || !job) {
    console.error(`Webhook Warning: Could not find job title for requisition ID ${record.requisition_id}. Details:`, jobError?.message)
  }
  const jobTitle = job ? job.title : 'Position Applied'

  // 2. Send Transactional Email
  await sendInterviewEmail({
    candidateName: record.name,
    candidateEmail: record.email,
    jobTitle,
  })
}

// --- MAIN POST HANDLER ---

export async function POST(request: NextRequest) {
  try {
    const secretHeader = request.headers.get('x-webhook-secret')
    const localSecret = process.env.WEBHOOK_SECRET

    // 1. Authenticate secret header
    if (!localSecret || secretHeader !== localSecret) {
      console.warn('Webhook Unauthorized: Header secret does not match WEBHOOK_SECRET env var.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // 2. Parse and Validate the payload structure
    const parsedPayload = WebhookPayloadSchema.parse(body)

    // 3. Route to respective handler
    if (parsedPayload.event_type === 'leave.status_change') {
      await handleLeaveStatusChange(parsedPayload.record)
    } else if (parsedPayload.event_type === 'candidate.stage_change') {
      await handleCandidateStageChange(parsedPayload.record)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    // CRITICAL: Log error, but return 200 OK anyway.
    // This prevents PostgreSQL pg_net trigger from retrying infinitely on transient issues
    // and flooding database logs/queues.
    console.error('Webhook processing encountered an error:', err)
    return NextResponse.json({ 
      received: true, 
      warning: err instanceof Error ? err.message : 'Internal error logged.'
    }, { status: 200 })
  }
}
