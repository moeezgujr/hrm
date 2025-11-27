import { EmailService } from './emailService';

interface TrialNotificationData {
  name: string;
  email: string;
  company: string;
  phone?: string;
  jobTitle: string;
  teamSize: string;
  planId: string;
  billingCycle: string;
}

export class TrialNotificationService {
  constructor() {
    // No need to instantiate EmailService as it uses static methods
  }

  async sendTrialRequestNotification(data: TrialNotificationData): Promise<void> {
    // Send notification to HR admin
    await this.sendHRNotification(data);
    
    // Send confirmation to the requester
    await this.sendRequesterConfirmation(data);
  }

  private async sendHRNotification(data: TrialNotificationData): Promise<void> {
    const subject = `New Trial Request - ${data.company}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Trial Request</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600;
          }
          .content { 
            padding: 30px; 
          }
          .alert { 
            background: #fee2e2; 
            border-left: 4px solid #dc2626; 
            padding: 16px; 
            margin: 20px 0; 
            border-radius: 4px;
          }
          .alert h3 { 
            margin: 0 0 8px 0; 
            color: #dc2626; 
            font-size: 18px;
          }
          .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin: 20px 0; 
          }
          .detail-item { 
            background: #f8f9fa; 
            padding: 16px; 
            border-radius: 8px; 
            border: 1px solid #e5e7eb;
          }
          .detail-label { 
            font-weight: 600; 
            color: #374151; 
            margin-bottom: 4px; 
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value { 
            color: #1f2937; 
            font-size: 16px;
          }
          .plan-highlight { 
            background: #dbeafe; 
            border: 2px solid #3b82f6; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            text-align: center;
          }
          .plan-name { 
            font-size: 20px; 
            font-weight: 700; 
            color: #1e40af; 
            margin-bottom: 8px;
          }
          .billing-cycle { 
            color: #374151; 
            font-size: 14px;
          }
          .action-button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 10px 10px 0 0;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .action-button:hover { 
            background: #1d4ed8; 
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb;
            color: #6b7280; 
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .details-grid { grid-template-columns: 1fr; }
            .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New Trial Request</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">A potential customer wants to try Meeting Matters</p>
          </div>
          
          <div class="content">
            <div class="alert">
              <h3>⚡ Action Required</h3>
              <p style="margin: 0;">A new trial request needs your review and approval.</p>
            </div>

            <div class="plan-highlight">
              <div class="plan-name">${data.planId.charAt(0).toUpperCase() + data.planId.slice(1)} Plan</div>
              <div class="billing-cycle">Billing: ${data.billingCycle}</div>
            </div>

            <h3 style="color: #1f2937; margin: 24px 0 16px 0;">Company Information</h3>
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Company Name</div>
                <div class="detail-value">${data.company}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Team Size</div>
                <div class="detail-value">${data.teamSize}</div>
              </div>
            </div>

            <h3 style="color: #1f2937; margin: 24px 0 16px 0;">Contact Information</h3>
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Contact Person</div>
                <div class="detail-value">${data.name}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Job Title</div>
                <div class="detail-value">${data.jobTitle}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Email Address</div>
                <div class="detail-value">${data.email}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Phone Number</div>
                <div class="detail-value">${data.phone || 'Not provided'}</div>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin/trial-requests" class="action-button">
                Review Request
              </a>
              <a href="mailto:${data.email}" class="action-button" style="background: #059669;">
                Contact Customer
              </a>
            </div>

            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 8px 0; color: #374151;">Next Steps:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                <li>Log into the admin dashboard to review the request</li>
                <li>Approve or reject the trial based on company criteria</li>
                <li>Customer will receive automatic email notification of your decision</li>
                <li>Approved trials get 14 days of full access</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>This notification was sent from Meeting Matters Business Management System</p>
            <p>Manage trial requests at: <strong>/admin/trial-requests</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      NEW TRIAL REQUEST - ${data.company}
      
      A new trial request has been submitted and requires your review.
      
      COMPANY DETAILS:
      - Company: ${data.company}
      - Team Size: ${data.teamSize}
      - Selected Plan: ${data.planId} (${data.billingCycle})
      
      CONTACT INFORMATION:
      - Name: ${data.name}
      - Job Title: ${data.jobTitle}
      - Email: ${data.email}
      - Phone: ${data.phone || 'Not provided'}
      
      NEXT STEPS:
      1. Review the request at ${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin/trial-requests
      2. Approve or reject based on company criteria
      3. Customer will be notified automatically
      
      Review Request: ${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/admin/trial-requests
    `;

    // Send to HR admin email
    const hrAdminEmail = process.env.HR_ADMIN_EMAIL || 'hr@themeetingmatters.com';
    await EmailService.sendEmail(hrAdminEmail, subject, htmlContent, textContent);
  }

