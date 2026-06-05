import { z } from 'zod'

// Define validation schema for the leave payload
export const SlackLeavePayloadSchema = z.object({
  employeeName: z.string(),
  leaveType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  reason: z.string().optional().nullable(),
})

export type SlackLeavePayload = z.infer<typeof SlackLeavePayloadSchema>

/**
 * Sends a structured Slack notification using Block Kit layouts.
 * @param payload The leave request details.
 */
export async function sendSlackLeaveNotification(
  payload: SlackLeavePayload
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('Slack Webhook skipped: SLACK_WEBHOOK_URL environment variable is not defined.')
    return
  }

  // Validate payload structure
  const validated = SlackLeavePayloadSchema.parse(payload)

  const isApproved = validated.status.toLowerCase() === 'approved'
  const color = isApproved ? '#10b981' : '#ef4444' // Green for approved, Red for rejected
  const emoji = isApproved ? '✅' : '❌'

  const body = {
    attachments: [
      {
        color: color,
        fallback: `Leave request for ${validated.employeeName} has been ${validated.status.toLowerCase()}.`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${emoji} Leave Request ${validated.status}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Employee:*\n${validated.employeeName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Type:*\n${validated.leaveType}`,
              },
            ],
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Dates:*\n${validated.startDate} to ${validated.endDate}`,
              },
              {
                type: 'mrkdwn',
                text: `*Reason:*\n${validated.reason || '_None provided_'}`,
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Processed on *${new Date().toLocaleDateString()}* | HR Operations Portal`,
              },
            ],
          },
        ],
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Slack API responded with HTTP status ${res.status}: ${errorText}`)
  }
}
