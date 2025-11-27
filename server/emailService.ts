import nodemailer from 'nodemailer';
import type { Employee, Task, Project, Recognition } from '@shared/schema';

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error: any, success: any) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email service ready to send notifications');
  }
});

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static fromEmail = process.env.GMAIL_USER || 'meetingmatters786@gmail.com';
  private static companyName = 'Meeting Matters';

  // Send task assignment notification
  static async sendTaskAssignmentEmail(
    employee: Employee,
    task: Task,
    assignedBy: string
  ): Promise<void> {
    const template = this.getTaskAssignmentTemplate(employee, task, assignedBy);
    
    await this.sendEmail(
      employee.personalEmail || `${employee.employeeId}@company.com`,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send project notification
  static async sendProjectNotificationEmail(
    employee: Employee,
    project: Project,
    notificationType: 'assigned' | 'updated' | 'completed'
  ): Promise<void> {
    const template = this.getProjectNotificationTemplate(employee, project, notificationType);
    
    await this.sendEmail(
      employee.personalEmail || `${employee.employeeId}@company.com`,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send recognition nomination notification
  static async sendRecognitionNotificationEmail(
    nominee: Employee,
    nominator: Employee,
    recognition: Recognition
  ): Promise<void> {
    const template = this.getRecognitionNotificationTemplate(nominee, nominator, recognition);
    
    await this.sendEmail(
      nominee.personalEmail || `${nominee.employeeId}@company.com`,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send contract signing confirmation email
  static async sendContractSigningNotificationEmail(
    employee: Employee,
    contractDetails: {
      contractType: string;
      position: string;
      signedAt: Date;
      digitalSignature: string;
    }
  ): Promise<void> {
    // Send email to employee
    const employeeTemplate = this.getContractSigningEmployeeTemplate(employee, contractDetails);
    await this.sendEmail(
      employee.personalEmail || `${employee.employeeId}@company.com`,
      employeeTemplate.subject,
      employeeTemplate.html,
      employeeTemplate.text
    );

    // Send email to HR
    const hrTemplate = this.getContractSigningHRTemplate(employee, contractDetails);
    await this.sendEmail(
      'hr@themeetingmatters.com',
      hrTemplate.subject,
      hrTemplate.html,
      hrTemplate.text
    );
  }

  // Send trial request notification to HR admins
  static async sendTrialRequestNotification(
    hrUser: any,
    trialRequest: any
  ): Promise<void> {
    const template = this.getTrialRequestNotificationTemplate(hrUser, trialRequest);
    
    await this.sendEmail(
      hrUser.email,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send trial approval email to requestor
  static async sendTrialApprovalEmail(
    trialRequest: any,
    trialUser: any,
    trialDetails: any
  ): Promise<void> {
    const template = this.getTrialApprovalTemplate(trialRequest, trialUser, trialDetails);
    
    await this.sendEmail(
      trialRequest.email,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send trial rejection email to requestor
  static async sendTrialRejectionEmail(
    trialRequest: any,
    reason: string
  ): Promise<void> {
    const template = this.getTrialRejectionTemplate(trialRequest, reason);
    
    await this.sendEmail(
      trialRequest.email,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send general notification
  static async sendGeneralNotificationEmail(
    employee: Employee,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    const template = this.getGeneralNotificationTemplate(employee, title, message, actionUrl);
    
    await this.sendEmail(
      employee.personalEmail || `${employee.employeeId}@company.com`,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send onboarding update notification
  static async sendOnboardingUpdateEmail(
    employee: Employee,
    itemTitle: string,
    status: 'completed' | 'assigned'
  ): Promise<void> {
    const template = this.getOnboardingUpdateTemplate(employee, itemTitle, status);
    
    await this.sendEmail(
      employee.personalEmail || `${employee.employeeId}@company.com`,
      template.subject,
      template.html,
      template.text
    );
  }

  // Core email sending method
  private static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<void> {
    try {
      await transporter.sendMail({
        from: `"${this.companyName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text,
      });
      console.log(`Email sent successfully to ${to}: ${subject}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  // Public method for sending direct emails (for onboarding and role assignments)
  static async sendDirectEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    try {
      await transporter.sendMail({
        from: `"${this.companyName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
      });
      console.log(`Direct email sent successfully to ${to}: ${subject}`);
    } catch (error) {
      console.error(`Failed to send direct email to ${to}:`, error);
      throw error;
    }
  }

  // Email templates
  private static getTaskAssignmentTemplate(
    employee: Employee,
    task: Task,
    assignedBy: string
  ): EmailTemplate {
    const subject = `New Task Assigned: ${task.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .task-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>New Task Assignment</h2>
            </div>
            <div class="content">
              <p>Hello ${employee.preferredName || 'Team Member'},</p>
              <p>You have been assigned a new task by <strong>${assignedBy}</strong>.</p>
              
              <div class="task-details">
                <h3>📋 Task Details</h3>
                <p><strong>Title:</strong> ${task.title}</p>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}</p>
                <p><strong>Status:</strong> ${task.status}</p>
              </div>
              
              <p>Please review the task details and begin work when ready.</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/tasks" class="btn">View Task</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName} HR System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - New Task Assignment
      
      Hello ${employee.preferredName || 'Team Member'},
      
      You have been assigned a new task by ${assignedBy}.
      
      Task Details:
      - Title: ${task.title}
      - Description: ${task.description}
      - Priority: ${task.priority}
      - Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}
      - Status: ${task.status}
      
      Please review the task details and begin work when ready.
      
      Visit: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/tasks
    `;

    return { subject, html, text };
  }

  private static getProjectNotificationTemplate(
    employee: Employee,
    project: Project,
    notificationType: 'assigned' | 'updated' | 'completed'
  ): EmailTemplate {
    const actionMap = {
      assigned: 'assigned to',
      updated: 'updated for',
      completed: 'completed in'
    };

    const subject = `Project ${actionMap[notificationType]}: ${project.name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .project-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>Project Notification</h2>
            </div>
            <div class="content">
              <p>Hello ${employee.preferredName || 'Team Member'},</p>
              <p>You have been ${actionMap[notificationType]} a project.</p>
              
              <div class="project-details">
                <h3>🚀 Project Details</h3>
                <p><strong>Name:</strong> ${project.name}</p>
                <p><strong>Description:</strong> ${project.description}</p>
                <p><strong>Status:</strong> ${project.status}</p>
                <p><strong>Priority:</strong> ${project.priority}</p>
                <p><strong>Start Date:</strong> ${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not specified'}</p>
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/projects/${project.id}" class="btn">View Project</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName} HR System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Project Notification
      
      Hello ${employee.preferredName || 'Team Member'},
      
      You have been ${actionMap[notificationType]} a project.
      
      Project Details:
      - Name: ${project.name}
      - Description: ${project.description}
      - Status: ${project.status}
      - Priority: ${project.priority}
      - Start Date: ${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not specified'}
      
      Visit: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/projects/${project.id}
    `;

    return { subject, html, text };
  }

  private static getRecognitionNotificationTemplate(
    nominee: Employee,
    nominator: Employee,
    recognition: Recognition
  ): EmailTemplate {
    const subject = `🏆 You've been nominated for recognition!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .recognition-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>🏆 Recognition Nomination</h2>
            </div>
            <div class="content">
              <p>Congratulations ${nominee.preferredName || 'Team Member'}!</p>
              <p>You have been nominated for recognition by <strong>${nominator.preferredName || nominator.employeeId}</strong>.</p>
              
              <div class="recognition-details">
                <h3>🎉 Recognition Details</h3>
                <p><strong>Type:</strong> ${recognition.type}</p>
                <p><strong>Description:</strong> ${recognition.description}</p>
                <p><strong>Nominated by:</strong> ${nominator.preferredName || nominator.employeeId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Your hard work and dedication are truly appreciated!</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/recognition" class="btn">View Recognition</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName} HR System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Recognition Nomination
      
      Congratulations ${nominee.preferredName || 'Team Member'}!
      
      You have been nominated for recognition by ${nominator.preferredName || nominator.employeeId}.
      
      Recognition Details:
      - Type: ${recognition.type}
      - Description: ${recognition.description}
      - Nominated by: ${nominator.preferredName || nominator.employeeId}
      - Date: ${new Date().toLocaleDateString()}
      
      Your hard work and dedication are truly appreciated!
      
      Visit: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/recognition
    `;

    return { subject, html, text };
  }

  private static getOnboardingUpdateTemplate(
    employee: Employee,
    itemTitle: string,
    status: 'completed' | 'assigned'
  ): EmailTemplate {
    const subject = status === 'completed' 
      ? `✅ Onboarding Step Completed: ${itemTitle}`
      : `📋 New Onboarding Step: ${itemTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .onboarding-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>Onboarding Update</h2>
            </div>
            <div class="content">
              <p>Hello ${employee.preferredName || 'New Team Member'},</p>
              <p>${status === 'completed' 
                ? 'Congratulations! You have completed an onboarding step.'
                : 'You have a new onboarding step to complete.'}</p>
              
              <div class="onboarding-details">
                <h3>${status === 'completed' ? '✅' : '📋'} ${itemTitle}</h3>
                <p><strong>Status:</strong> ${status === 'completed' ? 'Completed' : 'Pending'}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>${status === 'completed' 
                ? 'Keep up the great work! Continue with your remaining onboarding tasks.'
                : 'Please complete this step to continue with your onboarding process.'}</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/employee-dashboard" class="btn">View Onboarding</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName} HR System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Onboarding Update
      
      Hello ${employee.preferredName || 'New Team Member'},
      
      ${status === 'completed' 
        ? 'Congratulations! You have completed an onboarding step.'
        : 'You have a new onboarding step to complete.'}
      
      Step: ${itemTitle}
      Status: ${status === 'completed' ? 'Completed' : 'Pending'}
      Date: ${new Date().toLocaleDateString()}
      
      ${status === 'completed' 
        ? 'Keep up the great work! Continue with your remaining onboarding tasks.'
        : 'Please complete this step to continue with your onboarding process.'}
      
      Visit: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/employee-dashboard
    `;

    return { subject, html, text };
  }

  private static getGeneralNotificationTemplate(
    employee: Employee,
    title: string,
    message: string,
    actionUrl?: string
  ): EmailTemplate {
    const subject = `${this.companyName} Notification: ${title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .message-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #1f2937; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>📢 ${title}</h2>
            </div>
            <div class="content">
              <p>Hello ${employee.preferredName || 'Team Member'},</p>
              
              <div class="message-details">
                <p>${message}</p>
              </div>
              
              ${actionUrl ? `<a href="${actionUrl}" class="btn">Take Action</a>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName} HR System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - ${title}
      
      Hello ${employee.preferredName || 'Team Member'},
      
      ${message}
      
      ${actionUrl ? `Visit: ${actionUrl}` : ''}
    `;

    return { subject, html, text };
  }

  // Send overdue task reminder email
  static async sendOverdueTaskReminderEmail(
    employee: Employee,
    overdueTasksCount: number = 1,
    specificTask?: any
  ): Promise<void> {
    const taskDetails = specificTask ? 
      `Your task "${specificTask.title}" was due on ${new Date(specificTask.dueDate).toLocaleDateString()} and requires immediate attention.` :
      `You have ${overdueTasksCount} overdue task${overdueTasksCount > 1 ? 's' : ''} that require immediate attention.`;

    const subject = `[URGENT] Overdue Task Reminder - Immediate Action Required`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Overdue Task Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .urgent-banner { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .task-details { background: white; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ URGENT REMINDER</h1>
            <h2>${this.companyName} - Overdue Task Alert</h2>
          </div>
          <div class="content">
            <h2>Hello ${employee.preferredName || employee.employeeId},</h2>
            
            <div class="urgent-banner">
              <strong>⏰ IMMEDIATE ACTION REQUIRED</strong><br>
              This is an urgent reminder about your overdue task(s).
            </div>
            
            <div class="task-details">
              <h3>Task Status: OVERDUE</h3>
              <p>${taskDetails}</p>
              ${specificTask ? `
                <p><strong>Task:</strong> ${specificTask.title}</p>
                <p><strong>Description:</strong> ${specificTask.description || 'No description provided'}</p>
                <p><strong>Priority:</strong> ${specificTask.priority?.toUpperCase() || 'MEDIUM'}</p>
                <p><strong>Due Date:</strong> ${new Date(specificTask.dueDate).toLocaleDateString()}</p>
              ` : ''}
            </div>
            
            <p>Please complete your overdue task(s) as soon as possible. If you need assistance or have encountered any blockers, please reach out to your supervisor immediately.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/tasks" class="button">View My Tasks</a>
            
            <p><strong>Important:</strong> Continued delays may affect your performance evaluation. Please prioritize the completion of these tasks.</p>
            
            <p>Best regards,<br>${this.companyName} HR Team</p>
          </div>
          <div class="footer">
            <p>This is an automated overdue task reminder from ${this.companyName} HR System.</p>
            <p>If you believe this email was sent in error, please contact your supervisor.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${this.companyName} - URGENT: Overdue Task Reminder
      
      Hello ${employee.preferredName || employee.employeeId},
      
      IMMEDIATE ACTION REQUIRED: This is an urgent reminder about your overdue task(s).
      
      ${taskDetails}
      
      ${specificTask ? `
      Task Details:
      - Title: ${specificTask.title}
      - Description: ${specificTask.description || 'No description provided'}
      - Priority: ${specificTask.priority?.toUpperCase() || 'MEDIUM'}
      - Due Date: ${new Date(specificTask.dueDate).toLocaleDateString()}
      ` : ''}
      
      Please complete your overdue task(s) as soon as possible. If you need assistance or have encountered any blockers, please reach out to your supervisor immediately.
      
      View your tasks: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/tasks
      
      Important: Continued delays may affect your performance evaluation. Please prioritize the completion of these tasks.
      
      Best regards,
      ${this.companyName} HR Team
    `;

    await this.sendEmail(
      employee.personalEmail || `${employee.employeeId}@company.com`,
      subject,
      html,
      text
    );
  }

  // Trial Request Email Templates

  private static getTrialRequestNotificationTemplate(
    hrUser: any,
    trialRequest: any
  ): EmailTemplate {
    const subject = `New Trial Request - ${trialRequest.company}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .trial-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>New Trial Request Received</h2>
            </div>
            <div class="content">
              <p>Hello ${hrUser.firstName || 'HR Admin'},</p>
              <p>A new trial request has been submitted and requires your review:</p>
              
              <div class="trial-details">
                <h3>Trial Request Details</h3>
                <p><strong>Company:</strong> ${trialRequest.company}</p>
                <p><strong>Contact Name:</strong> ${trialRequest.name}</p>
                <p><strong>Email:</strong> ${trialRequest.email}</p>
                <p><strong>Job Title:</strong> ${trialRequest.jobTitle}</p>
                <p><strong>Team Size:</strong> ${trialRequest.teamSize}</p>
                <p><strong>Plan:</strong> ${trialRequest.planId} (${trialRequest.billingCycle})</p>
                ${trialRequest.phone ? `<p><strong>Phone:</strong> ${trialRequest.phone}</p>` : ''}
                <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p>Please review this request and take appropriate action:</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin/trial-requests" class="btn">Review Trial Requests</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName} System</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - New Trial Request
      
      Hello ${hrUser.firstName || 'HR Admin'},
      
      A new trial request has been submitted:
      
      Company: ${trialRequest.company}
      Contact: ${trialRequest.name}
      Email: ${trialRequest.email}
      Job Title: ${trialRequest.jobTitle}
      Team Size: ${trialRequest.teamSize}
      Plan: ${trialRequest.planId} (${trialRequest.billingCycle})
      ${trialRequest.phone ? `Phone: ${trialRequest.phone}` : ''}
      
      Please review: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin/trial-requests
    `;

    return { subject, html, text };
  }

  private static getTrialApprovalTemplate(
    trialRequest: any,
    trialUser: any,
    trialDetails: any
  ): EmailTemplate {
    const subject = `Trial Approved - Welcome to ${this.companyName}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .approval-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .trial-info { background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Trial Approved!</h1>
              <h2>Welcome to ${this.companyName}</h2>
            </div>
            <div class="content">
              <p>Hello ${trialRequest.name},</p>
              <p>Great news! Your trial request has been approved. You now have access to our ${trialDetails.planName} plan.</p>
              
              <div class="trial-info">
                <h3>Trial Details</h3>
                <p><strong>Plan:</strong> ${trialDetails.planName}</p>
                <p><strong>Trial Period:</strong> ${new Date(trialDetails.trialStartDate).toLocaleDateString()} - ${new Date(trialDetails.trialEndDate).toLocaleDateString()}</p>
                <p><strong>Username:</strong> ${trialUser.username}</p>
                <p><strong>Login Email:</strong> ${trialUser.email}</p>
              </div>
              
              <div class="approval-details">
                <h3>Getting Started</h3>
                <p>1. Click the button below to access your trial account</p>
                <p>2. You'll need to set up your password on first login</p>
                <p>3. Explore all the features available in your plan</p>
                <p>4. Contact our support team if you need any assistance</p>
              </div>
              
              <a href="${trialDetails.loginUrl}" class="btn">Access Your Trial</a>
              
              <p>If you have any questions during your trial, please don't hesitate to reach out to our support team.</p>
              
              <p>Welcome aboard!</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Trial Approved!
      
      Hello ${trialRequest.name},
      
      Great news! Your trial request has been approved.
      
      Trial Details:
      - Plan: ${trialDetails.planName}
      - Trial Period: ${new Date(trialDetails.trialStartDate).toLocaleDateString()} - ${new Date(trialDetails.trialEndDate).toLocaleDateString()}
      - Username: ${trialUser.username}
      - Login Email: ${trialUser.email}
      
      Getting Started:
      1. Visit: ${trialDetails.loginUrl}
      2. Set up your password on first login
      3. Explore all available features
      4. Contact support if you need help
      
      Welcome aboard!
    `;

    return { subject, html, text };
  }

  private static getTrialRejectionTemplate(
    trialRequest: any,
    reason: string
  ): EmailTemplate {
    const subject = `Trial Request Update - ${this.companyName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .rejection-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>Trial Request Update</h2>
            </div>
            <div class="content">
              <p>Hello ${trialRequest.name},</p>
              <p>Thank you for your interest in ${this.companyName}. We have reviewed your trial request and unfortunately, we are unable to approve it at this time.</p>
              
              <div class="rejection-details">
                <h3>Reason for Rejection</h3>
                <p>${reason}</p>
              </div>
              
              <p>We encourage you to address the feedback above and submit a new trial request in the future.</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/subscribe" class="btn">Submit New Request</a>
              
              <p>If you have any questions about this decision, please feel free to contact our team.</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Trial Request Update
      
      Hello ${trialRequest.name},
      
      Thank you for your interest in ${this.companyName}. We have reviewed your trial request and unfortunately, we are unable to approve it at this time.
      
      Reason: ${reason}
      
      We encourage you to address the feedback above and submit a new trial request in the future.
      
      Submit new request: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/subscribe
      
      If you have questions, please contact our team.
    `;

    return { subject, html, text };
  }

  // Send trial credentials to new trial user
  static async sendTrialCredentials(
    user: any,
    password: string
  ): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    // ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    // : 'https://your-app.replit.dev';

    const template = this.getTrialCredentialsTemplate(user, password, baseUrl);
    
    await this.sendEmail(
      user.email,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send trial login instructions
  static async sendTrialLoginInstructions(
    user: any,
    password: string
  ): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    // ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    // : 'https://your-app.replit.dev';

    const template = this.getTrialLoginInstructionsTemplate(user, password, baseUrl);
    
    await this.sendEmail(
      user.email,
      template.subject,
      template.html,
      template.text
    );
  }

  private static getTrialCredentialsTemplate(
    user: any,
    password: string,
    baseUrl: string
  ): EmailTemplate {
    const subject = `🚀 Your ${this.companyName} Trial is Ready!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .credentials { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>🚀 Your Trial Account is Ready!</h2>
            </div>
            <div class="content">
              <p>Hello ${user.firstName} ${user.lastName},</p>
              <p>Welcome to ${this.companyName}! Your 14-day trial account has been successfully created.</p>
              
              <div class="credentials">
                <h3>🔐 Your Login Credentials</h3>
                <p><strong>Website:</strong> <a href="${baseUrl}/trial-access/${user.username}">${baseUrl}/trial-access/${user.username}</a></p>
                <p><strong>Username:</strong> ${user.username}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Company:</strong> ${user.companyName}</p>
              </div>
              
              <p>During your trial, you'll have access to all Professional plan features including:</p>
              <ul>
                <li>Complete HR management system</li>
                <li>Employee onboarding automation</li>
                <li>Task and project management</li>
                <li>Recognition and analytics</li>
                <li>Logistics management</li>
              </ul>
              
              <a href="${baseUrl}/trial-access/${user.username}" class="btn">Access Your Trial</a>
              
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>This email contains sensitive login information. Please keep it secure.</p>
              <p>${this.companyName} - HR Management Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Your Trial Account is Ready!
      
      Hello ${user.firstName} ${user.lastName},
      
      Welcome to ${this.companyName}! Your 14-day trial account has been successfully created.
      
      Login Credentials:
      - Website: ${baseUrl}/trial-access/${user.username}
      - Username: ${user.username}
      - Password: ${password}
      - Company: ${user.companyName}
      
      During your trial, you'll have access to all Professional plan features.
      
      Access your trial: ${baseUrl}/trial-access/${user.username}
    `;

    return { subject, html, text };
  }

  private static getTrialLoginInstructionsTemplate(
    user: any,
    password: string,
    baseUrl: string
  ): EmailTemplate {
    const subject = `🔑 ${this.companyName} Login Instructions`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .credentials { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>🔑 Login Instructions</h2>
            </div>
            <div class="content">
              <p>Hello ${user.firstName} ${user.lastName},</p>
              <p>Here are your updated login credentials for ${this.companyName}:</p>
              
              <div class="credentials">
                <h3>🔐 Login Details</h3>
                <p><strong>Website:</strong> <a href="${baseUrl}/trial-access/${user.username}">${baseUrl}/trial-access/${user.username}</a></p>
                <p><strong>Username:</strong> ${user.username}</p>
                <p><strong>Password:</strong> ${password}</p>
              </div>
              
              <a href="${baseUrl}/trial-access/${user.username}" class="btn">Login Now</a>
              
              <p>If you experience any issues logging in, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>This email contains sensitive login information. Please keep it secure.</p>
              <p>${this.companyName} - HR Management Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Login Instructions
      
      Hello ${user.firstName} ${user.lastName},
      
      Here are your login credentials:
      
      - Website: ${baseUrl}/trial-access/${user.username}
      - Username: ${user.username}
      - Password: ${password}
      
      Login: ${baseUrl}/trial-access/${user.username}
    `;

    return { subject, html, text };
  }

  // Send job acceptance email with onboarding information
  static async sendJobAcceptanceEmail(
    application: any,
    jobDetails: {
      startDate: string;
      salary: string;
      position: string;
      onboardingLink: string;
      tempUsername: string;
      tempPassword: string;
    }
  ): Promise<void> {
    const template = this.getJobAcceptanceTemplate(application, jobDetails);
    
    await this.sendEmail(
      application.email,
      template.subject,
      template.html,
      template.text
    );
  }

  // Send application status update email
  static async sendApplicationStatusUpdate(application: any): Promise<void> {
    const template = this.getApplicationStatusUpdateTemplate(application);
    
    await this.sendEmail(
      application.email,
      template.subject,
      template.html,
      template.text
    );
  }

  private static getJobAcceptanceTemplate(
    application: any,
    jobDetails: {
      startDate: string;
      salary: string;
      position: string;
      onboardingLink: string;
      tempUsername: string;
      tempPassword: string;
    }
  ): EmailTemplate {
    const subject = `🎉 Congratulations! Your Application Has Been Accepted - ${this.companyName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .job-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
            .onboarding-section { background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .credentials { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>🎉 Congratulations!</h2>
              <p>Your application has been accepted!</p>
            </div>
            <div class="content">
              <p>Dear ${application.firstName} ${application.lastName},</p>
              <p>We are delighted to inform you that your application for the <strong>${application.positionAppliedFor}</strong> position has been <strong>ACCEPTED</strong>!</p>
              
              <div class="job-details">
                <h3>📋 Job Details</h3>
                <p><strong>Position:</strong> ${jobDetails.position}</p>
                <p><strong>Department:</strong> ${application.department}</p>
                <p><strong>Start Date:</strong> ${jobDetails.startDate}</p>
                <p><strong>Salary:</strong> PKR ${jobDetails.salary}</p>
              </div>
              
              <div class="onboarding-section">
                <h3>🚀 Next Steps - Complete Your Onboarding</h3>
                <p>Before your first day, please complete your onboarding process by clicking the link below. This includes:</p>
                <ul>
                  <li>Personal profile completion</li>
                  <li>Banking and direct deposit setup</li>
                  <li>Document uploads (ID, certificates)</li>
                  <li>Psychometric assessments (5 comprehensive tests)</li>
                  <li>Company handbook review</li>
                  <li>Equipment and workspace setup</li>
                </ul>
                
                <a href="${jobDetails.onboardingLink}" class="btn">Start Onboarding Process</a>
              </div>
              
              <div class="credentials">
                <h3>🔐 Temporary Login Credentials</h3>
                <p>Use these credentials to access your onboarding portal:</p>
                <p><strong>Username:</strong> ${jobDetails.tempUsername}</p>
                <p><strong>Temporary Password:</strong> ${jobDetails.tempPassword}</p>
                <p><em>You'll be prompted to create a new password during onboarding.</em></p>
              </div>
              
              <p>Please complete your onboarding by <strong>${new Date(new Date(jobDetails.startDate).getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong> (one week before your start date).</p>
              
              <p>We're excited to welcome you to the team and look forward to your contributions!</p>
              
              <p>If you have any questions, please don't hesitate to contact HR at hr@themeetingmatters.com</p>
            </div>
            <div class="footer">
              <p>Welcome to ${this.companyName} - Your Business Management Partner</p>
              <p>This email contains sensitive information. Please keep it secure.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Application Accepted!
      
      Dear ${application.firstName} ${application.lastName},
      
      Congratulations! Your application for the ${application.positionAppliedFor} position has been ACCEPTED!
      
      Job Details:
      - Position: ${jobDetails.position}
      - Department: ${application.department}
      - Start Date: ${jobDetails.startDate}
      - Salary: PKR ${jobDetails.salary}
      
      Next Steps - Complete Your Onboarding:
      Please complete your onboarding process before your start date:
      ${jobDetails.onboardingLink}
      
      Temporary Login Credentials:
      - Username: ${jobDetails.tempUsername}
      - Temporary Password: ${jobDetails.tempPassword}
      
      Complete onboarding by: ${new Date(new Date(jobDetails.startDate).getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
      
      We're excited to welcome you to the team!
      
      Questions? Contact HR: hr@themeetingmatters.com
    `;

    return { subject, html, text };
  }

  private static getApplicationStatusUpdateTemplate(application: any): EmailTemplate {
    const subject = `Application Status Update - ${application.positionAppliedFor} Position`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .status-update { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4f46e5; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>Application Status Update</h2>
            </div>
            <div class="content">
              <p>Dear ${application.firstName} ${application.lastName},</p>
              <p>We wanted to provide you with an update on your application for the <strong>${application.positionAppliedFor}</strong> position.</p>
              
              <div class="status-update">
                <h3>📋 Status Update</h3>
                <p><strong>Current Status:</strong> ${application.status?.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Position:</strong> ${application.positionAppliedFor}</p>
                <p><strong>Department:</strong> ${application.department}</p>
                ${application.reviewNotes ? `<p><strong>Notes:</strong> ${application.reviewNotes}</p>` : ''}
                ${application.interviewDate ? `<p><strong>Interview Date:</strong> ${new Date(application.interviewDate).toLocaleDateString()}</p>` : ''}
              </div>
              
              <p>Thank you for your continued interest in ${this.companyName}. We will keep you updated as your application progresses.</p>
              
              <p>If you have any questions, please contact HR at hr@themeetingmatters.com</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName}</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Application Status Update
      
      Dear ${application.firstName} ${application.lastName},
      
      Status Update for ${application.positionAppliedFor} position:
      Current Status: ${application.status?.replace('_', ' ').toUpperCase()}
      
      ${application.reviewNotes ? `Notes: ${application.reviewNotes}` : ''}
      ${application.interviewDate ? `Interview Date: ${new Date(application.interviewDate).toLocaleDateString()}` : ''}
      
      Thank you for your interest in ${this.companyName}.
      
      Questions? Contact HR: hr@themeetingmatters.com
    `;

    return { subject, html, text };
  }

  private static getContractSigningEmployeeTemplate(
    employee: Employee,
    contractDetails: {
      contractType: string;
      position: string;
      signedAt: Date;
      digitalSignature: string;
    }
  ): EmailTemplate {
    const subject = `✅ Employment Contract Signed Successfully - ${contractDetails.position}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .contract-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669; }
            .signature-box { background-color: #e0f7fa; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .success-icon { font-size: 24px; color: #059669; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName}</h1>
              <h2>📋 Contract Signing Confirmation</h2>
            </div>
            <div class="content">
              <p>Dear ${employee.preferredName || employee.fullName},</p>
              <p><span class="success-icon">✅</span> <strong>Congratulations!</strong> Your employment contract has been successfully signed and processed.</p>
              
              <div class="contract-details">
                <h3>📄 Contract Details</h3>
                <p><strong>Position:</strong> ${contractDetails.position}</p>
                <p><strong>Contract Type:</strong> ${contractDetails.contractType}</p>
                <p><strong>Signed Date:</strong> ${contractDetails.signedAt.toLocaleDateString()}</p>
                <p><strong>Signed Time:</strong> ${contractDetails.signedAt.toLocaleTimeString()}</p>
              </div>
              
              <div class="signature-box">
                <h4>📝 Digital Signature Confirmed</h4>
                <p><strong>Signature:</strong> ${contractDetails.digitalSignature}</p>
                <p><em>This digital signature is legally binding and equivalent to a handwritten signature.</em></p>
              </div>
              
              <p>You can now access your employee dashboard and begin your journey with ${this.companyName}. Welcome to the team!</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" class="btn">Access Dashboard</a>
            </div>
            <div class="footer">
              <p>This is an automated confirmation from ${this.companyName} HR System</p>
              <p>If you have any questions, please contact HR at hr@themeetingmatters.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} - Employment Contract Signed Successfully
      
      Dear ${employee.preferredName || employee.fullName},
      
      Congratulations! Your employment contract has been successfully signed and processed.
      
      Contract Details:
      - Position: ${contractDetails.position}
      - Contract Type: ${contractDetails.contractType}
      - Signed Date: ${contractDetails.signedAt.toLocaleDateString()}
      - Signed Time: ${contractDetails.signedAt.toLocaleTimeString()}
      
      Digital Signature Confirmed: ${contractDetails.digitalSignature}
      
      You can now access your employee dashboard and begin your journey with ${this.companyName}.
      
      Visit: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard
      
      If you have any questions, please contact HR at hr@themeetingmatters.com
    `;

    return { subject, html, text };
  }

  private static getContractSigningHRTemplate(
    employee: Employee,
    contractDetails: {
      contractType: string;
      position: string;
      signedAt: Date;
      digitalSignature: string;
    }
  ): EmailTemplate {
    const subject = `📋 Contract Signed: ${employee.fullName} - ${contractDetails.position}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .employee-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #1f2937; }
            .contract-details { background-color: #e0f7fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .signature-verification { background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #059669; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #1f2937; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .alert-icon { font-size: 24px; color: #1f2937; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.companyName} HR</h1>
              <h2>📋 New Contract Signing Notification</h2>
            </div>
            <div class="content">
              <p>Dear HR Team,</p>
              <p><span class="alert-icon">📋</span> A new employment contract has been digitally signed and requires your attention.</p>
              
              <div class="employee-details">
                <h3>👤 Employee Information</h3>
                <p><strong>Name:</strong> ${employee.fullName}</p>
                <p><strong>Employee ID:</strong> ${employee.employeeId}</p>
                <p><strong>Email:</strong> ${employee.personalEmail || 'Not provided'}</p>
                <p><strong>Department:</strong> ${employee.departmentId || 'Not specified'}</p>
              </div>
              
              <div class="contract-details">
                <h3>📄 Contract Information</h3>
                <p><strong>Position:</strong> ${contractDetails.position}</p>
                <p><strong>Contract Type:</strong> ${contractDetails.contractType}</p>
                <p><strong>Signed Date:</strong> ${contractDetails.signedAt.toLocaleDateString()}</p>
                <p><strong>Signed Time:</strong> ${contractDetails.signedAt.toLocaleTimeString()}</p>
              </div>
              
              <div class="signature-verification">
                <h4>✅ Digital Signature Verification</h4>
                <p><strong>Employee Signature:</strong> ${contractDetails.digitalSignature}</p>
                <p><strong>IP Address:</strong> [System logged]</p>
                <p><strong>Timestamp:</strong> ${contractDetails.signedAt.toISOString()}</p>
                <p><em>This digital signature has been verified and is legally binding.</em></p>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Review the signed contract in the admin dashboard</li>
                <li>Process employee onboarding if applicable</li>
                <li>Update employee records and access permissions</li>
                <li>File the signed contract in employee records</li>
              </ul>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin/contracts" class="btn">View Contract Details</a>
            </div>
            <div class="footer">
              <p>This is an automated notification from ${this.companyName} HR System</p>
              <p>For urgent matters, please contact the system administrator</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${this.companyName} HR - New Contract Signing Notification
      
      Dear HR Team,
      
      A new employment contract has been digitally signed and requires your attention.
      
      Employee Information:
      - Name: ${employee.fullName}
      - Employee ID: ${employee.employeeId}
      - Email: ${employee.personalEmail || 'Not provided'}
      - Department: ${employee.departmentId || 'Not specified'}
      
      Contract Information:
      - Position: ${contractDetails.position}
      - Contract Type: ${contractDetails.contractType}
      - Signed Date: ${contractDetails.signedAt.toLocaleDateString()}
      - Signed Time: ${contractDetails.signedAt.toLocaleTimeString()}
      
      Digital Signature Verification:
      - Employee Signature: ${contractDetails.digitalSignature}
      - Timestamp: ${contractDetails.signedAt.toISOString()}
      
      Next Steps:
      - Review the signed contract in the admin dashboard
      - Process employee onboarding if applicable
      - Update employee records and access permissions
      - File the signed contract in employee records
      
      Visit: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin/contracts
    `;

    return { subject, html, text };
  }
}