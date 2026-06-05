import { Resend } from 'resend'
import { z } from 'zod'

// Define validation schema for candidate email payload
export const ResendEmailPayloadSchema = z.object({
  candidateName: z.string(),
  candidateEmail: z.string(),
  jobTitle: z.string(),
})

export type ResendEmailPayload = z.infer<typeof ResendEmailPayloadSchema>

/**
 * Sends a transactional interview scheduled email via Resend.
 * @param payload The candidate and job details.
 */
export async function sendInterviewEmail(payload: ResendEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('Resend Email skipped: RESEND_API_KEY environment variable is not defined.')
    return
  }

  // Validate payload boundaries
  const validated = ResendEmailPayloadSchema.parse(payload)
  
  const resend = new Resend(apiKey)

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Invitation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            padding: 24px;
            margin: 0;
          }
          .container {
            max-width: 580px;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            margin: 0 auto;
          }
          .header {
            background-color: #6366f1;
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 32px 24px;
            line-height: 1.6;
          }
          .content p {
            margin: 0 0 16px;
            font-size: 15px;
            color: #334155;
          }
          .details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            border-left: 4px solid #6366f1;
          }
          .details-row {
            margin-bottom: 8px;
            font-size: 14px;
          }
          .details-row:last-child {
            margin-bottom: 0;
          }
          .details-label {
            font-weight: bold;
            color: #475569;
            display: inline-block;
            width: 120px;
          }
          .details-val {
            color: #0f172a;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Interview Scheduled</h1>
          </div>
          <div class="content">
            <p>Dear ${validated.candidateName},</p>
            <p>Thank you for your interest in joining our team! We have reviewed your application for the <strong>${validated.jobTitle}</strong> position and are delighted to invite you for an interview.</p>
            <p>One of our HR coordinators will reach out to you shortly to coordinate your interview time slots. In the meantime, no further action is required on your part.</p>
            
            <div class="details">
              <div class="details-row">
                <span class="details-label">Position:</span>
                <span class="details-val">${validated.jobTitle}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Next Step:</span>
                <span class="details-val">Interview Round Selection</span>
              </div>
            </div>
            
            <p>We look forward to speaking with you soon!</p>
            <p>Best regards,<br><strong>HR Recruiting Team</strong><br>Enterprise HR Dashboard Group</p>
          </div>
          <div class="footer">
            This is an automated notification from our Applicant Tracking System.<br>
            Please do not reply directly to this mail.
          </div>
        </div>
      </body>
    </html>
  `

  const { data, error } = await resend.emails.send({
    from: 'hr@yourcompany.com',
    to: validated.candidateEmail,
    subject: `Interview Invitation: ${validated.jobTitle} - HR Recruiting`,
    html: htmlContent,
  })

  if (error) {
    throw new Error(`Resend email delivery failed: ${error.message}`)
  }
}
