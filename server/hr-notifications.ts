import nodemailer from 'nodemailer';

// HR notification email address
const HR_EMAIL = 'hr@themeetingmatters.com';
const SYSTEM_EMAIL = 'noreply@themeetingmatters.com';

// Create transporter using Gmail or any SMTP service
const createTransporter = () => {
  // For development, we'll use a simple configuration
  // In production, you would configure this with your email service
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || SYSTEM_EMAIL,
      pass: process.env.EMAIL_PASS || 'app-password'
    },
    // For development, we'll log emails to console
    streamTransport: process.env.NODE_ENV === 'development',
    newline: 'unix',
    buffer: true
  });
};

interface NotificationData {
  type: string;
  action: string;
  userInfo?: any;
  details?: any;
  timestamp?: Date;
}

export async function sendHRNotification(data: NotificationData) {
  const transporter = createTransporter();
  const timestamp = data.timestamp || new Date();
  
  const subject = `HR Alert: ${data.action}`;
  
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        Business Management System Alert
      </h2>
      
      <div style="background-color: #f8fafc; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937;">Action: ${data.action}</h3>
        <p style="margin: 0; color: #6b7280;">Type: ${data.type}</p>
        <p style="margin: 10px 0 0 0; color: #6b7280;">Timestamp: ${timestamp.toLocaleString()}</p>
      </div>
  `;

  // Add user information if available
  if (data.userInfo) {
    htmlContent += `
      <div style="background-color: #fef3c7; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">User Information:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #92400e;">
    `;
    
    Object.entries(data.userInfo).forEach(([key, value]) => {
      htmlContent += `<li><strong>${key}:</strong> ${value}</li>`;
    });
    
    htmlContent += `
        </ul>
      </div>
    `;
  }

  // Add additional details if available
  if (data.details) {
    htmlContent += `
      <div style="background-color: #ecfdf5; padding: 15px; margin: 15px 0; border-radius: 5px;">
        <h4 style="margin: 0 0 10px 0; color: #065f46;">Additional Details:</h4>
        <div style="color: #065f46;">
    `;
    
    if (typeof data.details === 'string') {
      htmlContent += `<p>${data.details}</p>`;
    } else {
      Object.entries(data.details).forEach(([key, value]) => {
        htmlContent += `<p><strong>${key}:</strong> ${value}</p>`;
      });
    }
    
    htmlContent += `
        </div>
      </div>
    `;
  }

  htmlContent += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>This is an automated notification from the Meeting Matters Business Management System.</p>
        <p>Please do not reply to this email.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: SYSTEM_EMAIL,
    to: HR_EMAIL,
    subject: subject,
    html: htmlContent
  };

  try {
    if (process.env.NODE_ENV === 'development') {
      // In development, log to console instead of sending actual emails
      console.log('\n=== HR NOTIFICATION EMAIL ===');
      console.log('To:', HR_EMAIL);
      console.log('Subject:', subject);
      console.log('Content:', htmlContent.replace(/<[^>]*>/g, '').trim());
      console.log('========================\n');
    } else {
      // In production, send actual email
      await transporter.sendMail(mailOptions);
      console.log('HR notification sent successfully');
    }
  } catch (error) {
    console.error('Failed to send HR notification:', error);
  }
}

// Predefined notification types for common actions
export const NotificationTypes = {
  // User Management
  USER_REGISTERED: 'User Registration',
  USER_APPROVED: 'User Approval',
  USER_REJECTED: 'User Rejection', 
  USER_DELETED: 'User Deletion',
  USER_LOGIN: 'User Login',
  USER_LOGOUT: 'User Logout',
  
  // Onboarding
  ONBOARDING_LINK_GENERATED: 'Onboarding Link Generated',
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  ONBOARDING_ITEM_COMPLETED: 'Onboarding Item Completed',
  
  // Tasks & Projects
  TASK_CREATED: 'Task Created',
  TASK_ASSIGNED: 'Task Assigned',
  TASK_COMPLETED: 'Task Completed',
  PROJECT_CREATED: 'Project Created',
  PROJECT_MEMBER_ADDED: 'Project Member Added',
  
  // Logistics
  LOGISTICS_REQUEST: 'Logistics Request',
  LOGISTICS_APPROVED: 'Logistics Approved',
  
  // Documents
  DOCUMENT_UPLOADED: 'Document Uploaded',
  DOCUMENT_APPROVED: 'Document Approved',
  
  // Tests
  PSYCHOMETRIC_TEST_COMPLETED: 'Psychometric Test Completed',
  TEST_RESULTS_GENERATED: 'Test Results Generated',
  
  // Trial Requests
  TRIAL_REQUEST_SUBMITTED: 'New Trial Request Submitted',
  
  // System
  SYSTEM_ERROR: 'System Error',
  SECURITY_ALERT: 'Security Alert'
};

// Helper functions for common notifications
export const HRNotifications = {
  userRegistered: (userInfo: any) => 
    sendHRNotification({
      type: 'User Management',
      action: NotificationTypes.USER_REGISTERED,
      userInfo: {
        Name: `${userInfo.firstName} ${userInfo.lastName}`,
        Email: userInfo.email,
        Username: userInfo.username,
        'Requested Role': userInfo.requestedRole,
        Department: userInfo.requestedDepartment || 'Not specified',
        Position: userInfo.position || 'Not specified'
      },
      details: 'New user registration requires approval'
    }),

  userApproved: (userInfo: any, approver: any) => 
    sendHRNotification({
      type: 'User Management',
      action: NotificationTypes.USER_APPROVED,
      userInfo: {
        Name: `${userInfo.firstName} ${userInfo.lastName}`,
        Email: userInfo.email,
        Role: userInfo.requestedRole,
        Department: userInfo.requestedDepartment
      },
      details: {
        'Approved By': `${approver.firstName} ${approver.lastName}`,
        'Approver Email': approver.email,
        Notes: userInfo.reviewNotes || 'No additional notes'
      }
    }),

  onboardingLinkGenerated: (userInfo: any, link: string) => 
    sendHRNotification({
      type: 'Onboarding',
      action: NotificationTypes.ONBOARDING_LINK_GENERATED,
      userInfo: {
        Name: `${userInfo.firstName} ${userInfo.lastName}`,
        Email: userInfo.email,
        Role: userInfo.requestedRole
      },
      details: {
        'Onboarding Link': link,
        Status: 'Link generated and ready to be sent to employee'
      }
    }),

  taskCreated: (task: any, creator: any) => 
    sendHRNotification({
      type: 'Task Management',
      action: NotificationTypes.TASK_CREATED,
      userInfo: {
        'Created By': `${creator.firstName} ${creator.lastName}`,
        'Creator Email': creator.email
      },
      details: {
        'Task Title': task.title,
        Description: task.description,
        Priority: task.priority,
        'Due Date': task.dueDate || 'Not set'
      }
    }),

  documentUploaded: (document: any, uploader: any) => 
    sendHRNotification({
      type: 'Document Management',
      action: NotificationTypes.DOCUMENT_UPLOADED,
      userInfo: {
        'Uploaded By': `${uploader.firstName} ${uploader.lastName}`,
        'Uploader Email': uploader.email
      },
      details: {
        'Document Name': document.fileName,
        'Document Type': document.documentType,
        Size: document.fileSize ? `${(document.fileSize / 1024).toFixed(2)} KB` : 'Unknown'
      }
    }),

  trialRequestSubmitted: (trialRequest: any) => 
    sendHRNotification({
      type: 'Trial Management',
      action: NotificationTypes.TRIAL_REQUEST_SUBMITTED,
      userInfo: {
        Name: trialRequest.name,
        Email: trialRequest.email,
        Company: trialRequest.company,
        'Job Title': trialRequest.job_title || 'Not specified',
        'Team Size': trialRequest.team_size,
        'Phone Number': trialRequest.phone || 'Not provided'
      },
      details: {
        'Requested Plan': trialRequest.plan_id || 'Not specified',
        'Billing Cycle': trialRequest.billing_cycle || 'Not specified',
        Status: 'Pending Approval',
        'Submitted At': new Date(trialRequest.created_at).toLocaleString(),
        Notes: trialRequest.notes || 'No additional notes provided'
      }
    }),

  systemError: (error: any, context: string) => 
    sendHRNotification({
      type: 'System',
      action: NotificationTypes.SYSTEM_ERROR,
      details: {
        Context: context,
        'Error Message': error.message,
        'Stack Trace': error.stack?.substring(0, 500) + '...'
      }
    })
};