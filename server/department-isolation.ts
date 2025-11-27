// Department Isolation Control System
// Ensures departments can only communicate with HR, not with each other

import { Request } from 'express';
import { storage } from './storage';

interface AuthenticatedRequest extends Request {
  user: any;
  departmentIsolation?: any;
}

// Helper function to get user's department
async function getUserDepartment(userId: number): Promise<string | null> {
  try {
    const employee = await storage.getEmployeeByUserId(userId);
    return employee?.department || null;
  } catch (error) {
    console.error('Error getting user department:', error);
    return null;
  }
}

// Check if user can access another user's information
export async function canAccessUser(requestingUserId: number, targetUserId: number, requestingUserRole: string): Promise<boolean> {
  // HR Admin and Branch Manager can access all users
  if (requestingUserRole === 'hr_admin' || requestingUserRole === 'branch_manager') {
    return true;
  }

  // Users can always access their own information
  if (requestingUserId === targetUserId) {
    return true;
  }

  // Get departments for both users
  const requestingUserDept = await getUserDepartment(requestingUserId);
  const targetUserDept = await getUserDepartment(targetUserId);

  // If either user is not in a department, deny access
  if (!requestingUserDept || !targetUserDept) {
    return false;
  }

  // Department isolation: users from different departments cannot access each other
  // Only same department access is allowed (for team collaboration within department)
  return requestingUserDept === targetUserDept;
}

// Filter users list based on department isolation rules
export async function filterUsersForDepartmentIsolation(requestingUserId: number, requestingUserRole: string, users: any[]): Promise<any[]> {
  // HR Admin and Branch Manager can see all users
  if (requestingUserRole === 'hr_admin' || requestingUserRole === 'branch_manager') {
    return users;
  }

  const requestingUserDept = await getUserDepartment(requestingUserId);
  if (!requestingUserDept) {
    return []; // If user has no department, they can't see anyone
  }

  // Filter to only include users from the same department + HR roles
  const filteredUsers = [];
  for (const user of users) {
    try {
      // Always include HR Admin and Branch Manager (they handle cross-department communication)
      if (user.role === 'hr_admin' || user.role === 'branch_manager') {
        filteredUsers.push(user);
        continue;
      }

      // Include the requesting user themselves
      if (user.id === requestingUserId) {
        filteredUsers.push(user);
        continue;
      }

      // Check if user is in the same department
      const userDept = await getUserDepartment(user.id);
      if (userDept && userDept === requestingUserDept) {
        filteredUsers.push(user);
      }
    } catch (error) {
      console.error('Error filtering user:', error);
      // Skip this user if there's an error
    }
  }

  return filteredUsers;
}

