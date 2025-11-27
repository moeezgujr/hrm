import { storage } from './storage';
import { EmailService } from './emailService';

export class OverdueTaskService {
  private static intervalId: NodeJS.Timeout | null = null;

  // Start the overdue task monitoring service
  static start() {
    if (this.intervalId) {
      return; // Already running
    }
    
    console.log('Starting overdue task monitoring service...');
    
    // Check every 30 minutes for overdue tasks
    this.intervalId = setInterval(() => {
      this.checkAndMarkOverdueTasks();
    }, 30 * 60 * 1000); // 30 minutes in milliseconds
    
    // Run initial check immediately
    this.checkAndMarkOverdueTasks();
  }
  
  // Stop the overdue task monitoring service
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Overdue task monitoring service stopped');
    }
  }
  
  // Check for overdue tasks and send notifications
  static async checkAndMarkOverdueTasks() {
    try {
      console.log('Checking for overdue tasks...');
      
      // Get all pending and in-progress tasks
      const allTasks = await storage.getTasks({ status: 'pending' });
      const inProgressTasks = await storage.getTasks({ status: 'in_progress' });
      const tasksToCheck = [...allTasks, ...inProgressTasks];
      
      const now = new Date();
      let overdueCount = 0;
      
      for (const task of tasksToCheck) {
        // Check if task is overdue:
        // 1. Has a due date
        // 2. Due date has passed
        // 3. Status is not completed
        // 4. Status is not already overdue
        if (
          task.dueDate && 
          new Date(task.dueDate) < now && 
          task.status !== 'completed' &&
          task.status !== 'overdue'
        ) {
          // Mark task as overdue
          await storage.updateTask(task.id, { 
            status: 'overdue',
            updatedAt: now
          });
          
          overdueCount++;
          console.log(`Task "${task.title}" (ID: ${task.id}) marked as overdue`);
          
          // Send notifications to relevant parties
          await this.sendOverdueNotifications(task);
        }
      }
      
      // Also check project tasks
      const projectTasks = await storage.getAllProjectTasks();
      
      for (const projectTask of projectTasks) {
        if (
          projectTask.dueDate && 
          new Date(projectTask.dueDate) < now && 
          projectTask.status !== 'completed' &&
          projectTask.status !== 'overdue' &&
          !projectTask.overdueNotificationSent
        ) {
          // Mark project task as overdue
          await storage.updateProjectTask(projectTask.id, { 
            status: 'overdue',
            overdueNotificationSent: now,
            updatedAt: now
          });
          
          overdueCount++;
          console.log(`Project task "${projectTask.title}" (ID: ${projectTask.id}) marked as overdue`);
          
          // Send notifications for project task
          await this.sendOverdueProjectTaskNotifications(projectTask);
        }
      }
      
      if (overdueCount > 0) {
        console.log(`${overdueCount} task(s) marked as overdue`);
      }
    } catch (error) {
      console.error('Error in overdue task monitoring:', error);
    }
  }
  
  // Send notifications for overdue regular tasks
  private static async sendOverdueNotifications(task: any) {
    try {
      // Get assigned employee info for notifications
      const assignedEmployee = task.assignedTo ? await storage.getEmployeeByUserId(task.assignedTo) : null;
      const assignedByUser = task.assignedBy ? await storage.getUserById(task.assignedBy) : null;
      
      // 1. Notify HR Admins
      const hrAdmins = await storage.getUsersByRole('hr_admin');
      for (const hrAdmin of hrAdmins) {
        await storage.createTaskNotification('task_overdue', {
          userId: hrAdmin.id,
          taskId: task.id,
          taskTitle: task.title,
          assignedBy: assignedByUser?.username || 'Unknown',
          dueDate: new Date(task.dueDate),
          assignedToName: assignedEmployee ? (assignedEmployee.preferredName || 'Employee') : 'Unassigned'
        });
        
        // Send email to HR Admin
        try {
          const hrEmployee = await storage.getEmployeeByUserId(hrAdmin.id);
          if (hrEmployee) {
            await this.sendOverdueTaskEmail(hrEmployee, task, 'HR Admin');
          }
        } catch (emailError) {
          console.error(`Failed to send overdue email to HR Admin ${hrAdmin.id}:`, emailError);
        }
      }
      
      // 2. Notify assigned employee
      if (task.assignedTo && assignedEmployee) {
        await storage.createTaskNotification('task_overdue', {
          userId: task.assignedTo,
          taskId: task.id,
          taskTitle: task.title,
          assignedBy: assignedByUser?.username || 'Unknown',
          dueDate: new Date(task.dueDate)
        });
        
        // Send email to assigned employee
        try {
          await this.sendOverdueTaskEmail(assignedEmployee, task, 'Employee');
        } catch (emailError) {
          console.error(`Failed to send overdue email to employee ${task.assignedTo}:`, emailError);
        }
      }
      
      // 3. Notify the person who assigned the task
      if (task.assignedBy && task.assignedBy !== task.assignedTo) {
        await storage.createTaskNotification('task_overdue', {
          userId: task.assignedBy,
          taskId: task.id,
          taskTitle: task.title,
          dueDate: new Date(task.dueDate),
          assignedToName: assignedEmployee ? (assignedEmployee.preferredName || 'Employee') : 'Unassigned'
        });
        
        // Send email to task assigner
        try {
          const assignerEmployee = await storage.getEmployeeByUserId(task.assignedBy);
          if (assignerEmployee) {
            await this.sendOverdueTaskEmail(assignerEmployee, task, 'Task Assigner');
          }
        } catch (emailError) {
          console.error(`Failed to send overdue email to task assigner ${task.assignedBy}:`, emailError);
        }
      }
      
      console.log(`Sent overdue notifications for task "${task.title}"`);
    } catch (error) {
      console.error('Error sending overdue task notifications:', error);
    }
  }
  
  // Send notifications for overdue project tasks
  private static async sendOverdueProjectTaskNotifications(projectTask: any) {
    try {
      // Get project info
      const project = await storage.getProject(projectTask.projectId);
      if (!project) return;
      
      // Get assigned employee info
      const assignedEmployee = projectTask.assignedTo ? await storage.getEmployeeByUserId(projectTask.assignedTo) : null;
      const assignedByUser = projectTask.assignedBy ? await storage.getUserById(projectTask.assignedBy) : null;
      
      // 1. Notify HR Admins
      const hrAdmins = await storage.getUsersByRole('hr_admin');
      for (const hrAdmin of hrAdmins) {
        await storage.createTaskNotification('task_overdue', {
          userId: hrAdmin.id,
          taskId: projectTask.id,
          taskTitle: `[${project.name}] ${projectTask.title}`,
          assignedBy: assignedByUser?.username || 'Unknown',
          dueDate: new Date(projectTask.dueDate),
          assignedToName: assignedEmployee ? (assignedEmployee.preferredName || 'Employee') : 'Unassigned'
        });
        
        // Send email to HR Admin
        try {
          const hrEmployee = await storage.getEmployeeByUserId(hrAdmin.id);
          if (hrEmployee) {
            await this.sendOverdueProjectTaskEmail(hrEmployee, projectTask, project, 'HR Admin');
          }
        } catch (emailError) {
          console.error(`Failed to send overdue project task email to HR Admin ${hrAdmin.id}:`, emailError);
        }
      }
      
      // 2. Notify Project Managers
      const projectManagers = await storage.getProjectManagers(projectTask.projectId);
      for (const manager of projectManagers) {
        await storage.createTaskNotification('task_overdue', {
          userId: manager.userId,
          taskId: projectTask.id,
          taskTitle: `[${project.name}] ${projectTask.title}`,
          assignedBy: assignedByUser?.username || 'Unknown',
          dueDate: new Date(projectTask.dueDate),
          assignedToName: assignedEmployee ? (assignedEmployee.preferredName || 'Employee') : 'Unassigned'
        });
        
        // Send email to Project Manager
        try {
          const managerEmployee = await storage.getEmployeeByUserId(manager.userId);
          if (managerEmployee) {
            await this.sendOverdueProjectTaskEmail(managerEmployee, projectTask, project, 'Project Manager');
          }
        } catch (emailError) {
          console.error(`Failed to send overdue project task email to Project Manager ${manager.userId}:`, emailError);
        }
      }
      
      // 3. Notify assigned employee
      if (projectTask.assignedTo && assignedEmployee) {
        await storage.createTaskNotification('task_overdue', {
          userId: projectTask.assignedTo,
          taskId: projectTask.id,
          taskTitle: `[${project.name}] ${projectTask.title}`,
          assignedBy: assignedByUser?.username || 'Unknown',
          dueDate: new Date(projectTask.dueDate)
        });
        
        // Send email to assigned employee
        try {
          await this.sendOverdueProjectTaskEmail(assignedEmployee, projectTask, project, 'Employee');
        } catch (emailError) {
          console.error(`Failed to send overdue project task email to employee ${projectTask.assignedTo}:`, emailError);
        }
      }
      
      console.log(`Sent overdue notifications for project task "${projectTask.title}" in project "${project.name}"`);
    } catch (error) {
      console.error('Error sending overdue project task notifications:', error);
    }
  }
  
  // Send email for overdue regular tasks
  private static async sendOverdueTaskEmail(employee: any, task: any, recipientType: string): Promise<void> {
    const subject = `🚨 OVERDUE TASK ALERT: ${task.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626; }
            .task-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .urgent { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Meeting Matters</h1>
              <h2>🚨 OVERDUE TASK ALERT</h2>
            </div>
            <div class="content">
              <p>Hello ${employee.preferredName || 'Team Member'},</p>
              <p class="urgent">This is an urgent notification regarding an overdue task.</p>
              
              <div class="task-details">
                <h3>📋 Task Details</h3>
                <p><strong>Title:</strong> ${task.title}</p>
                <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
                <p><strong>Priority:</strong> <span class="urgent">${task.priority?.toUpperCase()}</span></p>
                <p><strong>Due Date:</strong> <span class="urgent">${new Date(task.dueDate).toLocaleDateString()}</span></p>
                <p><strong>Days Overdue:</strong> <span class="urgent">${Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days</span></p>
                <p><strong>Current Status:</strong> OVERDUE</p>
              </div>
              
              ${recipientType === 'Employee' ? 
                '<p><strong>Action Required:</strong> Please complete this task immediately or provide an explanation for the delay.</p>' :
                '<p><strong>For Your Attention:</strong> This task requires immediate attention and follow-up.</p>'
              }
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/tasks" class="btn">View Task</a>
            </div>
            <div class="footer">
              <p>This is an automated urgent notification from Meeting Matters Business Management System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Meeting Matters - OVERDUE TASK ALERT
      
      Hello ${employee.preferredName || 'Team Member'},
      
      This is an urgent notification regarding an overdue task.
      
      Task Details:
      - Title: ${task.title}
      - Description: ${task.description || 'No description provided'}
      - Priority: ${task.priority?.toUpperCase()}
      - Due Date: ${new Date(task.dueDate).toLocaleDateString()}
      - Days Overdue: ${Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
      - Current Status: OVERDUE
      
      ${recipientType === 'Employee' ? 
        'Action Required: Please complete this task immediately or provide an explanation for the delay.' :
        'For Your Attention: This task requires immediate attention and follow-up.'
      }
      
      Visit: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/tasks
    `;

    await EmailService.sendDirectEmail(
      employee.personalEmail || `${employee.employeeId}@company.com`,
      subject,
      html,
      text
    );
  }
  
  // Send email for overdue project tasks
  private static async sendOverdueProjectTaskEmail(employee: any, projectTask: any, project: any, recipientType: string): Promise<void> {
    const subject = `🚨 OVERDUE PROJECT TASK: [${project.name}] ${projectTask.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626; }
            .task-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .urgent { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Meeting Matters</h1>
              <h2>🚨 OVERDUE PROJECT TASK ALERT</h2>
            </div>
            <div class="content">
              <p>Hello ${employee.preferredName || 'Team Member'},</p>
              <p class="urgent">This is an urgent notification regarding an overdue project task.</p>
              
              <div class="task-details">
                <h3>📋 Project Task Details</h3>
                <p><strong>Project:</strong> ${project.name}</p>
                <p><strong>Task Title:</strong> ${projectTask.title}</p>
                <p><strong>Description:</strong> ${projectTask.description || 'No description provided'}</p>
                <p><strong>Priority:</strong> <span class="urgent">${projectTask.priority?.toUpperCase()}</span></p>
                <p><strong>Due Date:</strong> <span class="urgent">${new Date(projectTask.dueDate).toLocaleDateString()}</span></p>
                <p><strong>Days Overdue:</strong> <span class="urgent">${Math.ceil((Date.now() - new Date(projectTask.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days</span></p>
                <p><strong>Current Status:</strong> OVERDUE</p>
                <p><strong>Estimated Hours:</strong> ${projectTask.estimatedHours || 'Not specified'}</p>
              </div>
              
              ${recipientType === 'Employee' ? 
                '<p><strong>Action Required:</strong> Please complete this project task immediately or provide an explanation for the delay.</p>' :
                '<p><strong>For Your Attention:</strong> This project task requires immediate attention and follow-up.</p>'
              }
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/projects/${project.id}" class="btn">View Project</a>
            </div>
            <div class="footer">
              <p>This is an automated urgent notification from Meeting Matters Business Management System</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Meeting Matters - OVERDUE PROJECT TASK ALERT
      
      Hello ${employee.preferredName || 'Team Member'},
      
      This is an urgent notification regarding an overdue project task.
      
      Project Task Details:
      - Project: ${project.name}
      - Task Title: ${projectTask.title}
      - Description: ${projectTask.description || 'No description provided'}
      - Priority: ${projectTask.priority?.toUpperCase()}
      - Due Date: ${new Date(projectTask.dueDate).toLocaleDateString()}
      - Days Overdue: ${Math.ceil((Date.now() - new Date(projectTask.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
      - Current Status: OVERDUE
      - Estimated Hours: ${projectTask.estimatedHours || 'Not specified'}
      
      ${recipientType === 'Employee' ? 
        'Action Required: Please complete this project task immediately or provide an explanation for the delay.' :
        'For Your Attention: This project task requires immediate attention and follow-up.'
      }
      
      Visit: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/projects/${project.id}
    `;

    await EmailService.sendDirectEmail(
      employee.personalEmail || `${employee.employeeId}@company.com`,
      subject,
      html,
      text
    );
  }
}