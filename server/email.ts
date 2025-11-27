import nodemailer from 'nodemailer';

// Email service configuration
interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

// Create email transporter based on environment
function createTransporter() {
  // For development/testing, use Ethereal (fake SMTP)
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  // For production, you can configure various SMTP providers
  const config: EmailConfig = {};
  
  // Gmail SMTP (if using Gmail)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    config.host = 'smtp.gmail.com';
    config.port = 587;
    config.secure = false;
    config.auth = {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '' // Use app password for Gmail
    };
  }
  // Outlook/Hotmail SMTP
  else if (process.env.EMAIL_SERVICE === 'outlook') {
    config.host = 'smtp-mail.outlook.com';
    config.port = 587;
    config.secure = false;
    config.auth = {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    };
  }
  // Generic SMTP configuration
  else {
    config.host = process.env.SMTP_HOST || 'localhost';
    config.port = parseInt(process.env.SMTP_PORT || '587');
    config.secure = process.env.SMTP_SECURE === 'true';
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      config.auth = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      };
    }
  }

  return nodemailer.createTransport(config);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@themeetingmatters.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const info = await transporter.sendMail(mailOptions);
    
    // In development, log the preview URL
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent successfully!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    } else {
      console.log('Email sent:', info.messageId);
    }
    
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export function generateOnboardingEmail(employeeName: string, onboardingLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Meeting Matters</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { 
          display: inline-block; 
          background: #2563eb; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Meeting Matters!</h1>
          <p>Your HR Management Platform</p>
        </div>
        <div class="content">
          <h2>Hello ${employeeName},</h2>
          <p>Welcome to our team! We're excited to have you join Meeting Matters.</p>
          
          <p>To get started with your onboarding process, please click the button below to access your personalized onboarding portal:</p>
          
          <div style="text-align: center;">
            <a href="${onboardingLink}" class="button">Start Onboarding Process</a>
          </div>
          
          <p>In the onboarding portal, you'll be able to:</p>
          <ul>
            <li>Complete your personal information</li>
            <li>Upload required documents</li>
            <li>Review company policies</li>
            <li>Take psychometric assessments</li>
            <li>Connect with your team</li>
          </ul>
          
          <p>If you have any questions or need assistance, please don't hesitate to reach out to our HR team.</p>
          
          <p>We look forward to working with you!</p>
          
          <p>Best regards,<br>
          The Meeting Matters HR Team</p>
        </div>
        <div class="footer">
          <p>This email was sent from Meeting Matters Business Management System</p>
          <p>If you're having trouble clicking the button, copy and paste this link into your browser:</p>
          <p><a href="${onboardingLink}">${onboardingLink}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendOnboardingEmail(employeeEmail: string, employeeName: string, onboardingToken?: string): Promise<boolean> {
  const baseUrl = process.env.REPLIT_URL || 'http://localhost:5000';
  const onboardingLink = onboardingToken 
    ? `${baseUrl}/employee-onboarding?token=${onboardingToken}`
    : `${baseUrl}/employee-onboarding`;
  
  // Use real Gmail service if credentials are available
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    try {
      const { EmailService } = await import('./emailService');
      await EmailService.sendDirectEmail(
        employeeEmail,
        `Welcome to Meeting Matters - Start Your Onboarding Process`,
        generateOnboardingEmail(employeeName, onboardingLink)
      );
      console.log(`✅ Onboarding email sent successfully to ${employeeEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send onboarding email to ${employeeEmail}:`, error);
      return false;
    }
  }
  
  // Fallback to test email service for development
  const { sendTestEmail } = await import('./email-config');
  const result = await sendTestEmail(
    employeeEmail,
    `Welcome to Meeting Matters - Start Your Onboarding Process`,
    generateOnboardingEmail(employeeName, onboardingLink)
  );
  return result.success;
}

export function generateLogisticsManagerAssignmentEmail(employeeName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Logistics Manager Role Assignment</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
        .btn { display: inline-block; background: #4caf50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛠️ New Role Assignment</h1>
          <h2>Logistics Manager</h2>
        </div>
        <div class="content">
          <h2>Congratulations ${employeeName}!</h2>
          <p>You have been assigned the <strong>Logistics Manager</strong> role in Meeting Matters Business Management System.</p>
          
          <div class="highlight">
            <h3>📋 Your New Responsibilities Include:</h3>
            <ul>
              <li>Manage and approve logistics requests</li>
              <li>Track inventory and stock levels</li>
              <li>Monitor monthly expense reports in PKR currency</li>
              <li>Oversee vendor relationships and purchases</li>
              <li>Access comprehensive logistics dashboard and analytics</li>
            </ul>
          </div>
          
          <div class="highlight">
            <h3>🚀 Getting Started:</h3>
            <p>1. Log into your account using your existing credentials</p>
            <p>2. Navigate to the <strong>Logistics</strong> section in the main menu</p>
            <p>3. Review pending requests and current inventory status</p>
            <p>4. Familiarize yourself with the logistics workflow and approval process</p>
          </div>
          
          <p>If you have any questions about your new role or need assistance accessing the logistics features, please contact your HR administrator.</p>
          
          <p>Best regards,<br>Meeting Matters HR Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Meeting Matters Business Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendLogisticsManagerAssignmentEmail(employeeEmail: string, employeeName: string): Promise<boolean> {
  // Use real Gmail service if credentials are available
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    try {
      const { EmailService } = await import('./emailService');
      await EmailService.sendDirectEmail(
        employeeEmail,
        `🛠️ New Role Assignment: Logistics Manager - Meeting Matters`,
        generateLogisticsManagerAssignmentEmail(employeeName)
      );
      console.log(`✅ Logistics manager assignment email sent successfully to ${employeeEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send logistics manager assignment email to ${employeeEmail}:`, error);
      return false;
    }
  }
  
  // Fallback to test email service for development
  const { sendTestEmail } = await import('./email-config');
  const result = await sendTestEmail(
    employeeEmail,
    `🛠️ New Role Assignment: Logistics Manager - Meeting Matters`,
    generateLogisticsManagerAssignmentEmail(employeeName)
  );
  return result.success;
}

// Generate HTML template for daily project report
function generateDailyProjectReportEmail(projectData: any, reportDate: string): string {
  const { project, dailyStats, tasks, messages, files, notes } = projectData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Project Report - ${project.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9ff; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; }
        .stat-number { font-size: 32px; font-weight: bold; color: #667eea; margin: 0; }
        .stat-label { color: #666; margin: 5px 0 0 0; font-size: 14px; }
        .section { margin: 30px 0; }
        .section h3 { color: #333; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .activity-item { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #4ade80; }
        .priority-high { border-left-color: #ef4444; }
        .priority-medium { border-left-color: #f59e0b; }
        .priority-low { border-left-color: #10b981; }
        .footer { background: #f1f5f9; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #666; }
        .no-activity { text-align: center; color: #888; font-style: italic; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Daily Project Report</h1>
          <p><strong>${project.name}</strong> • ${reportDate}</p>
        </div>
        
        <div class="content">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${dailyStats.tasksCreated}</div>
              <div class="stat-label">Tasks Created</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${dailyStats.tasksCompleted}</div>
              <div class="stat-label">Tasks Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${dailyStats.messagesCount}</div>
              <div class="stat-label">Messages</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${dailyStats.filesUploaded}</div>
              <div class="stat-label">Files Uploaded</div>
            </div>
          </div>

          <div class="section">
            <h3>📋 Task Activities</h3>
            ${tasks.length > 0 ? tasks.map((task: any) => `
              <div class="activity-item priority-${task.priority || 'low'}">
                <strong>${task.title}</strong>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">
                  Status: ${task.status} | Priority: ${task.priority || 'Normal'}
                  ${task.assignedToUser ? ` | Assigned: ${task.assignedToUser.firstName} ${task.assignedToUser.lastName}` : ''}
                </div>
              </div>
            `).join('') : '<div class="no-activity">No task activities today</div>'}
          </div>

          <div class="section">
            <h3>💬 Communication</h3>
            ${messages.length > 0 ? messages.map((msg: any) => `
              <div class="activity-item">
                <strong>${msg.senderName || 'Team Member'}</strong>
                <div style="font-size: 14px; margin-top: 5px;">${msg.content}</div>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">${new Date(msg.createdAt).toLocaleTimeString()}</div>
              </div>
            `).join('') : '<div class="no-activity">No messages today</div>'}
          </div>

          <div class="section">
            <h3>📁 Files & Documents</h3>
            ${files.length > 0 ? files.map((file: any) => `
              <div class="activity-item">
                <strong>📄 ${file.fileName}</strong>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">
                  Type: ${file.fileType} | Size: ${Math.round(file.fileSize / 1024)} KB
                  <br>Uploaded: ${new Date(file.uploadedAt).toLocaleTimeString()}
                </div>
              </div>
            `).join('') : '<div class="no-activity">No files uploaded today</div>'}
          </div>

          ${notes && notes.length > 0 ? `
            <div class="section">
              <h3>📝 Notes & Updates</h3>
              ${notes.map((note: any) => `
                <div class="activity-item">
                  <div style="font-size: 14px;">${note.content}</div>
                  <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    ${new Date(note.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Generated by Meeting Matters Business Management System</p>
          <p>Report Date: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send daily project report email
export async function sendDailyProjectReport(
  toEmail: string, 
  projectData: any, 
  reportDate: string
): Promise<boolean> {
  const subject = `Daily Project Report - ${projectData.project.name} (${reportDate})`;
  const html = generateDailyProjectReportEmail(projectData, reportDate);
  
  // Use real Gmail service if credentials are available
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    try {
      const { EmailService } = await import('./emailService');
      await EmailService.sendDirectEmail(
        toEmail,
        subject,
        html
      );
      console.log(`✅ Daily project report sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send daily project report to ${toEmail}:`, error);
      return false;
    }
  }
  
  // Fallback to test email service for development
  return sendEmail({
    to: toEmail,
    subject,
    html,
    text: `Daily Project Report for ${projectData.project.name} on ${reportDate}`
  });
}

// Send interview scheduled notification
export async function sendInterviewScheduledEmail(
  toEmail: string, 
  interviewDetails: {
    firstName: string;
    lastName: string;
    position: string;
    interviewDate: Date;
    interviewType: string;
    interviewLocation: string;
    interviewNotes?: string;
  }
): Promise<boolean> {
  const { firstName, lastName, position, interviewDate, interviewType, interviewLocation, interviewNotes } = interviewDetails;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
        .interview-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #667eea; }
        .detail-row { display: flex; margin: 10px 0; align-items: center; }
        .detail-label { font-weight: bold; min-width: 120px; color: #555; }
        .detail-value { color: #333; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .icon { width: 20px; height: 20px; margin-right: 10px; vertical-align: middle; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Interview Scheduled</h1>
          <p>Meeting Matters - Business Management System</p>
        </div>
        <div class="content">
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>Great news! We have scheduled an interview for your application for the <strong>${position}</strong> position.</p>
          
          <div class="interview-card">
            <h3>Interview Details</h3>
            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span class="detail-value">${formatDate(interviewDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⏰ Time:</span>
              <span class="detail-value">${formatTime(interviewDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">💻 Type:</span>
              <span class="detail-value">${interviewType === 'video' ? '🎥 Video Call' : 
                                        interviewType === 'phone' ? '📞 Phone Call' : 
                                        '🏢 In-Person'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📍 Location:</span>
              <span class="detail-value">${interviewLocation}</span>
            </div>
            ${interviewNotes ? `
            <div class="detail-row">
              <span class="detail-label">📝 Notes:</span>
              <span class="detail-value">${interviewNotes}</span>
            </div>
            ` : ''}
          </div>
          
          <h3>What to Expect:</h3>
          <ul>
            <li>The interview will last approximately 30-45 minutes</li>
            <li>Please prepare questions about the role and company</li>
            <li>Be ready to discuss your experience and qualifications</li>
            ${interviewType === 'video' ? '<li>Test your camera and microphone beforehand</li>' : ''}
            ${interviewType === 'in-person' ? '<li>Please arrive 10 minutes early</li>' : ''}
          </ul>
          
          <p>We look forward to meeting with you! If you need to reschedule or have any questions, please contact us immediately.</p>
          
          <p>Best regards,<br>
          <strong>HR Team</strong><br>
          Meeting Matters - Business Management System</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Meeting Matters Business Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Use real Gmail service if credentials are available
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    try {
      const { EmailService } = await import('./emailService');
      await EmailService.sendDirectEmail(
        toEmail,
        `Interview Scheduled - ${position} Position`,
        htmlContent
      );
      console.log(`✅ Interview notification sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send interview notification to ${toEmail}:`, error);
      return false;
    }
  }

  return sendEmail({
    to: toEmail,
    subject: `Interview Scheduled - ${position} Position`,
    html: htmlContent
  });
}