  private async sendRequesterConfirmation(data: TrialNotificationData): Promise<void> {
    const subject = `Trial Request Received - Meeting Matters`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trial Request Confirmation</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #059669 0%, #047857 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .content { 
            padding: 30px; 
          }
          .success-icon { 
            font-size: 48px; 
            margin-bottom: 16px; 
          }
          .plan-summary { 
            background: #f0f9ff; 
            border: 2px solid #0ea5e9; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .timeline { 
            background: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .timeline-item { 
            display: flex; 
            align-items: center; 
            margin: 12px 0; 
          }
          .timeline-number { 
            background: #2563eb; 
            color: white; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 12px; 
            font-weight: bold; 
            margin-right: 12px; 
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb;
            color: #6b7280; 
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Trial Request Received!</h1>
            <p style="margin: 0; opacity: 0.9;">Thank you for your interest in Meeting Matters</p>
          </div>
          
          <div class="content">
            <p>Hi <strong>${data.name}</strong>,</p>
            
            <p>We've successfully received your free trial request for <strong>${data.company}</strong>. Your request is currently being reviewed by our team.</p>

            <div class="plan-summary">
              <h3 style="margin: 0 0 12px 0; color: #0c4a6e;">Your Trial Request Summary</h3>
              <p><strong>Plan:</strong> ${data.planId.charAt(0).toUpperCase() + data.planId.slice(1)}</p>
              <p><strong>Billing Cycle:</strong> ${data.billingCycle}</p>
              <p><strong>Team Size:</strong> ${data.teamSize}</p>
              <p style="margin-bottom: 0;"><strong>Trial Duration:</strong> 14 days</p>
            </div>

            <div class="timeline">
              <h3 style="margin: 0 0 16px 0; color: #374151;">What happens next?</h3>
              <div class="timeline-item">
                <div class="timeline-number">1</div>
                <div>Our team reviews your request (typically within 24 hours)</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-number">2</div>
                <div>You'll receive an email with your trial approval status</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-number">3</div>
                <div>If approved, get instant access to all ${data.planId} features</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-number">4</div>
                <div>Enjoy 14 days of full platform access</div>
              </div>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0;"><strong>Questions?</strong> Feel free to contact us at <a href="mailto:support@themeetingmatters.com" style="color: #d97706;">support@themeetingmatters.com</a></p>
            </div>

            <p>We're excited to help <strong>${data.company}</strong> streamline your business operations!</p>
            
            <p>Best regards,<br>
            <strong>The Meeting Matters Team</strong></p>
          </div>

          <div class="footer">
            <p>This email was sent to confirm your trial request for Meeting Matters</p>
            <p>If you didn't request this trial, please ignore this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      TRIAL REQUEST CONFIRMATION - Meeting Matters
      
      Hi ${data.name},
      
      We've successfully received your free trial request for ${data.company}.
      
      TRIAL SUMMARY:
      - Plan: ${data.planId}
      - Billing: ${data.billingCycle}
      - Team Size: ${data.teamSize}
      - Duration: 14 days
      
      WHAT'S NEXT:
      1. Our team reviews your request (within 24 hours)
      2. You'll receive email notification of approval status
      3. If approved, get instant access to all features
      4. Enjoy 14 days of full platform access
      
      Questions? Contact us at support@themeetingmatters.com
      
      Best regards,
      The Meeting Matters Team
    `;

    await EmailService.sendEmail(data.email, subject, htmlContent, textContent);
  }

  async sendTrialApprovalNotification(requesterEmail: string, requesterName: string, company: string, planId: string, loginCredentials?: { username: string; password: string }): Promise<void> {
    const subject = `🎉 Trial Approved - Welcome to Meeting Matters!`;
    
    const loginSection = loginCredentials ? `
      <div style="background: #dcfce7; border: 2px solid #16a34a; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
        <h3 style="margin: 0 0 20px 0; color: #166534; font-size: 20px;">🔑 Your Login Credentials</h3>
        <div style="background: white; padding: 20px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 8px 0; font-size: 16px;"><strong>Website:</strong> <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}" style="color: #166534; text-decoration: none;">${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}</a></p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Username:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${loginCredentials.username}</code></p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Password:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${loginCredentials.password}</code></p>
        </div>
        <p style="margin-top: 15px; margin-bottom: 0; font-size: 14px; color: #166534;"><em>⚠️ Please change your password after first login for security</em></p>
      </div>
    ` : `
      <div style="background: #dbeafe; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #1e40af;">Access Instructions</h3>
        <p style="margin-bottom: 0;">Detailed login instructions and credentials will be sent in a separate email shortly.</p>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trial Approved</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .content { 
            padding: 30px; 
          }
          .success-banner { 
            background: #f0fdf4; 
            border: 2px solid #22c55e; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            margin: 20px 0; 
          }
          .action-button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 10px; 
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Trial Approved!</h1>
            <p style="margin: 0; opacity: 0.9;">Welcome to Meeting Matters</p>
          </div>
          
          <div class="content">
            <p>Hi <strong>${requesterName}</strong>,</p>
            
            <div class="success-banner">
              <h2 style="margin: 0 0 8px 0; color: #166534;">Congratulations!</h2>
              <p style="margin: 0; color: #166534;">Your trial request for <strong>${company}</strong> has been approved!</p>
            </div>

            <p>You now have <strong>14 days of full access</strong> to all ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan features.</p>

            ${loginSection}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}" class="action-button" style="display: inline-block; background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                🚀 Start Your Trial Now
              </a>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #374151;">During your trial:</h3>
              <ul style="margin: 0; color: #6b7280;">
                <li>Explore all HR management features</li>
                <li>Set up your team and departments</li>
                <li>Test onboarding workflows</li>
                <li>Try psychometric assessments</li>
                <li>Access dedicated customer support</li>
              </ul>
            </div>

