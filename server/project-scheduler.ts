import { storage } from './storage';

export class ProjectScheduler {
  private static intervalId: NodeJS.Timeout | null = null;
  
  // Start the project scheduler service
  static start() {
    if (this.intervalId) {
      return; // Already running
    }
    
    console.log('Starting project scheduler service...');
    
    // Check every hour for projects that should start
    this.intervalId = setInterval(() => {
      this.checkAndStartProjects();
    }, 60 * 60 * 1000); // 1 hour in milliseconds
    
    // Run initial check immediately
    this.checkAndStartProjects();
  }
  
  // Stop the project scheduler service
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Project scheduler service stopped');
    }
  }
  
  // Check for projects that should start and update their status
  static async checkAndStartProjects() {
    try {
      console.log('Checking for projects that should start...');
      
      const projects = await storage.getAllProjects();
      const now = new Date();
      let updatedCount = 0;
      
      for (const project of projects) {
        // Check if project should start:
        // 1. Has a start date
        // 2. Start date is in the past or today
        // 3. Status is still "planning" 
        if (
          project.startDate && 
          new Date(project.startDate) <= now && 
          project.status === 'planning'
        ) {
          await storage.updateProject(project.id, { 
            status: 'active',
            updatedAt: now
          });
          
          updatedCount++;
          console.log(`Project "${project.name}" (ID: ${project.id}) automatically started`);
          
          // Optionally send notifications to project manager and team members
          await this.notifyProjectStart(project);
        }
      }
      
      if (updatedCount > 0) {
        console.log(`${updatedCount} project(s) automatically started`);
      }
    } catch (error) {
      console.error('Error in project scheduler:', error);
    }
  }
  
  // Send notifications when a project automatically starts
  private static async notifyProjectStart(project: any) {
    try {
      // Get project manager
      const projectManager = await storage.getUser(project.projectManagerId);
      if (!projectManager) {
        return;
      }
      
      // Get project members
      const members = await storage.getProjectMembers(project.id);
      
      // Create notification for project manager
      const managerNotification = {
        userId: project.projectManagerId,
        type: 'project_started',
        title: 'Project Started',
        message: `Project "${project.name}" has automatically started based on its scheduled start date.`,
        relatedId: project.id.toString(),
        relatedType: 'project',
        isRead: false
      };
      
      await storage.createNotification(managerNotification);
      
      // Create notifications for team members
      for (const member of members) {
        if (member.userId !== project.projectManagerId) { // Don't duplicate for project manager
          const memberNotification = {
            userId: member.userId,
            type: 'project_started',
            title: 'Project Started',
            message: `Project "${project.name}" has started. You can now begin working on your assigned tasks.`,
            relatedId: project.id.toString(),
            relatedType: 'project',
            isRead: false
          };
          
          await storage.createNotification(memberNotification);
        }
      }
      
      console.log(`Sent start notifications for project "${project.name}"`);
    } catch (error) {
      console.error('Error sending project start notifications:', error);
    }
  }
  
  // Manual method to check a specific project
  static async checkProject(projectId: number) {
    try {
      const project = await storage.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      
      const now = new Date();
      
      if (
        project.startDate && 
        new Date(project.startDate) <= now && 
        project.status === 'planning'
      ) {
        await storage.updateProject(project.id, { 
          status: 'active',
          updatedAt: now
        });
        
        await this.notifyProjectStart(project);
        console.log(`Project "${project.name}" manually started`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking specific project:', error);
      throw error;
    }
  }
}