// Check if user is a project manager for a specific project
export async function isProjectManager(userId: number, projectId: number): Promise<boolean> {
  try {
    const { db } = await import("./db");
    const { projects } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const project = await db
      .select({ projectManagerId: projects.projectManagerId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
      
    return project.length > 0 && project[0].projectManagerId === userId;
  } catch (error) {
    console.error("Error checking project manager status:", error);
    return false;
  }
}

// Check if user is a project member for a specific project
export async function isProjectMember(userId: number, projectId: number): Promise<boolean> {
  try {
    const { db } = await import("./db");
    const { projects, projectMembers } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    // Check if user is project manager or project member
    const [projectManager] = await db
      .select({ projectManagerId: projects.projectManagerId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
      
    if (projectManager && projectManager.projectManagerId === userId) {
      return true;
    }
    
    // Check if user is a project member
    const [member] = await db
      .select({ userId: projectMembers.userId })
      .from(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ))
      .limit(1);
      
    return member !== undefined;
  } catch (error) {
    console.error("Error checking project member status:", error);
    return false;
  }
}

// Check if user can assign tasks to another user (with project context)
export async function canAssignTaskTo(requestingUserId: number, targetUserId: number, requestingUserRole: string, projectId?: number): Promise<boolean> {
  // HR Admin and Branch Manager can assign to anyone
  if (requestingUserRole === 'hr_admin' || requestingUserRole === 'branch_manager') {
    return true;
  }

  // Team leads can assign within their department
  if (requestingUserRole === 'team_lead') {
    return await canAccessUser(requestingUserId, targetUserId, requestingUserRole);
  }

  // If project context is provided, allow any project member to assign tasks
  if (projectId) {
    const isRequesterProjectMember = await isProjectMember(requestingUserId, projectId);
    if (isRequesterProjectMember) {
      // Project members can assign to anyone in the same department or other project members
      const isTargetProjectMember = await isProjectMember(targetUserId, projectId);
      if (isTargetProjectMember) {
        return true;
      }
      // Also allow assignment within same department
      return await canAccessUser(requestingUserId, targetUserId, requestingUserRole);
    }
  }

  // Regular employees cannot assign tasks to others (unless in project context above)
  return false;
}

// Check if user can view tasks assigned by/to another user
export async function canViewUserTasks(requestingUserId: number, targetUserId: number, requestingUserRole: string): Promise<boolean> {
  // HR Admin and Branch Manager can view all tasks
  if (requestingUserRole === 'hr_admin' || requestingUserRole === 'branch_manager') {
    return true;
  }

  // Users can view their own tasks
  if (requestingUserId === targetUserId) {
    return true;
  }

  // Team leads can view tasks within their department
  if (requestingUserRole === 'team_lead') {
    return await canAccessUser(requestingUserId, targetUserId, requestingUserRole);
  }

  // Check if users are in the same department for task visibility
  return await canAccessUser(requestingUserId, targetUserId, requestingUserRole);
}

// Middleware to enforce department isolation on routes
export function departmentIsolationMiddleware(req: any, res: any, next: any) {
  // Add department isolation helper functions to request object
  req.departmentIsolation = {
    canAccessUser: (targetUserId: number) => canAccessUser(req.user.id, targetUserId, req.user.role),
    filterUsers: (users: any[]) => filterUsersForDepartmentIsolation(req.user.id, req.user.role, users),
    canAssignTaskTo: (targetUserId: number) => canAssignTaskTo(req.user.id, targetUserId, req.user.role),
    canViewUserTasks: (targetUserId: number) => canViewUserTasks(req.user.id, targetUserId, req.user.role),
    getUserDepartment: () => getUserDepartment(req.user.id),
  };

  next();
}

// Helper to validate project member assignments across departments
export async function validateProjectMemberAssignment(requestingUserId: number, requestingUserRole: string, memberUserId: number): Promise<{ allowed: boolean; reason?: string }> {
  // HR Admin and Branch Manager can assign anyone to projects
  if (requestingUserRole === 'hr_admin' || requestingUserRole === 'branch_manager') {
    return { allowed: true };
  }

  // Check if users are in the same department
  const canAccess = await canAccessUser(requestingUserId, memberUserId, requestingUserRole);
  if (!canAccess) {
    return { 
      allowed: false, 
      reason: 'Cannot assign members from different departments. Please contact HR for cross-department projects.' 
    };
  }

  return { allowed: true };
}

// Department communication rules validation
export async function validateCommunication(fromUserId: number, toUserId: number, fromUserRole: string): Promise<{ allowed: boolean; reason?: string }> {
  // HR can communicate with everyone
  if (fromUserRole === 'hr_admin' || fromUserRole === 'branch_manager') {
    return { allowed: true };
  }

  // Check if target user is HR (departments can always contact HR)
  const targetUser = await storage.getUser(toUserId);
  if (targetUser && (targetUser.role === 'hr_admin' || targetUser.role === 'branch_manager')) {
    return { allowed: true };
  }

  // Check if users are in the same department
  const canAccess = await canAccessUser(fromUserId, toUserId, fromUserRole);
  if (!canAccess) {
    return { 
      allowed: false, 
      reason: 'Department isolation policy: You can only communicate with members of your department or HR.' 
    };
  }

  return { allowed: true };
}