            <p>Need help getting started? Contact our support team at <a href="mailto:support@themeetingmatters.com">support@themeetingmatters.com</a></p>
            
            <p>Welcome aboard!</p>
            
            <p>Best regards,<br>
            <strong>The Meeting Matters Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await EmailService.sendEmail(requesterEmail, subject, htmlContent, '');
  }

  async sendTrialRejectionNotification(requesterEmail: string, requesterName: string, company: string, reason: string): Promise<void> {
    const subject = `Trial Request Update - Meeting Matters`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trial Request Update</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .content { 
            padding: 30px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Trial Request Update</h1>
            <p style="margin: 0; opacity: 0.9;">Thank you for your interest in Meeting Matters</p>
          </div>
          
          <div class="content">
            <p>Hi <strong>${requesterName}</strong>,</p>
            
            <p>Thank you for your interest in Meeting Matters for <strong>${company}</strong>.</p>
            
            <p>After reviewing your trial request, we're unable to approve it at this time. Here's the feedback from our team:</p>
            
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #dc2626;"><strong>Reason:</strong> ${reason}</p>
            </div>

            <p>This doesn't mean we can't work together in the future. If you'd like to discuss your requirements further or if your situation changes, please don't hesitate to reach out.</p>

            <p>You can contact us at <a href="mailto:support@themeetingmatters.com">support@themeetingmatters.com</a> to discuss alternative options.</p>
            
            <p>Thank you for considering Meeting Matters.</p>
            
            <p>Best regards,<br>
            <strong>The Meeting Matters Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await EmailService.sendEmail(requesterEmail, subject, htmlContent, '');
  }
}