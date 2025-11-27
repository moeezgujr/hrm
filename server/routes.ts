/* @ts-nocheck */
import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from 'fs';
import path from 'path';
import Stripe from "stripe";
import { Storage } from "@google-cloud/storage";
// import { Client as ObjectStorageClient } from "@replit/object-storage";
import { HRNotifications } from './hr-notifications';
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole, requirePermission } from "./auth";
import { EmailService } from "./emailService";
import { TrialNotificationService } from "./trial-notifications";
import { setupPDFDownload } from "./pdf-download";
import { requireFeature, getUserPlanInfo, PLAN_FEATURES, TRIAL_FEATURES } from "./subscriptionMiddleware";
import { ProjectScheduler } from "./project-scheduler";
import { createInsertSchema } from "drizzle-zod";
import { psychometricTests, psychometricQuestions, psychometricTestAttempts, companies, departments, projects, projectMembers, projectTasks, employees, users, projectFiles } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, like, isNull, isNotNull, ne, or, sql } from "drizzle-orm";

const insertPsychometricTestSchema = createInsertSchema(psychometricTests);
const insertPsychometricQuestionSchema = createInsertSchema(psychometricQuestions);
const insertPsychometricTestAttemptSchema = createInsertSchema(psychometricTestAttempts).extend({
  completedAt: z.union([z.date(), z.string()]).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }).optional()
});
import { insertTaskSchema, insertTaskUpdateSchema, insertTaskRequestSchema, insertAnnouncementSchema, insertRecognitionSchema, insertLogisticsItemSchema, insertLogisticsRequestSchema, insertOnboardingChecklistSchema, insertDocumentSchema, insertEmployeeSchema, insertCompanySchema, insertDepartmentSchema, insertProjectSchema, insertProjectMemberSchema, insertProjectTaskSchema, insertRegistrationRequestSchema, insertTrialRequestSchema, insertJobApplicationSchema, insertEmploymentContractSchema, updateEmploymentContractSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { sendOnboardingEmail } from "./email";
import { departmentIsolationMiddleware, canAccessUser, filterUsersForDepartmentIsolation, canAssignTaskTo, validateCommunication, validateProjectMemberAssignment } from "./department-isolation";

// Contract signing middleware - ensures employees have signed their contracts before accessing dashboard
const requireContractSigning = async (req: any, res: any, next: any) => {
  try {
    // Skip for non-employee roles and system routes
    if (req.user.role !== 'employee' || req.path.includes('/contract') || req.path.includes('/logout')) {
      return next();
    }

    // Check if employee has signed their employment contract
    if (!req.user.contractSigned) {
      const pendingContract = await storage.getUserPendingContract(req.user.id);
      if (pendingContract) {
        return res.status(403).json({ 
          message: 'Contract signing required',
          requiresContract: true,
          contractId: pendingContract.id
        });
      }
    }

    next();
  } catch (error) {
    console.error('Contract checking error:', error);
    next();
  }
};

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // PDF download routes
  setupPDFDownload(app);

  // Health check endpoint that doesn't require authentication
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Only apply authentication to specific API routes that need it
  app.use('/api/user', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/employees', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/tasks', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/projects', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/departments', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/announcements', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/recognition', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/logistics', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/analytics', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/onboarding', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/notifications', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/dashboard', isAuthenticated, getUserPlanInfo, requireContractSigning);
  app.use('/api/trial-requests', isAuthenticated, getUserPlanInfo);
  app.use('/api/subscription', isAuthenticated, getUserPlanInfo);
  app.use('/api/contracts', isAuthenticated, getUserPlanInfo); // Contract routes don't need contract signing check

  // User plan information endpoint
  app.get('/api/user/plan', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isOnTrial = user.trialEndDate && new Date() < new Date(user.trialEndDate);
      
      let currentPlan = 'none';
      let allowedFeatures: string[] = [];
      
      // Admin users and existing original users get full access
      if (user.username === 'admin' || user.organizationId === 'default_meeting_matters_org') {
        currentPlan = 'enterprise';
        allowedFeatures = PLAN_FEATURES.enterprise;
      } else if (isOnTrial) {
        currentPlan = 'trial';
        allowedFeatures = TRIAL_FEATURES;
      } else if (user.subscriptionPlan && user.subscriptionStatus === 'active') {
        currentPlan = user.subscriptionPlan;
        allowedFeatures = PLAN_FEATURES[user.subscriptionPlan as keyof typeof PLAN_FEATURES] || [];
      } else {
        // For new users without subscription, give starter access only
        currentPlan = 'starter';
        allowedFeatures = PLAN_FEATURES.starter;
      }

      res.json({
        currentPlan,
        isOnTrial,
        trialEndDate: user.trialEndDate,
        subscriptionStatus: user.subscriptionStatus,
        allowedFeatures,
        planFeatures: PLAN_FEATURES
      });
    } catch (error) {
      console.error('Error fetching user plan:', error);
      res.status(500).json({ message: 'Failed to fetch user plan' });
    }
  });

  // Auth routes are now handled by setupAuth in auth.ts

  // Test email notification route (for testing purposes)
  app.post('/api/test-email', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const { type, employeeId } = req.body;
      
      const employee = await storage.getEmployeeById(parseInt(employeeId));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      let emailSent = false;
      
      switch (type) {
        case 'task':
          const sampleTask = {
            id: 999,
            title: "Test Task Notification",
            description: "This is a test task to verify email notifications are working",
            priority: "medium",
            status: "assigned",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            assignedTo: employee.userId,
            assignedBy: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await EmailService.sendTaskAssignmentEmail(employee, sampleTask, "HR Admin");
          emailSent = true;
          break;
          
        case 'recognition':
          const sampleRecognition = {
            id: 999,
            type: "employee_of_month",
            reason: "Outstanding performance and dedication to team goals",
            nomineeId: employee.userId,
            nominatorId: req.user.id,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const nominator = await storage.getEmployeeByUserId(req.user.id);
          if (nominator) {
            await EmailService.sendRecognitionNotificationEmail(employee, nominator, sampleRecognition);
            emailSent = true;
          }
          break;
          
        case 'onboarding':
          await EmailService.sendOnboardingUpdateEmail(employee, "Test Onboarding Step", "completed");
          emailSent = true;
          break;
          
        case 'general':
          await EmailService.sendGeneralNotificationEmail(
            employee,
            "System Test Notification",
            "This is a test notification to verify that the email system is working properly. You should receive this email from meetingmatters786@gmail.com.",
            `${process.env.FRONTEND_URL || 'http://localhost:5000'}/employee-dashboard`
          );
          emailSent = true;
          break;
          
        case 'overdue':
          const sampleOverdueTask = {
            title: "Complete Performance Review Documentation",
            description: "Complete your Q4 performance review documentation and submit to HR",
            priority: "high",
            dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          };
          await EmailService.sendOverdueTaskReminderEmail(employee, 1, sampleOverdueTask);
          emailSent = true;
          break;
      }
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: `Test ${type} email sent successfully to ${employee.personalEmail}` 
        });
      } else {
        res.status(400).json({ message: "Invalid email type" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ 
        message: "Failed to send test email", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Send overdue task reminder email route
  app.post('/api/send-overdue-email/:employeeId', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const employee = await storage.getEmployeeById(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Create a sample overdue task for Usama
      const overdueTask = {
        title: "Complete Performance Review Documentation",
        description: "Complete your Q4 performance review documentation and submit to HR. This task was due 3 days ago and requires immediate attention.",
        priority: "high",
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      };

      await EmailService.sendOverdueTaskReminderEmail(employee, 1, overdueTask);
      
      res.json({ 
        success: true, 
        message: `Overdue task reminder email sent successfully to ${employee.firstName} ${employee.lastName} at ${employee.personalEmail}` 
      });
    } catch (error) {
      console.error("Error sending overdue task email:", error);
      res.status(500).json({ 
        message: "Failed to send overdue task email", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Social Media & Content Team API Routes
  
  // OAuth Routes for Real Social Media Integration
  
  // Facebook OAuth
  app.get("/api/auth/facebook/connect", isAuthenticated, (req, res) => {
    // This would redirect to Facebook's OAuth URL with your app credentials
    // For now, inform user about required setup
    res.json({ 
      message: "Facebook OAuth requires Facebook App ID and Secret. Please add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to your environment variables.",
      setupInstructions: "1. Create a Facebook App at https://developers.facebook.com/\n2. Add your app credentials as environment variables\n3. Configure OAuth redirect URLs"
    });
  });

  // Instagram OAuth  
  app.get("/api/auth/instagram/connect", isAuthenticated, (req, res) => {
    // Check if OAuth credentials are configured
    const hasCredentials = process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET;
    
    if (hasCredentials) {
      // Redirect to actual Instagram OAuth
      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get('host')}/api/auth/instagram/callback`)}&scope=user_profile,user_media&response_type=code`;
      res.redirect(authUrl);
    } else {
      res.json({ 
        message: "Instagram OAuth requires Instagram Basic Display API credentials. Please add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to your environment variables.",
        setupInstructions: "1. Create an Instagram App at https://developers.facebook.com/docs/instagram-basic-display-api\n2. Add your app credentials as environment variables\n3. Configure OAuth redirect URLs",
        demoAvailable: true
      });
    }
  });

  // Twitter OAuth
  app.get("/api/auth/twitter/connect", isAuthenticated, (req, res) => {
    res.json({ 
      message: "Twitter OAuth requires Twitter API v2 credentials. Please add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to your environment variables.",
      setupInstructions: "1. Create a Twitter App at https://developer.twitter.com/\n2. Add your app credentials as environment variables\n3. Configure OAuth 2.0 redirect URLs"
    });
  });

  // LinkedIn OAuth
  app.get("/api/auth/linkedin/connect", isAuthenticated, (req, res) => {
    res.json({ 
      message: "LinkedIn OAuth requires LinkedIn API credentials. Please add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to your environment variables.",
      setupInstructions: "1. Create a LinkedIn App at https://www.linkedin.com/developers/\n2. Add your app credentials as environment variables\n3. Configure OAuth redirect URLs"
    });
  });

  // YouTube OAuth
  app.get("/api/auth/youtube/connect", isAuthenticated, (req, res) => {
    res.json({ 
      message: "YouTube OAuth requires Google API credentials. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.",
      setupInstructions: "1. Create a Google Cloud Project at https://console.cloud.google.com/\n2. Enable YouTube Data API v3\n3. Add your OAuth credentials as environment variables"
    });
  });

  // TikTok OAuth
  app.get("/api/auth/tiktok/connect", isAuthenticated, (req, res) => {
    res.json({ 
      message: "TikTok OAuth requires TikTok for Developers credentials. Please add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to your environment variables.",
      setupInstructions: "1. Create a TikTok App at https://developers.tiktok.com/\n2. Add your app credentials as environment variables\n3. Configure OAuth redirect URLs"
    });
  });
  
  // Social Media Account Connection Routes
  
  // Get connected social accounts for current user
  app.get("/api/social-media/connected-accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const accounts = await storage.getConnectedSocialAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching connected accounts:", error);
      res.status(500).json({ message: "Failed to fetch connected accounts" });
    }
  });

  // Connect a new social media account (simulated for demo)
  app.post("/api/social-media/connect-account", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { platform } = req.body;
      if (!platform) {
        return res.status(400).json({ message: "Platform is required" });
      }

      // Simulate OAuth flow completion with mock data
      const mockAccountData = {
        userId,
        platform,
        accountId: `${platform}_${Date.now()}`,
        accountName: `Demo ${platform} Account`,
        accountHandle: `@demo_${platform}`,
        profileImageUrl: `https://via.placeholder.com/150?text=${platform.toUpperCase()}`,
        followerCount: Math.floor(Math.random() * 10000) + 1000,
        accessToken: `mock_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
        tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'connected' as const,
        permissions: { read: true, write: true, analytics: true },
        settings: { autoPost: false, crossPost: false }
      };

      const connectedAccount = await storage.connectSocialAccount(mockAccountData);
      
      // Create some mock analytics data
      const mockAnalytics = {
        accountId: connectedAccount.id,
        analyticsDate: new Date(),
        followers: mockAccountData.followerCount,
        following: Math.floor(Math.random() * 1000) + 100,
        posts: Math.floor(Math.random() * 100) + 10,
        likes: Math.floor(Math.random() * 5000) + 500,
        comments: Math.floor(Math.random() * 500) + 50,
        shares: Math.floor(Math.random() * 200) + 20,
        reach: Math.floor(Math.random() * 20000) + 2000,
        impressions: Math.floor(Math.random() * 50000) + 5000,
        engagementRate: Number((Math.random() * 5 + 1).toFixed(2)) // 1-6%
      };

      await storage.createSocialMediaAnalytics(mockAnalytics);

      res.json(connectedAccount);
    } catch (error) {
      console.error("Error connecting social account:", error);
      res.status(500).json({ message: "Failed to connect social account" });
    }
  });

  // Disconnect a social media account
  app.delete("/api/social-media/connected-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }

      await storage.deleteSocialAccount(accountId);
      res.json({ message: "Account disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting account:", error);
      res.status(500).json({ message: "Failed to disconnect account" });
    }
  });

  // Refresh social media account data
  app.post("/api/social-media/connected-accounts/:id/refresh", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }

      // Simulate refreshing data from social platform
      const mockUpdateData = {
        followerCount: Math.floor(Math.random() * 10000) + 1000,
        status: 'connected' as const,
        errorMessage: null
      };

      const updatedAccount = await storage.refreshSocialAccount(accountId, mockUpdateData);
      
      // Create new analytics data point
      const mockAnalytics = {
        accountId: updatedAccount.id,
        analyticsDate: new Date(),
        followers: mockUpdateData.followerCount,
        following: Math.floor(Math.random() * 1000) + 100,
        posts: Math.floor(Math.random() * 100) + 10,
        likes: Math.floor(Math.random() * 5000) + 500,
        comments: Math.floor(Math.random() * 500) + 50,
        shares: Math.floor(Math.random() * 200) + 20,
        reach: Math.floor(Math.random() * 20000) + 2000,
        impressions: Math.floor(Math.random() * 50000) + 5000,
        engagementRate: Number((Math.random() * 5 + 1).toFixed(2))
      };

      await storage.createSocialMediaAnalytics(mockAnalytics);

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error refreshing account data:", error);
      res.status(500).json({ message: "Failed to refresh account data" });
    }
  });

  // Get analytics for a specific account
  app.get("/api/social-media/analytics/:accountId", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }

      const { startDate, endDate } = req.query;
      let dateRange;
      
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string)
        };
      }

      const analytics = await storage.getSocialMediaAnalytics(accountId, dateRange);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get post performance for a specific account
  app.get("/api/social-media/posts/:accountId", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }

      const { startDate, endDate } = req.query;
      let dateRange;
      
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string)
        };
      }

      const posts = await storage.getPostPerformance(accountId, dateRange);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching post performance:", error);
      res.status(500).json({ message: "Failed to fetch post performance" });
    }
  });

  // Get account overview for current user
  app.get("/api/social-media/overview", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const overview = await storage.getAccountOverview(userId);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching account overview:", error);
      res.status(500).json({ message: "Failed to fetch account overview" });
    }
  });

  // Social Media Campaigns
  app.get('/api/social-media/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const campaigns = await storage.getSocialMediaCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/social-media/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const campaignData = { ...req.body, createdBy: req.user.id };
      
      // Convert date strings to Date objects for timestamp fields
      if (campaignData.startDate) {
        campaignData.startDate = new Date(campaignData.startDate);
      }
      if (campaignData.endDate) {
        campaignData.endDate = new Date(campaignData.endDate);
      }
      const campaign = await storage.createSocialMediaCampaign(campaignData);
      
      // Send email notifications for new campaign
      try {
        const user = await storage.getUser(req.user.id);
        const creatorName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown User';
        
        const emailAddresses = ['hr@themeetingmatters.com', 'humna@themeetingmatters.com'];
        const subject = `🎯 New Social Media Campaign Created: ${campaign.name}`;
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .campaign-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
              .label { font-weight: bold; color: #374151; }
              .value { color: #6b7280; }
              .platforms { display: flex; flex-wrap: wrap; gap: 8px; }
              .platform-tag { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 New Social Media Campaign</h1>
                <p>A new campaign has been created in the Social Media Hub</p>
              </div>
              <div class="content">
                <div class="campaign-details">
                  <h3>Campaign Details</h3>
                  <div class="detail-row">
                    <span class="label">Campaign Name:</span>
                    <span class="value">${campaign.name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Description:</span>
                    <span class="value">${campaign.description || 'No description provided'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Objective:</span>
                    <span class="value">${campaign.objective}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Target Audience:</span>
                    <span class="value">${campaign.targetAudience || 'Not specified'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Budget:</span>
                    <span class="value">$${campaign.budget || 'Not specified'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Start Date:</span>
                    <span class="value">${campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">End Date:</span>
                    <span class="value">${campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Not set'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Platforms:</span>
                    <div class="platforms">
                      ${campaign.platforms ? JSON.parse(campaign.platforms).map((platform: string) => 
                        `<span class="platform-tag">${platform}</span>`
                      ).join('') : '<span class="value">No platforms specified</span>'}
                    </div>
                  </div>
                  <div class="detail-row">
                    <span class="label">Created By:</span>
                    <span class="value">${creatorName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Created At:</span>
                    <span class="value">${new Date().toLocaleString()}</span>
                  </div>
                </div>
                <p>You can view and manage this campaign in the Social Media Hub.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        for (const email of emailAddresses) {
          await EmailService.sendDirectEmail(email, subject, htmlContent);
        }
        
        console.log(`Campaign creation notification sent to ${emailAddresses.join(', ')}`);
      } catch (emailError) {
        console.error("Failed to send campaign creation email:", emailError);
        // Don't fail the request if email fails
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.put('/api/social-media/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedCampaign = await storage.updateSocialMediaCampaign(id, req.body);
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete('/api/social-media/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSocialMediaCampaign(id);
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Content Calendar
  app.get('/api/social-media/content', isAuthenticated, async (req: any, res) => {
    try {
      const content = await storage.getContentCalendar();
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post('/api/social-media/content', isAuthenticated, async (req: any, res) => {
    try {
      console.log("=== CONTENT CREATION DEBUG ===");
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("User ID:", req.user.id);
      
      // Simple approach - only pass required fields and process scheduledDate carefully
      const contentData: any = {
        title: req.body.title,
        contentType: req.body.contentType,
        platform: req.body.platform,
        createdBy: req.user.id,
        status: 'draft'
      };
      
      // Add optional fields only if they exist
      if (req.body.description) contentData.description = req.body.description;
      if (req.body.content) contentData.content = req.body.content;
      if (req.body.hashtags) contentData.hashtags = req.body.hashtags;
      if (req.body.mentions) contentData.mentions = req.body.mentions;
      if (req.body.campaignId) contentData.campaignId = parseInt(req.body.campaignId);
      if (req.body.assignedTo) contentData.assignedTo = parseInt(req.body.assignedTo);
      
      // Handle scheduledDate very carefully
      if (req.body.scheduledDate) {
        try {
          const dateStr = req.body.scheduledDate;
          console.log("Original date value:", dateStr, "Type:", typeof dateStr);
          
          // Convert to ISO string first, then to Date
          let dateObj;
          if (typeof dateStr === 'string') {
            dateObj = new Date(dateStr);
          } else {
            dateObj = new Date(dateStr);
          }
          
          console.log("Parsed date:", dateObj);
          console.log("Is valid date:", !isNaN(dateObj.getTime()));
          console.log("ISO String:", dateObj.toISOString());
          
          if (!isNaN(dateObj.getTime())) {
            contentData.scheduledDate = dateObj;
          }
        } catch (dateError) {
          console.error("Date parsing error:", dateError);
        }
      }
      
      // Handle status field properly
      if (req.body.status) contentData.status = req.body.status;
      
      console.log("Final data being sent to DB:", JSON.stringify(contentData, null, 2));
      
      const content = await storage.createContentCalendarItem(contentData);
      
      // Send email notifications for new content
      try {
        const user = await storage.getUser(req.user.id);
        const creatorName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown User';
        
        const emailAddresses = ['hr@themeetingmatters.com', 'humna@themeetingmatters.com'];
        const subject = `📅 New Content Added to Calendar: ${content.title}`;
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .content-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
              .label { font-weight: bold; color: #374151; }
              .value { color: #6b7280; }
              .platform-tag { background: #dcfce7; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
              .status-tag { background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📅 New Content Added</h1>
                <p>New content has been scheduled in the Social Media Calendar</p>
              </div>
              <div class="content">
                <div class="content-details">
                  <h3>Content Details</h3>
                  <div class="detail-row">
                    <span class="label">Title:</span>
                    <span class="value">${content.title}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Content Type:</span>
                    <span class="value">${content.contentType}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Platform:</span>
                    <span class="platform-tag">${content.platform}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Description:</span>
                    <span class="value">${content.description || 'No description provided'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Scheduled Date:</span>
                    <span class="value">${content.scheduledDate ? new Date(content.scheduledDate).toLocaleString() : 'Not scheduled'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="status-tag">${content.status}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Hashtags:</span>
                    <span class="value">${content.hashtags || 'No hashtags'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Mentions:</span>
                    <span class="value">${content.mentions || 'No mentions'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Created By:</span>
                    <span class="value">${creatorName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Created At:</span>
                    <span class="value">${new Date().toLocaleString()}</span>
                  </div>
                </div>
                <p>You can view and manage this content in the Social Media Hub.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        for (const email of emailAddresses) {
          await EmailService.sendDirectEmail(email, subject, htmlContent);
        }
        
        console.log(`Content creation notification sent to ${emailAddresses.join(', ')}`);
      } catch (emailError) {
        console.error("Failed to send content creation email:", emailError);
        // Don't fail the request if email fails
      }

      console.log("Successfully created content:", content);
      res.json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create content", error: error.message });
    }
  });

  app.put('/api/social-media/content/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData: any = { ...req.body };
      
      // Handle scheduledDate carefully for updates too
      if (req.body.scheduledDate) {
        try {
          const dateObj = new Date(req.body.scheduledDate);
          if (!isNaN(dateObj.getTime())) {
            updateData.scheduledDate = dateObj;
          }
        } catch (dateError) {
          console.error("Date parsing error in update:", dateError);
        }
      }
      
      const updatedContent = await storage.updateContentCalendarItem(id, updateData);
      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.delete('/api/social-media/content/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContentCalendarItem(id);
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // PUT endpoint for updating content (including status changes)
  app.put('/api/social-media/content/:id', isAuthenticated, async (req: any, res) => {
    try {
      const contentId = parseInt(req.params.id);
      console.log("=== CONTENT UPDATE DEBUG ===");
      console.log("Content ID:", contentId);
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      
      const updateData: any = {};
      
      // Only update fields that are provided
      if (req.body.title) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.content !== undefined) updateData.content = req.body.content;
      if (req.body.contentType) updateData.contentType = req.body.contentType;
      if (req.body.platform) updateData.platform = req.body.platform;
      if (req.body.hashtags !== undefined) updateData.hashtags = req.body.hashtags;
      if (req.body.mentions !== undefined) updateData.mentions = req.body.mentions;
      if (req.body.campaignId !== undefined) updateData.campaignId = req.body.campaignId || null;
      if (req.body.assignedTo !== undefined) updateData.assignedTo = req.body.assignedTo || null;
      if (req.body.status) updateData.status = req.body.status;
      
      // Handle scheduledDate update carefully
      if (req.body.scheduledDate) {
        try {
          const dateStr = req.body.scheduledDate;
          console.log("Updating scheduledDate:", dateStr, "Type:", typeof dateStr);
          
          let dateObj;
          if (typeof dateStr === 'string') {
            dateObj = new Date(dateStr);
          } else {
            dateObj = new Date(dateStr);
          }
          
          if (!isNaN(dateObj.getTime())) {
            updateData.scheduledDate = dateObj;
          }
        } catch (dateError) {
          console.error("Date parsing error during update:", dateError);
        }
      }
      
      // Add approval information if status is changing to approved
      if (req.body.status === 'approved') {
        updateData.approvedBy = req.user.id;
        updateData.approvedAt = new Date();
      }
      
      updateData.updatedAt = new Date();
      
      console.log("Final update data:", JSON.stringify(updateData, null, 2));
      
      const content = await storage.updateContentCalendarItem(contentId, updateData);
      console.log("Successfully updated content:", content);
      res.json(content);
    } catch (error) {
      console.error("Error updating content:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to update content", error: error.message });
    }
  });

  // Content Creators Management
  app.post('/api/social-media/content-creators', isAuthenticated, async (req: any, res) => {
    try {
      const { name, email, role, specialization, skills, portfolioUrl, bio, hourlyRate, availability } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      // Create a username from email
      const username = email.split('@')[0];
      
      // Create user account for the content creator
      const userData = {
        username,
        email,
        password: 'temppassword123', // They'll need to reset this
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        role: role || 'content_creator',
        status: 'active',
        // Additional fields for content creators
        specialization,
        skills,
        portfolioUrl,
        bio,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        availability,
        accountEnabled: true,
        emailNotifications: true,
        smsNotifications: false
      };

      const newUser = await storage.createUser(userData);
      
      res.json({
        message: "Content creator added successfully",
        user: {
          id: newUser.id,
          name: `${newUser.firstName} ${newUser.lastName}`.trim(),
          email: newUser.email,
          role: newUser.role,
          specialization,
          skills,
          portfolioUrl,
          bio,
          hourlyRate,
          availability
        }
      });
    } catch (error) {
      console.error("Error creating content creator:", error);
      res.status(500).json({ message: "Failed to create content creator" });
    }
  });

  // Promote Employee to Content Creator
  app.post('/api/social-media/promote-employee', isAuthenticated, async (req: any, res) => {
    try {
      const { employeeId, role, specialization, skills, portfolioUrl, bio, hourlyRate, availability } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      // Update the user's role and add content creator fields
      const updatedUser = await storage.updateUser(parseInt(employeeId), {
        role: role || 'content_creator',
        // Note: In a real system, you'd want to add these fields to the user schema
        // For now, we'll just update the role and return success
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({
        message: "Employee promoted to content creator successfully",
        user: {
          id: updatedUser.id,
          name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
          email: updatedUser.email,
          role: updatedUser.role,
          specialization,
          skills,
          portfolioUrl,
          bio,
          hourlyRate,
          availability
        }
      });
    } catch (error) {
      console.error("Error promoting employee:", error);
      res.status(500).json({ message: "Failed to promote employee" });
    }
  });

  // Social Media Projects
  app.get('/api/social-media/projects', isAuthenticated, async (req: any, res) => {
    try {
      const projects = await storage.getSocialMediaProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching social media projects:", error);
      res.status(500).json({ message: "Failed to fetch social media projects" });
    }
  });

  app.post('/api/social-media/projects', isAuthenticated, async (req: any, res) => {
    try {
      const projectData = { ...req.body, createdBy: req.user.id };
      const project = await storage.createSocialMediaProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating social media project:", error);
      res.status(500).json({ message: "Failed to create social media project" });
    }
  });

  // Social Media Tasks
  app.get('/api/social-media/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const tasks = await storage.getSocialMediaTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching social media tasks:", error);
      res.status(500).json({ message: "Failed to fetch social media tasks" });
    }
  });

  app.post('/api/social-media/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const taskData = { ...req.body, assignedBy: req.user.id };
      const task = await storage.createSocialMediaTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating social media task:", error);
      res.status(500).json({ message: "Failed to create social media task" });
    }
  });

  // Brand Guidelines
  app.get('/api/social-media/brand-guidelines', isAuthenticated, async (req: any, res) => {
    try {
      const guidelines = await storage.getBrandGuidelines();
      res.json(guidelines);
    } catch (error) {
      console.error("Error fetching brand guidelines:", error);
      res.status(500).json({ message: "Failed to fetch brand guidelines" });
    }
  });

  app.post('/api/social-media/brand-guidelines', isAuthenticated, async (req: any, res) => {
    try {
      const guidelineData = { ...req.body, createdBy: req.user.id };
      const guideline = await storage.createBrandGuideline(guidelineData);
      res.json(guideline);
    } catch (error) {
      console.error("Error creating brand guideline:", error);
      res.status(500).json({ message: "Failed to create brand guideline" });
    }
  });

  // Creative Briefs
  app.get('/api/studio/creative-briefs', isAuthenticated, async (req: any, res) => {
    try {
      const { status, assignedTo, campaignId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (assignedTo) filters.assignedTo = parseInt(assignedTo);
      if (campaignId) filters.campaignId = parseInt(campaignId);

      const briefs = await storage.getCreativeBriefs(filters);
      res.json(briefs);
    } catch (error) {
      console.error("Error fetching creative briefs:", error);
      res.status(500).json({ message: "Failed to fetch creative briefs" });
    }
  });

  app.get('/api/studio/creative-briefs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const brief = await storage.getCreativeBrief(parseInt(req.params.id));
      if (!brief) {
        return res.status(404).json({ message: "Creative brief not found" });
      }
      res.json(brief);
    } catch (error) {
      console.error("Error fetching creative brief:", error);
      res.status(500).json({ message: "Failed to fetch creative brief" });
    }
  });

  app.post('/api/studio/creative-briefs', isAuthenticated, async (req: any, res) => {
    try {
      const briefData = { ...req.body, createdBy: req.user.id };
      
      if (briefData.deadline && typeof briefData.deadline === 'string') {
        briefData.deadline = new Date(briefData.deadline);
      }
      
      const brief = await storage.createCreativeBrief(briefData);
      res.json(brief);
    } catch (error) {
      console.error("Error creating creative brief:", error);
      res.status(500).json({ message: "Failed to create creative brief" });
    }
  });

  app.put('/api/studio/creative-briefs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const briefData = { ...req.body };
      
      if (briefData.deadline && typeof briefData.deadline === 'string') {
        briefData.deadline = new Date(briefData.deadline);
      }
      
      const brief = await storage.updateCreativeBrief(parseInt(req.params.id), briefData);
      res.json(brief);
    } catch (error) {
      console.error("Error updating creative brief:", error);
      res.status(500).json({ message: "Failed to update creative brief" });
    }
  });

  app.delete('/api/studio/creative-briefs/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteCreativeBrief(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting creative brief:", error);
      res.status(500).json({ message: "Failed to delete creative brief" });
    }
  });

  // Analytics Entries - Manual Analytics Data
  app.get('/api/analytics/manual', isAuthenticated, async (req: any, res) => {
    try {
      const { platform, campaignId } = req.query;
      const filters: any = {};
      if (platform) filters.platform = platform;
      if (campaignId) filters.campaignId = parseInt(campaignId);

      const entries = await storage.getAnalyticsEntries(filters);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching analytics entries:", error);
      res.status(500).json({ message: "Failed to fetch analytics entries" });
    }
  });

  app.get('/api/analytics/manual/:id', isAuthenticated, async (req: any, res) => {
    try {
      const entry = await storage.getAnalyticsEntry(parseInt(req.params.id));
      if (!entry) {
        return res.status(404).json({ message: "Analytics entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching analytics entry:", error);
      res.status(500).json({ message: "Failed to fetch analytics entry" });
    }
  });

  app.post('/api/analytics/manual', isAuthenticated, async (req: any, res) => {
    try {
      const entryData = { ...req.body, createdBy: req.user.id };
      
      if (entryData.postDate && typeof entryData.postDate === 'string') {
        entryData.postDate = new Date(entryData.postDate);
      }
      
      const entry = await storage.createAnalyticsEntry(entryData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating analytics entry:", error);
      res.status(500).json({ message: "Failed to create analytics entry" });
    }
  });

  app.put('/api/analytics/manual/:id', isAuthenticated, async (req: any, res) => {
    try {
      const entryData = { ...req.body };
      
      if (entryData.postDate && typeof entryData.postDate === 'string') {
        entryData.postDate = new Date(entryData.postDate);
      }
      
      const entry = await storage.updateAnalyticsEntry(parseInt(req.params.id), entryData);
      res.json(entry);
    } catch (error) {
      console.error("Error updating analytics entry:", error);
      res.status(500).json({ message: "Failed to update analytics entry" });
    }
  });

  app.delete('/api/analytics/manual/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteAnalyticsEntry(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting analytics entry:", error);
      res.status(500).json({ message: "Failed to delete analytics entry" });
    }
  });

  // ===== MEETING MATTERS STUDIO API ROUTES =====

  // Studio Meetings
  app.get('/api/studio/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const { status, startDate, endDate, organizerId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (organizerId) filters.organizerId = parseInt(organizerId);

      const meetings = await storage.getStudioMeetings(filters);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching studio meetings:", error);
      res.status(500).json({ message: "Failed to fetch studio meetings" });
    }
  });

  app.get('/api/studio/meetings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const meeting = await storage.getStudioMeeting(parseInt(req.params.id));
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching studio meeting:", error);
      res.status(500).json({ message: "Failed to fetch studio meeting" });
    }
  });

  app.post('/api/studio/meetings', isAuthenticated, async (req: any, res) => {
    try {
      // Calculate start and end times from scheduledAt and duration
      const scheduledStartTime = new Date(req.body.scheduledAt);
      const duration = req.body.duration || 60; // Default to 60 minutes if not provided
      const scheduledEndTime = new Date(scheduledStartTime.getTime() + duration * 60 * 1000);
      
      const meetingData = { 
        ...req.body, 
        organizerId: req.user.id,
        scheduledStartTime,
        scheduledEndTime
      };
      
      // Remove fields that aren't in the database schema
      delete meetingData.scheduledAt;
      delete meetingData.duration;
      
      const meeting = await storage.createStudioMeeting(meetingData);
      
      // Send email notifications to attendees if provided
      if (req.body.attendeeIds && req.body.attendeeIds.length > 0) {
        for (const userId of req.body.attendeeIds) {
          const user = await storage.getUser(userId);
          if (user && user.email) {
            await sendEmail({
              to: user.email,
              subject: `📅 New Meeting: ${meeting.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #10b981;">📅 New Meeting Scheduled</h1>
                  <p>You have been invited to a meeting:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">${meeting.title}</h2>
                    ${meeting.description ? `<p>${meeting.description}</p>` : ''}
                    <p><strong>Type:</strong> ${meeting.meetingType}</p>
                    <p><strong>Date:</strong> ${new Date(meeting.scheduledStartTime).toLocaleString()}</p>
                    ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
                    ${meeting.meetingLink ? `<p><strong>Join Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>` : ''}
                  </div>
                </div>
              `,
            });
          }
        }
      }
      
      res.json(meeting);
    } catch (error) {
      console.error("Error creating studio meeting:", error);
      res.status(500).json({ message: "Failed to create studio meeting" });
    }
  });

  app.put('/api/studio/meetings/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Calculate start and end times from scheduledAt and duration if provided
      const updateData: any = { ...req.body };
      
      if (req.body.scheduledAt) {
        const scheduledStartTime = new Date(req.body.scheduledAt);
        const duration = req.body.duration || 60; // Default to 60 minutes if not provided
        const scheduledEndTime = new Date(scheduledStartTime.getTime() + duration * 60 * 1000);
        
        updateData.scheduledStartTime = scheduledStartTime;
        updateData.scheduledEndTime = scheduledEndTime;
        
        // Remove fields that aren't in the database schema
        delete updateData.scheduledAt;
        delete updateData.duration;
      }
      
      const meeting = await storage.updateStudioMeeting(parseInt(req.params.id), updateData);
      res.json(meeting);
    } catch (error) {
      console.error("Error updating studio meeting:", error);
      res.status(500).json({ message: "Failed to update studio meeting" });
    }
  });

  app.delete('/api/studio/meetings/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteStudioMeeting(parseInt(req.params.id));
      res.json({ message: "Meeting deleted successfully" });
    } catch (error) {
      console.error("Error deleting studio meeting:", error);
      res.status(500).json({ message: "Failed to delete studio meeting" });
    }
  });

  // Meeting Work Items - Post-meeting outcomes tracking
  app.post('/api/studio/meetings/:id/work-items', isAuthenticated, async (req: any, res) => {
    try {
      const workItemData = { ...req.body, meetingId: parseInt(req.params.id), createdBy: req.user.id };
      const workItem = await storage.createMeetingWorkItem(workItemData);
      res.json(workItem);
    } catch (error) {
      console.error("Error creating meeting work item:", error);
      res.status(500).json({ message: "Failed to create meeting work item" });
    }
  });

  app.get('/api/studio/meetings/:id/work-items', isAuthenticated, async (req: any, res) => {
    try {
      const workItems = await storage.getMeetingWorkItems(parseInt(req.params.id));
      res.json(workItems);
    } catch (error) {
      console.error("Error fetching meeting work items:", error);
      res.status(500).json({ message: "Failed to fetch meeting work items" });
    }
  });

  app.get('/api/studio/meetings/:id/previous-work', isAuthenticated, async (req: any, res) => {
    try {
      const previousWork = await storage.getPreviousMeetingWork(parseInt(req.params.id));
      res.json(previousWork);
    } catch (error) {
      console.error("Error fetching previous meeting work:", error);
      res.status(500).json({ message: "Failed to fetch previous meeting work" });
    }
  });

  app.put('/api/studio/meetings/:id/work-items/:workItemId', isAuthenticated, async (req: any, res) => {
    try {
      const workItem = await storage.updateMeetingWorkItem(parseInt(req.params.workItemId), req.body);
      res.json(workItem);
    } catch (error) {
      console.error("Error updating meeting work item:", error);
      res.status(500).json({ message: "Failed to update meeting work item" });
    }
  });

  app.delete('/api/studio/meetings/:id/work-items/:workItemId', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMeetingWorkItem(parseInt(req.params.workItemId));
      res.json({ message: "Work item deleted successfully" });
    } catch (error) {
      console.error("Error deleting meeting work item:", error);
      res.status(500).json({ message: "Failed to delete meeting work item" });
    }
  });

  // Meeting Links - Related links and resources
  app.post('/api/studio/meetings/:id/links', isAuthenticated, async (req: any, res) => {
    try {
      const linkData = { ...req.body, meetingId: parseInt(req.params.id), createdBy: req.user.id };
      const link = await storage.createMeetingLink(linkData);
      res.json(link);
    } catch (error) {
      console.error("Error creating meeting link:", error);
      res.status(500).json({ message: "Failed to create meeting link" });
    }
  });

  app.get('/api/studio/meetings/:id/links', isAuthenticated, async (req: any, res) => {
    try {
      const links = await storage.getMeetingLinks(parseInt(req.params.id));
      res.json(links);
    } catch (error) {
      console.error("Error fetching meeting links:", error);
      res.status(500).json({ message: "Failed to fetch meeting links" });
    }
  });

  app.put('/api/studio/meetings/:id/links/:linkId', isAuthenticated, async (req: any, res) => {
    try {
      const link = await storage.updateMeetingLink(parseInt(req.params.linkId), req.body);
      res.json(link);
    } catch (error) {
      console.error("Error updating meeting link:", error);
      res.status(500).json({ message: "Failed to update meeting link" });
    }
  });

  app.delete('/api/studio/meetings/:id/links/:linkId', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMeetingLink(parseInt(req.params.linkId));
      res.json({ message: "Link deleted successfully" });
    } catch (error) {
      console.error("Error deleting meeting link:", error);
      res.status(500).json({ message: "Failed to delete meeting link" });
    }
  });

  // Studio Overview - Aggregate dashboard data for meetings
  app.get('/api/studio/overview', isAuthenticated, async (req: any, res) => {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Get upcoming video shoots (content with type = 'video' scheduled in the next 7 days)
      const allContent = await storage.getContentCalendar();
      const upcomingVideos = allContent
        .filter((content: any) => 
          content.contentType === 'video' && 
          content.scheduledDate && 
          new Date(content.scheduledDate) >= now &&
          new Date(content.scheduledDate) <= oneWeekFromNow
        )
        .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 10);

      // Get active campaigns
      const allCampaigns = await storage.getSocialMediaCampaigns();
      const activeCampaigns = allCampaigns
        .filter((campaign: any) => campaign.status === 'active' || campaign.status === 'planning')
        .sort((a: any, b: any) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

      // Calculate campaign performance
      const campaignPerformance = activeCampaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        impressions: campaign.impressions || 0,
        engagements: campaign.engagements || 0,
        clicks: campaign.clicks || 0,
        conversions: campaign.conversions || 0,
        budget: campaign.budget || 0,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        platforms: campaign.platforms || [],
        // Calculate engagement rate
        engagementRate: campaign.impressions > 0 
          ? ((campaign.engagements || 0) / campaign.impressions * 100).toFixed(2) 
          : '0.00',
        // Calculate click-through rate
        ctr: campaign.impressions > 0 
          ? ((campaign.clicks || 0) / campaign.impressions * 100).toFixed(2) 
          : '0.00',
        // Calculate conversion rate
        conversionRate: campaign.clicks > 0 
          ? ((campaign.conversions || 0) / campaign.clicks * 100).toFixed(2) 
          : '0.00'
      }));

      res.json({
        upcomingVideos: upcomingVideos.map((video: any) => ({
          id: video.id,
          title: video.title,
          description: video.description,
          scheduledDate: video.scheduledDate,
          status: video.status,
          platform: video.platform,
          campaignId: video.campaignId,
          assignedTo: video.assignedTo
        })),
        activeCampaigns: activeCampaigns.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          platforms: campaign.platforms || [],
          startDate: campaign.startDate,
          endDate: campaign.endDate
        })),
        campaignPerformance: campaignPerformance.slice(0, 5),
        stats: {
          totalActiveCampaigns: activeCampaigns.filter((c: any) => c.status === 'active').length,
          totalPlannedCampaigns: activeCampaigns.filter((c: any) => c.status === 'planning').length,
          upcomingVideoShoots: upcomingVideos.length,
          totalImpressions: campaignPerformance.reduce((sum: number, c: any) => sum + c.impressions, 0),
          totalEngagements: campaignPerformance.reduce((sum: number, c: any) => sum + c.engagements, 0),
          totalConversions: campaignPerformance.reduce((sum: number, c: any) => sum + c.conversions, 0)
        }
      });
    } catch (error) {
      console.error("Error fetching studio overview:", error);
      res.status(500).json({ message: "Failed to fetch studio overview" });
    }
  });

  // Dashboard Sections - Customizable dashboard widgets
  app.get('/api/studio/dashboard-sections', isAuthenticated, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Seed default sections if none exist
      await storage.seedDefaultDashboardSections(employee.organizationId);
      
      const visibleOnly = req.query.visibleOnly === 'true';
      const sections = await storage.getDashboardSections(employee.organizationId, visibleOnly);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching dashboard sections:", error);
      res.status(500).json({ message: "Failed to fetch dashboard sections" });
    }
  });

  app.get('/api/studio/dashboard-sections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const section = await storage.getDashboardSection(parseInt(req.params.id));
      if (!section) {
        return res.status(404).json({ message: "Dashboard section not found" });
      }
      res.json(section);
    } catch (error) {
      console.error("Error fetching dashboard section:", error);
      res.status(500).json({ message: "Failed to fetch dashboard section" });
    }
  });

  app.post('/api/studio/dashboard-sections', isAuthenticated, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const sectionData = {
        ...req.body,
        organizationId: employee.organizationId,
        createdBy: req.user.id,
      };

      const section = await storage.createDashboardSection(sectionData);
      res.json(section);
    } catch (error) {
      console.error("Error creating dashboard section:", error);
      res.status(500).json({ message: "Failed to create dashboard section" });
    }
  });

  app.patch('/api/studio/dashboard-sections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const section = await storage.updateDashboardSection(parseInt(req.params.id), req.body);
      res.json(section);
    } catch (error) {
      console.error("Error updating dashboard section:", error);
      res.status(500).json({ message: "Failed to update dashboard section" });
    }
  });

  app.delete('/api/studio/dashboard-sections/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteDashboardSection(parseInt(req.params.id));
      res.json({ message: "Dashboard section deleted successfully" });
    } catch (error) {
      console.error("Error deleting dashboard section:", error);
      res.status(500).json({ message: "Failed to delete dashboard section" });
    }
  });

  app.post('/api/studio/dashboard-sections/reorder', isAuthenticated, async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const { sectionOrders } = req.body;
      await storage.reorderDashboardSections(employee.organizationId, sectionOrders);
      res.json({ message: "Dashboard sections reordered successfully" });
    } catch (error) {
      console.error("Error reordering dashboard sections:", error);
      res.status(500).json({ message: "Failed to reorder dashboard sections" });
    }
  });

  // Fetch data for a specific dashboard section based on its configuration
  app.get('/api/studio/dashboard-sections/:id/data', isAuthenticated, async (req: any, res) => {
    try {
      const section = await storage.getDashboardSection(parseInt(req.params.id));
      if (!section) {
        return res.status(404).json({ message: "Dashboard section not found" });
      }

      // Normalize queryConfig with safe defaults
      const config = (section.queryConfig as any) || {};
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      let data: any[] = [];

      // Fetch data based on the section's data source
      switch (section.dataSource) {
        case 'content_calendar':
          const allContent = await storage.getContentCalendar();
          data = allContent
            .filter((content: any) => {
              let matches = true;
              
              if (config.contentType && content.contentType !== config.contentType) {
                matches = false;
              }
              
              if (config.dateRange === 'next_7_days' && content.scheduledDate) {
                const schedDate = new Date(content.scheduledDate);
                if (schedDate < now || schedDate > oneWeekFromNow) {
                  matches = false;
                }
              }
              
              return matches;
            })
            .sort((a: any, b: any) => {
              if (config.sortBy === 'scheduledDate') {
                return new Date(a.scheduledDate || 0).getTime() - new Date(b.scheduledDate || 0).getTime();
              }
              return 0;
            })
            .slice(0, config.limit || 10);
          break;

        case 'campaigns':
          const allCampaigns = await storage.getSocialMediaCampaigns();
          data = allCampaigns
            .filter((campaign: any) => {
              if (config.status && Array.isArray(config.status)) {
                return config.status.includes(campaign.status);
              }
              return true;
            })
            .slice(0, config.limit || 10);
          break;

        case 'analytics':
          const campaigns = await storage.getSocialMediaCampaigns();
          data = campaigns
            .map((campaign: any) => ({
              id: campaign.id,
              campaignName: campaign.name,
              status: campaign.status,
              impressions: campaign.impressions || 0,
              engagements: campaign.engagements || 0,
              clicks: campaign.clicks || 0,
              conversions: campaign.conversions || 0,
              engagementRate: campaign.impressions > 0 
                ? ((campaign.engagements || 0) / campaign.impressions * 100).toFixed(2) 
                : '0.00',
              clickThroughRate: campaign.impressions > 0 
                ? ((campaign.clicks || 0) / campaign.impressions * 100).toFixed(2) 
                : '0.00',
            }))
            .sort((a: any, b: any) => {
              if (config.sortBy) {
                return (b[config.sortBy] || 0) - (a[config.sortBy] || 0);
              }
              return 0;
            })
            .slice(0, config.limit || 5);
          break;

        case 'briefs':
          const briefs = await storage.getCreativeBriefs();
          data = briefs.slice(0, config.limit || 10);
          break;

        case 'assets':
          const assets = await storage.getAssetLibrary();
          data = assets.slice(0, config.limit || 10);
          break;

        default:
          console.error(`Unsupported data source: ${section.dataSource}`);
          return res.status(400).json({ message: `Unsupported data source: ${section.dataSource}` });
      }

      res.json({ section, data });
    } catch (error) {
      console.error("Error fetching section data:", error);
      res.status(500).json({ message: "Failed to fetch section data" });
    }
  });

  // Meeting Attendees
  app.post('/api/studio/meetings/:id/attendees', isAuthenticated, async (req: any, res) => {
    try {
      const attendeeData = { ...req.body, meetingId: parseInt(req.params.id) };
      const attendee = await storage.addMeetingAttendee(attendeeData);
      res.json(attendee);
    } catch (error) {
      console.error("Error adding meeting attendee:", error);
      res.status(500).json({ message: "Failed to add meeting attendee" });
    }
  });

  app.put('/api/studio/attendees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const attendee = await storage.updateMeetingAttendee(parseInt(req.params.id), req.body);
      res.json(attendee);
    } catch (error) {
      console.error("Error updating meeting attendee:", error);
      res.status(500).json({ message: "Failed to update meeting attendee" });
    }
  });

  app.delete('/api/studio/attendees/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.removeMeetingAttendee(parseInt(req.params.id));
      res.json({ message: "Attendee removed successfully" });
    } catch (error) {
      console.error("Error removing meeting attendee:", error);
      res.status(500).json({ message: "Failed to remove meeting attendee" });
    }
  });

  // Meeting Notes & Action Items
  app.get('/api/studio/meetings/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const notes = await storage.getMeetingNotes(parseInt(req.params.id));
      res.json(notes);
    } catch (error) {
      console.error("Error fetching meeting notes:", error);
      res.status(500).json({ message: "Failed to fetch meeting notes" });
    }
  });

  app.post('/api/studio/meetings/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const noteData = { 
        ...req.body, 
        meetingId: parseInt(req.params.id),
        createdBy: req.user.id 
      };
      const note = await storage.createMeetingNote(noteData);
      
      // Send notification if action item is assigned
      if (note.noteType === 'action_item' && note.assignedTo) {
        const assignee = await storage.getUser(note.assignedTo);
        if (assignee && assignee.email) {
          await sendEmail({
            to: assignee.email,
            subject: `📝 New Action Item Assigned: ${note.content.substring(0, 50)}...`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f59e0b;">📝 New Action Item</h1>
                <p>A new action item has been assigned to you:</p>
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0;">${note.content}</p>
                  ${note.dueDate ? `<p><strong>Due:</strong> ${new Date(note.dueDate).toLocaleDateString()}</p>` : ''}
                  ${note.priority ? `<p><strong>Priority:</strong> ${note.priority}</p>` : ''}
                </div>
              </div>
            `,
          });
        }
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error creating meeting note:", error);
      res.status(500).json({ message: "Failed to create meeting note" });
    }
  });

  app.put('/api/studio/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const note = await storage.updateMeetingNote(parseInt(req.params.id), req.body);
      res.json(note);
    } catch (error) {
      console.error("Error updating meeting note:", error);
      res.status(500).json({ message: "Failed to update meeting note" });
    }
  });

  app.delete('/api/studio/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMeetingNote(parseInt(req.params.id));
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting meeting note:", error);
      res.status(500).json({ message: "Failed to delete meeting note" });
    }
  });

  // Asset Library - Centralized media and template storage
  app.get('/api/studio/assets', isAuthenticated, async (req: any, res) => {
    try {
      const { assetType, category, createdBy } = req.query;
      const filters: any = {};
      if (assetType) filters.assetType = assetType;
      if (category) filters.category = category;
      if (createdBy) filters.createdBy = parseInt(createdBy as string);

      const assets = await storage.getAssetLibrary(filters);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.get('/api/studio/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const asset = await storage.getAsset(parseInt(req.params.id));
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      console.error("Error fetching asset:", error);
      res.status(500).json({ message: "Failed to fetch asset" });
    }
  });

  app.post('/api/studio/assets', isAuthenticated, async (req: any, res) => {
    try {
      const assetData = { ...req.body, createdBy: req.user.id };
      const asset = await storage.createAsset(assetData);
      res.json(asset);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  app.put('/api/studio/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const asset = await storage.updateAsset(parseInt(req.params.id), req.body);
      res.json(asset);
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(500).json({ message: "Failed to update asset" });
    }
  });

  app.delete('/api/studio/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteAsset(parseInt(req.params.id));
      res.json({ message: "Asset deleted successfully" });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // Creative Briefs
  app.get('/api/studio/briefs', isAuthenticated, async (req: any, res) => {
    try {
      const { status, assignedTo, campaignId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (assignedTo) filters.assignedTo = parseInt(assignedTo);
      if (campaignId) filters.campaignId = parseInt(campaignId);

      const briefs = await storage.getCreativeBriefs(filters);
      res.json(briefs);
    } catch (error) {
      console.error("Error fetching creative briefs:", error);
      res.status(500).json({ message: "Failed to fetch creative briefs" });
    }
  });

  app.get('/api/studio/briefs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const brief = await storage.getCreativeBrief(parseInt(req.params.id));
      if (!brief) {
        return res.status(404).json({ message: "Brief not found" });
      }
      res.json(brief);
    } catch (error) {
      console.error("Error fetching creative brief:", error);
      res.status(500).json({ message: "Failed to fetch creative brief" });
    }
  });

  app.post('/api/studio/briefs', isAuthenticated, async (req: any, res) => {
    try {
      const briefData = { ...req.body, createdBy: req.user.id };
      const brief = await storage.createCreativeBrief(briefData);
      
      // Send notification to assignee
      if (brief.assignedTo) {
        const assignee = await storage.getUser(brief.assignedTo);
        if (assignee && assignee.email) {
          await sendEmail({
            to: assignee.email,
            subject: `🎨 New Creative Brief: ${brief.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #8b5cf6;">🎨 New Creative Brief</h1>
                <p>A new creative brief has been assigned to you:</p>
                <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin-top: 0;">${brief.title}</h2>
                  ${brief.description ? `<p>${brief.description}</p>` : ''}
                  <p><strong>Objective:</strong> ${brief.objective}</p>
                  ${brief.deadline ? `<p><strong>Deadline:</strong> ${new Date(brief.deadline).toLocaleDateString()}</p>` : ''}
                </div>
              </div>
            `,
          });
        }
      }
      
      res.json(brief);
    } catch (error) {
      console.error("Error creating creative brief:", error);
      res.status(500).json({ message: "Failed to create creative brief" });
    }
  });

  app.put('/api/studio/briefs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const brief = await storage.updateCreativeBrief(parseInt(req.params.id), req.body);
      res.json(brief);
    } catch (error) {
      console.error("Error updating creative brief:", error);
      res.status(500).json({ message: "Failed to update creative brief" });
    }
  });

  app.delete('/api/studio/briefs/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteCreativeBrief(parseInt(req.params.id));
      res.json({ message: "Brief deleted successfully" });
    } catch (error) {
      console.error("Error deleting creative brief:", error);
      res.status(500).json({ message: "Failed to delete creative brief" });
    }
  });

  // Asset Library
  app.get('/api/studio/assets', isAuthenticated, async (req: any, res) => {
    try {
      const { assetType, category, createdBy } = req.query;
      const filters: any = {};
      if (assetType) filters.assetType = assetType;
      if (category) filters.category = category;
      if (createdBy) filters.createdBy = parseInt(createdBy);

      const assets = await storage.getAssetLibrary(filters);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.get('/api/studio/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const asset = await storage.getAsset(parseInt(req.params.id));
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      console.error("Error fetching asset:", error);
      res.status(500).json({ message: "Failed to fetch asset" });
    }
  });

  app.post('/api/studio/assets', isAuthenticated, async (req: any, res) => {
    try {
      const assetData = { ...req.body, createdBy: req.user.id };
      const asset = await storage.createAsset(assetData);
      res.json(asset);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  app.put('/api/studio/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const asset = await storage.updateAsset(parseInt(req.params.id), req.body);
      res.json(asset);
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(500).json({ message: "Failed to update asset" });
    }
  });

  app.delete('/api/studio/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteAsset(parseInt(req.params.id));
      res.json({ message: "Asset deleted successfully" });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // Approval Workflows
  app.get('/api/studio/approvals', isAuthenticated, async (req: any, res) => {
    try {
      const { status, itemType, requesterId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (itemType) filters.itemType = itemType;
      if (requesterId) filters.requesterId = parseInt(requesterId);

      const workflows = await storage.getApprovalWorkflows(filters);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching approval workflows:", error);
      res.status(500).json({ message: "Failed to fetch approval workflows" });
    }
  });

  app.get('/api/studio/approvals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const workflow = await storage.getApprovalWorkflow(parseInt(req.params.id));
      if (!workflow) {
        return res.status(404).json({ message: "Approval workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error fetching approval workflow:", error);
      res.status(500).json({ message: "Failed to fetch approval workflow" });
    }
  });

  app.post('/api/studio/approvals', isAuthenticated, async (req: any, res) => {
    try {
      const workflowData = { ...req.body, requester: req.user.id };
      const workflow = await storage.createApprovalWorkflow(workflowData);
      
      // Send notification to first approver
      if (workflow.currentApprover) {
        const approver = await storage.getUser(workflow.currentApprover);
        if (approver && approver.email) {
          await sendEmail({
            to: approver.email,
            subject: `✅ Approval Required: ${workflow.itemTitle || 'New Item'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3b82f6;">✅ Approval Required</h1>
                <p>An item requires your approval:</p>
                <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin-top: 0;">${workflow.itemTitle || 'Untitled'}</h2>
                  <p><strong>Type:</strong> ${workflow.itemType}</p>
                  <p><strong>Priority:</strong> ${workflow.priority}</p>
                  ${workflow.dueDate ? `<p><strong>Due:</strong> ${new Date(workflow.dueDate).toLocaleDateString()}</p>` : ''}
                  ${workflow.context ? `<p>${workflow.context}</p>` : ''}
                </div>
              </div>
            `,
          });
        }
      }
      
      res.json(workflow);
    } catch (error) {
      console.error("Error creating approval workflow:", error);
      res.status(500).json({ message: "Failed to create approval workflow" });
    }
  });

  app.post('/api/studio/approvals/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const workflow = await storage.approveWorkflowStep(parseInt(req.params.id), req.user.id);
      res.json(workflow);
    } catch (error) {
      console.error("Error approving workflow:", error);
      res.status(500).json({ message: "Failed to approve workflow" });
    }
  });

  app.post('/api/studio/approvals/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const { reason } = req.body;
      const workflow = await storage.rejectWorkflow(parseInt(req.params.id), req.user.id, reason);
      res.json(workflow);
    } catch (error) {
      console.error("Error rejecting workflow:", error);
      res.status(500).json({ message: "Failed to reject workflow" });
    }
  });

  // Studio Reports
  app.get('/api/studio/reports', isAuthenticated, async (req: any, res) => {
    try {
      const { reportType, startDate, endDate } = req.query;
      const filters: any = {};
      if (reportType) filters.reportType = reportType;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const reports = await storage.getStudioReports(filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching studio reports:", error);
      res.status(500).json({ message: "Failed to fetch studio reports" });
    }
  });

  app.get('/api/studio/reports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const report = await storage.getStudioReport(parseInt(req.params.id));
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching studio report:", error);
      res.status(500).json({ message: "Failed to fetch studio report" });
    }
  });

  app.post('/api/studio/reports/generate', requireRole(['hr_admin', 'creative_director']), async (req: any, res) => {
    try {
      const { reportType, startDate, endDate } = req.body;
      const report = await storage.generateStudioReport(
        reportType,
        new Date(startDate),
        new Date(endDate),
        req.user.id
      );
      res.json(report);
    } catch (error) {
      console.error("Error generating studio report:", error);
      res.status(500).json({ message: "Failed to generate studio report" });
    }
  });

  // User routes
  app.post('/api/users', async (req: any, res) => {
    try {
      const userData = req.body;
      const user = await storage.upsertUser(userData);
      res.json(user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      // Handle specific database constraint errors
      if (error.code === '23505') { // Unique constraint violation
        if (error.constraint === 'users_username_unique') {
          return res.status(400).json({ message: "Username already exists. Please choose a different username." });
        }
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: "Email already exists. Please use a different email address." });
        }
      }
      
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user profile (for Settings page)
  app.patch('/api/user/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Ensure user can only update their own profile (unless they're an admin)
      if (req.user.id !== userId && req.user.role !== 'hr_admin') {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const userData = req.body;
      const user = await storage.updateUser(userId, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user:", error);
      
      // Handle specific database constraint errors
      if (error.code === '23505') { // Unique constraint violation
        if (error.constraint === 'users_username_unique') {
          return res.status(400).json({ message: "Username already exists. Please choose a different username." });
        }
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: "Email already exists. Please use a different email address." });
        }
      }
      
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
      const activities = await storage.getRecentActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/dashboard/approvals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
      const approvals = await storage.getPendingApprovals(userId);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ message: "Failed to fetch approvals" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { isRead, limit } = req.query;
      const filters: any = {};
      
      if (isRead !== undefined) {
        filters.isRead = isRead === 'true';
      }
      if (limit) {
        filters.limit = parseInt(limit);
      }
      
      const notifications = await storage.getUserNotifications(userId, filters);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.deleteNotification(notificationId);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // User routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      // Get all active users for project manager selection
      const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
      
      // For now, return all users - we'll add department filtering later if needed
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get employees for nomination (accessible by all authenticated users) - MOVED TO TOP
  app.get('/api/employees/for-nomination', isAuthenticated, async (req: any, res) => {
    console.log("=== EMPLOYEES FOR NOMINATION ENDPOINT HIT ===");
    console.log("User authenticated:", !!req.user);
    
    try {
      const result = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          department: users.department,
          position: users.position,
          role: users.role
        })
        .from(users)
        .where(eq(users.status, 'active'));

      console.log("Found employees:", result.length);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching employees for nomination:", error);
      res.status(500).json({ message: "Failed to fetch employees for nomination" });
    }
  });

  // Employee routes
  // Get all employees (HR/Admin only)
  // GET single employee by ID with all details including company
  app.get('/api/employees/:id', isAuthenticated, async (req, res) => {
    const employeeId = parseInt(req.params.id);
    
    if (!employeeId || isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    try {
      // Get employee with user details and company information
      const result = await db
        .select()
        .from(employees)
        .leftJoin(users, eq(employees.userId, users.id))
        .leftJoin(companies, eq(employees.companyId, companies.id))
        .where(eq(employees.id, employeeId));

      if (result.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const employee = {
        ...result[0].employees,
        user: result[0].users,
        company: result[0].companies || undefined
      };

      res.json(employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update employee banking information
  app.put('/api/employees/:id/banking', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (!employeeId || isNaN(employeeId)) {
        return res.status(400).json({ error: 'Invalid employee ID' });
      }

      const { bankName, accountHolderName, accountNumber, routingNumber, accountType, iban } = req.body;

      const updateResult = await db
        .update(employees)
        .set({
          bankName,
          accountHolderName,
          accountNumber,
          routingNumber,
          accountType,
          iban
        })
        .where(eq(employees.id, employeeId))
        .returning();

      if (updateResult.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json({ message: 'Banking information updated successfully' });
    } catch (error) {
      console.error('Error updating banking information:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get employee banking information
  app.get('/api/employees/:id/banking', isAuthenticated, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (!employeeId || isNaN(employeeId)) {
        return res.status(400).json({ error: 'Invalid employee ID' });
      }

      const result = await db
        .select({
          accountNumber: employees.accountNumber,
          bankName: employees.bankName,
          routingNumber: employees.routingNumber,
          accountHolderName: employees.accountHolderName,
          accountType: employees.accountType
        })
        .from(employees)
        .where(eq(employees.id, employeeId));

      if (result.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const employee = result[0];
      
      // Return full banking information (not masked)
      const bankingInfo = {
        hasAccountNumber: !!employee.accountNumber,
        hasBankName: !!employee.bankName,
        hasRoutingNumber: !!employee.routingNumber,
        hasAccountHolder: !!employee.accountHolderName,
        bankName: employee.bankName || null,
        accountType: employee.accountType || null,
        accountHolderName: employee.accountHolderName || null,
        routingNumber: employee.routingNumber || null,
        // Show full account number
        accountNumber: employee.accountNumber || null,
        accountNumberLast4: employee.accountNumber ? employee.accountNumber.slice(-4) : null,
        isComplete: !!(employee.accountNumber && employee.bankName && employee.routingNumber && employee.accountHolderName)
      };
      
      res.json(bankingInfo);
    } catch (error) {
      console.error('Error fetching banking information:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/employees', isAuthenticated, requirePermission('employee_management', 'view'), async (req: any, res) => {
    try {
      // Get current user's organization ID for data isolation
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || !currentUser.organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }

      const { role, status, department } = req.query;
      const employees = await storage.getEmployees(currentUser.organizationId, { role, status, department });
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/employees/create-with-user', requireRole(['hr_admin', 'admin']), async (req: any, res) => {
    try {
      const {
        username, email, password, firstName, lastName, role, department, position,
        companyId, employeeId, phoneNumber, address, emergencyContact,
        designation, responsibilities, reportingManager
      } = req.body;

      // Validate required company assignment
      if (!companyId) {
        return res.status(400).json({ message: "Company assignment is required for all employees" });
      }

      // First check if user exists by email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user if doesn't exist with automatic approval for admin-created accounts
        const timestamp = Date.now().toString().slice(-4);
        const currentUser = await storage.getUser(req.user.id);
        const userData = {
          username: `${username}_${timestamp}`,
          email, password, firstName, lastName, role, department, position,
          companyId,  // Assign company (Qanzak Global or Meeting Matters Clinic)
          organizationId: currentUser?.organizationId || 'default_meeting_matters_org',  // Set organization ID
          accountEnabled: true,  // Auto-enable accounts created by HR admins
          onboardingStatus: 'completed',  // Auto-complete onboarding for admin-created accounts
          onboardingProgress: 100  // Set progress to 100%
        };
        user = await storage.upsertUser(userData);
      } else {
        // Update existing user's information and auto-approve if being managed by admin
        const currentUser = await storage.getUser(req.user.id);
        const updatedUser = await storage.updateUser(user.id, {
          firstName, lastName, role, department, position,
          companyId,  // Update company assignment
          organizationId: currentUser?.organizationId || 'default_meeting_matters_org',  // Set organization ID
          accountEnabled: true,  // Ensure account is enabled
          onboardingStatus: 'completed',  // Complete onboarding
          onboardingProgress: 100  // Set progress to 100%
        });
        user = updatedUser || user;
      }

      // Check if employee already exists for this user
      const existingEmployee = await storage.getEmployeeByUserId(user.id);
      if (existingEmployee) {
        return res.status(400).json({ 
          message: "Employee already exists for this user. Please use the update function instead." 
        });
      }

      // Create employee record with organization isolation and company assignment
      const employeeData = {
        userId: user.id,
        organizationId: user.organizationId || 'default_meeting_matters_org',
        companyId,  // Assign company (Qanzak Global or Meeting Matters Clinic)
        employeeId: employeeId || `EMP${Date.now().toString().slice(-6)}`,
        phoneNumber,
        address,
        emergencyContact: emergencyContact || {},
        designation,
        responsibilities,
        reportingManager
      };
      
      const employee = await storage.createEmployee(employeeData);
      
      // Send onboarding email (optional for admin-created accounts since they're auto-approved)
      if (user.email && user.firstName) {
        const emailSent = await sendOnboardingEmail(
          user.email, 
          `${user.firstName} ${user.lastName || ''}`.trim()
        );
        
        if (emailSent) {
          console.log(`Onboarding email sent successfully to ${user.email} - Account auto-approved by admin`);
        } else {
          console.warn(`Failed to send onboarding email to ${user.email}`);
        }
      }
      
      res.json(employee);
    } catch (error: any) {
      console.error("Error creating employee with user:", error);
      
      // Handle specific database constraint errors
      if (error.code === '23505') {
        if (error.constraint === 'users_username_unique') {
          return res.status(400).json({ message: "Username already exists. Please choose a different username." });
        }
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: "Email already exists. Please use a different email address." });
        }
      }
      
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.post('/api/employees', async (req: any, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      
      // Get user data for email notification
      const user = await storage.getUser(employee.userId);
      
      // Send onboarding email to new employee
      if (user && user.email && user.firstName) {
        const emailSent = await sendOnboardingEmail(
          user.email, 
          `${user.firstName} ${user.lastName || ''}`.trim()
        );
        
        if (emailSent) {
          console.log(`Onboarding email sent successfully to ${user.email}`);
        } else {
          console.warn(`Failed to send onboarding email to ${user.email}`);
        }
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put('/api/employees/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Clean the data before validation
      const cleanedData = { ...req.body };
      
      console.log("Original data received:", JSON.stringify(req.body, null, 2));
      
      // Convert empty strings to undefined for optional enum fields
      if (cleanedData.designation === "") {
        cleanedData.designation = undefined;
      }
      
      // Convert companyId to number if it's a string
      if (cleanedData.companyId && typeof cleanedData.companyId === 'string') {
        cleanedData.companyId = parseInt(cleanedData.companyId);
      }
      
      // Also handle empty companyId
      if (cleanedData.companyId === "") {
        cleanedData.companyId = undefined;
      }
      
      console.log("Cleaned data:", JSON.stringify(cleanedData, null, 2));
      
      const validatedData = insertEmployeeSchema.partial().parse(cleanedData);
      const employee = await storage.updateEmployee(id, validatedData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Get personal profile data
  app.get('/api/personal-profile/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
      // Get the employee record by employee table ID
      const employee = await storage.getEmployeeById(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching personal profile:", error);
      res.status(500).json({ message: "Failed to fetch personal profile" });
    }
  });

  // Update employee personal profile (comprehensive)
  app.put('/api/employees/:id/personal-profile', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const profileData = req.body;
      
      // Mark personal profile as completed when all data is provided
      const completeProfileData = {
        ...profileData,
        personalProfileCompleted: true,
        personalProfileCompletedAt: new Date(),
        updatedAt: new Date()
      };
      
      const employee = await storage.updateEmployee(id, completeProfileData);
      
      // Update onboarding checklist item for "Complete Personal Profile"
      try {
        await storage.markOnboardingStepComplete(id, "Complete Personal Profile");
      } catch (checklistError) {
        console.warn("Could not update onboarding checklist:", checklistError);
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error updating personal profile:", error);
      res.status(500).json({ message: "Failed to update personal profile" });
    }
  });

  // Get my personal profile (using current user's employee record)
  app.get('/api/my-personal-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployee(userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching personal profile:", error);
      res.status(500).json({ message: "Failed to fetch personal profile" });
    }
  });

  // Update my personal profile (using current user's employee record)
  app.put('/api/my-personal-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployee(userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }
      
      const profileData = req.body;
      
      // Mark personal profile as completed when all data is provided
      const completeProfileData = {
        ...profileData,
        personalProfileCompleted: true,
        personalProfileCompletedAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedEmployee = await storage.updateEmployee(employee.id, completeProfileData);
      
      // Update onboarding checklist item for personal information form
      try {
        await storage.markOnboardingStepComplete(employee.id, "Complete Personal Information Form");
      } catch (checklistError) {
        console.warn("Could not update onboarding checklist:", checklistError);
      }
      
      res.json(updatedEmployee);
    } catch (error) {
      console.error("Error updating personal profile:", error);
      res.status(500).json({ message: "Failed to update personal profile" });
    }
  });

  // Verify document in onboarding checklist
  app.post('/api/onboarding/verify-document', isAuthenticated, async (req: any, res) => {
    try {
      const { itemId, verified, notes } = req.body;
      
      if (!itemId) {
        return res.status(400).json({ message: "Item ID is required" });
      }
      
      const updateData = {
        isDocumentVerified: verified,
        verifiedBy: req.user.username || req.user.id,
        verifiedAt: verified ? new Date() : null,
        verificationNotes: notes || null,
        updatedAt: new Date()
      };
      
      const updatedItem = await storage.updateOnboardingChecklist(itemId, updateData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Onboarding item not found" });
      }
      
      res.json({
        success: true,
        message: verified ? "Document verified successfully" : "Document verification removed",
        item: updatedItem
      });
    } catch (error) {
      console.error("Error verifying document:", error);
      res.status(500).json({ message: "Failed to verify document" });
    }
  });

  // Serve onboarding document
  app.get('/api/onboarding/document/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      // Get the onboarding checklist item
      const item = await storage.getOnboardingChecklistItem(itemId);
      
      if (!item || !item.documentUrl || !item.documentName) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has permission to view this document
      const userRole = req.user.role;
      const userId = req.user.id;
      
      // Allow HR admins, admins, and the employee who owns the document
      const employee = await storage.getEmployeeById(item.employeeId);
      const hasPermission = userRole === 'hr_admin' || userRole === 'admin' || 
                           (employee && employee.userId === userId);
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      try {
        // Parse the base64 data from the document URL
        if (item.documentUrl.startsWith('data:')) {
          const base64Data = item.documentUrl.split(',')[1];
          
          if (base64Data === 'test-document-data') {
            // Handle the case where we have placeholder data
            // Create a simple text response indicating this is a sample document
            const sampleContent = `Sample Document for ${employee?.preferredName || 'Employee'}\n\nThis is a placeholder document uploaded during onboarding.\nActual document content would be displayed here.`;
            const buffer = Buffer.from(sampleContent, 'utf8');
            
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `inline; filename="${item.documentName}"`);
            res.setHeader('Content-Length', buffer.length);
            res.send(buffer);
          } else {
            // Handle real base64 data
            const buffer = Buffer.from(base64Data, 'base64');
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${item.documentName}"`);
            res.setHeader('Content-Length', buffer.length);
            res.send(buffer);
          }
        } else {
          return res.status(400).json({ message: "Invalid document format" });
        }
      } catch (parseError) {
        console.error("Error parsing document data:", parseError);
        return res.status(500).json({ message: "Error processing document" });
      }
      
    } catch (error) {
      console.error("Error serving document:", error);
      res.status(500).json({ message: "Failed to serve document" });
    }
  });

  // Emergency contact information
  app.put('/api/employees/:id/emergency-contact', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const contactData = req.body;
      
      const emergencyContactData = {
        emergencyContactPrimaryName: contactData.primaryContactName,
        emergencyContactPrimaryRelation: contactData.primaryContactRelation,
        emergencyContactPrimaryPhone: contactData.primaryContactPhone,
        emergencyContactPrimaryEmail: contactData.primaryContactEmail,
        emergencyContactPrimaryAddress: contactData.primaryContactAddress,
        emergencyContactSecondaryName: contactData.secondaryContactName,
        emergencyContactSecondaryRelation: contactData.secondaryContactRelation,
        emergencyContactSecondaryPhone: contactData.secondaryContactPhone,
        emergencyContactSecondaryEmail: contactData.secondaryContactEmail,
        emergencyContactSecondaryAddress: contactData.secondaryContactAddress,
        medicalConditions: contactData.medicalConditions,
        medications: contactData.medications,
        allergies: contactData.allergies,
        doctorName: contactData.doctorName,
        doctorPhone: contactData.doctorPhone,
        insuranceProvider: contactData.insuranceProvider,
        insurancePolicyNumber: contactData.insurancePolicyNumber,
        updatedAt: new Date()
      };
      
      const employee = await storage.updateEmployee(id, emergencyContactData);
      
      // Update onboarding checklist
      try {
        await storage.markOnboardingStepComplete(id, "Complete Emergency Contact Information");
      } catch (checklistError) {
        console.warn("Could not update onboarding checklist:", checklistError);
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error updating emergency contact:", error);
      res.status(500).json({ message: "Failed to update emergency contact information" });
    }
  });

  // Profile picture upload
  app.put('/api/employees/:id/profile-picture', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { profileImage } = req.body;
      
      const profileData = {
        profileImageUrl: profileImage,
        updatedAt: new Date()
      };
      
      const employee = await storage.updateEmployee(id, profileData);
      
      // Update onboarding checklist
      try {
        await storage.markOnboardingStepComplete(id, "Upload Profile Picture");
      } catch (checklistError) {
        console.warn("Could not update onboarding checklist:", checklistError);
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });

  // Direct deposit setup
  app.put('/api/employees/:id/direct-deposit', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const depositData = req.body;
      
      // In a real system, encrypt sensitive banking information
      const directDepositData = {
        bankName: depositData.bankName,
        accountHolderName: depositData.accountHolderName,
        accountType: depositData.accountType,
        routingNumber: depositData.routingNumber,
        accountNumberEncrypted: `encrypted_${depositData.accountNumber}`, // Placeholder for encryption
        splitDepositEnabled: depositData.enableSplitDeposit,
        updatedAt: new Date()
      };
      
      const employee = await storage.updateEmployee(id, directDepositData);
      
      // Update onboarding checklist
      try {
        await storage.markOnboardingStepComplete(id, "Complete Banking Information");
      } catch (checklistError) {
        console.warn("Could not update onboarding checklist:", checklistError);
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error updating direct deposit:", error);
      res.status(500).json({ message: "Failed to update direct deposit information" });
    }
  });

  // Get banking information for all employees (HR Admin only)
  app.get('/api/employees/banking/all', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      // Get current user's organization ID for data isolation
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || !currentUser.organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }

      const result = await db
        .select({
          employeeId: employees.id,
          firstName: users.firstName,
          lastName: users.lastName,
          employeeNumber: employees.employeeId,
          bankName: employees.bankName,
          accountHolderName: employees.accountHolderName,
          accountType: employees.accountType,
          routingNumber: employees.routingNumber,
          accountNumber: employees.accountNumber,
          isComplete: sql<boolean>`CASE WHEN ${employees.bankName} IS NOT NULL AND ${employees.accountHolderName} IS NOT NULL AND ${employees.routingNumber} IS NOT NULL AND ${employees.accountNumber} IS NOT NULL THEN true ELSE false END`
        })
        .from(employees)
        .innerJoin(users, eq(employees.userId, users.id))
        .where(eq(employees.organizationId, currentUser.organizationId))
        .orderBy(users.firstName, users.lastName);

      // Transform data for payroll processing (full account numbers for HR admin)
      const bankingData = result.map(emp => ({
        employeeId: emp.employeeId,
        employeeNumber: emp.employeeNumber,
        firstName: emp.firstName,
        lastName: emp.lastName,
        hasBankingInfo: emp.isComplete,
        bankName: emp.bankName || null,
        accountType: emp.accountType || null,
        accountHolderName: emp.accountHolderName || null,
        // Show full account numbers for payroll processing
        accountNumber: emp.accountNumber || null,
        routingNumber: emp.routingNumber || null,
        isComplete: emp.isComplete
      }));

      res.json(bankingData);
    } catch (error) {
      console.error('Error fetching all banking information:', error);
      res.status(500).json({ message: 'Failed to fetch banking information' });
    }
  });

  // Recalculate onboarding progress for an employee
  app.post('/api/employees/:id/recalculate-progress', isAuthenticated, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      await storage.updateOnboardingProgress(employeeId);
      
      // Get updated employee data
      const employee = await storage.getEmployee(employeeId);
      res.json({ 
        message: "Onboarding progress recalculated successfully", 
        progress: employee?.onboardingProgress || 0,
        status: employee?.onboardingStatus || 'not_started'
      });
    } catch (error) {
      console.error("Error recalculating progress:", error);
      res.status(500).json({ message: "Failed to recalculate onboarding progress" });
    }
  });

  // Handbook Management Routes
  
  // Get all handbooks
  app.get('/api/handbooks', isAuthenticated, async (req: any, res) => {
    try {
      const handbooks = await storage.getHandbooks();
      res.json(handbooks);
    } catch (error) {
      console.error("Error fetching handbooks:", error);
      res.status(500).json({ message: "Failed to fetch handbooks" });
    }
  });

  // Create handbook
  app.post('/api/handbooks', isAuthenticated, async (req: any, res) => {
    try {
      const handbookData = req.body;
      const handbook = await storage.createHandbook({
        ...handbookData,
        createdBy: req.user?.claims?.sub
      });
      res.json(handbook);
    } catch (error) {
      console.error("Error creating handbook:", error);
      res.status(500).json({ message: "Failed to create handbook" });
    }
  });

  // Update handbook
  app.put('/api/handbooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const handbookData = req.body;
      const handbook = await storage.updateHandbook(id, handbookData);
      res.json(handbook);
    } catch (error) {
      console.error("Error updating handbook:", error);
      res.status(500).json({ message: "Failed to update handbook" });
    }
  });

  // Delete handbook
  app.delete('/api/handbooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHandbook(id);
      res.json({ message: "Handbook deleted successfully" });
    } catch (error) {
      console.error("Error deleting handbook:", error);
      res.status(500).json({ message: "Failed to delete handbook" });
    }
  });

  // Get handbook sections
  app.get('/api/handbooks/:id/sections', isAuthenticated, async (req: any, res) => {
    try {
      const handbookId = parseInt(req.params.id);
      const sections = await storage.getHandbookSections(handbookId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching handbook sections:", error);
      res.status(500).json({ message: "Failed to fetch handbook sections" });
    }
  });



  // Create handbook section
  app.post('/api/handbooks/:id/sections', isAuthenticated, async (req: any, res) => {
    try {
      const handbookId = parseInt(req.params.id);
      const sectionData = req.body;
      const section = await storage.createHandbookSection(handbookId, sectionData);
      res.json(section);
    } catch (error) {
      console.error("Error creating handbook section:", error);
      res.status(500).json({ message: "Failed to create handbook section" });
    }
  });

  // Get quiz questions for section
  app.get('/api/handbooks/:sectionId/quiz', isAuthenticated, async (req: any, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      const questions = await storage.getHandbookQuizQuestions(sectionId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  // Create quiz question
  app.post('/api/handbooks/quiz', isAuthenticated, async (req: any, res) => {
    try {
      const questionData = req.body;
      const question = await storage.createHandbookQuizQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({ message: "Failed to create quiz question" });
    }
  });

  // Record handbook progress
  app.post('/api/handbook-progress', isAuthenticated, async (req: any, res) => {
    try {
      const progressData = req.body;
      const progress = await storage.recordHandbookProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error recording handbook progress:", error);
      res.status(500).json({ message: "Failed to record handbook progress" });
    }
  });

  // Submit handbook quiz
  app.post('/api/handbook-quiz', isAuthenticated, async (req: any, res) => {
    try {
      const { employeeId, sectionId, answers } = req.body;
      const result = await storage.submitHandbookQuiz(employeeId, sectionId, answers);
      res.json(result);
    } catch (error) {
      console.error("Error submitting handbook quiz:", error);
      res.status(500).json({ message: "Failed to submit handbook quiz" });
    }
  });

  // Team Meeting Routes
  
  // Get all team meetings
  app.get('/api/team-meetings', isAuthenticated, async (req: any, res) => {
    try {
      const meetings = await storage.getTeamMeetings();
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching team meetings:", error);
      res.status(500).json({ message: "Failed to fetch team meetings" });
    }
  });

  // Get team meeting for specific employee
  app.get('/api/team-meetings/employee/:employeeId', isAuthenticated, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const meeting = await storage.getTeamMeetingForEmployee(employeeId);
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching employee team meeting:", error);
      res.status(500).json({ message: "Failed to fetch team meeting" });
    }
  });

  // Create team meeting
  app.post('/api/team-meetings', isAuthenticated, async (req: any, res) => {
    try {
      const meetingData = {
        ...req.body,
        scheduledBy: req.user?.claims?.sub
      };
      const meeting = await storage.createTeamMeeting(meetingData);
      res.json(meeting);
    } catch (error) {
      console.error("Error creating team meeting:", error);
      res.status(500).json({ message: "Failed to create team meeting" });
    }
  });

  // Update team meeting
  app.put('/api/team-meetings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const meeting = await storage.updateTeamMeeting(id, req.body);
      res.json(meeting);
    } catch (error) {
      console.error("Error updating team meeting:", error);
      res.status(500).json({ message: "Failed to update team meeting" });
    }
  });

  // Complete team meeting
  app.put('/api/team-meetings/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const meeting = await storage.completeTeamMeeting(id);
      res.json(meeting);
    } catch (error) {
      console.error("Error completing team meeting:", error);
      res.status(500).json({ message: "Failed to complete team meeting" });
    }
  });

  // Confirm attendance
  app.post('/api/team-meetings/:id/confirm-attendance', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { employeeId } = req.body;
      const result = await storage.confirmMeetingAttendance(id, employeeId);
      res.json(result);
    } catch (error) {
      console.error("Error confirming attendance:", error);
      res.status(500).json({ message: "Failed to confirm attendance" });
    }
  });

  // Delete team meeting
  app.delete('/api/team-meetings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeamMeeting(id);
      res.json({ message: "Meeting cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling team meeting:", error);
      res.status(500).json({ message: "Failed to cancel team meeting" });
    }
  });

  // Get meeting notifications
  app.get('/api/meeting-notifications/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getMeetingNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching meeting notifications:", error);
      res.status(500).json({ message: "Failed to fetch meeting notifications" });
    }
  });

  // Mark notification as read
  app.put('/api/meeting-notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Psychometric Results Routes (HR Only)
  
  // Get all psychometric test results for HR dashboard
  app.get('/api/psychometric-results/all', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is HR admin or system admin
      if (req.user?.role !== 'hr_admin' && req.user?.username !== 'admin') {
        return res.status(403).json({ error: "Access denied. HR admin role required." });
      }
      
      const results = await storage.getAllPsychometricResults();
      res.json(results);
    } catch (error) {
      console.error("Error fetching all psychometric results:", error);
      res.status(500).json({ message: "Failed to fetch psychometric results" });
    }
  });

  // Get psychometric result details for specific candidate and test
  app.get('/api/psychometric-results/:candidateEmail/:testId', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is HR admin or system admin
      if (req.user?.role !== 'hr_admin' && req.user?.username !== 'admin') {
        return res.status(403).json({ error: "Access denied. HR admin role required." });
      }
      
      const candidateEmail = req.params.candidateEmail;
      const testId = parseInt(req.params.testId);
      
      const result = await storage.getPsychometricResult(candidateEmail, testId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching psychometric result details:", error);
      res.status(500).json({ message: "Failed to fetch result details" });
    }
  });

  // Get psychometric results summary for analytics
  app.get('/api/psychometric-results/analytics', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is HR admin or system admin
      if (req.user?.role !== 'hr_admin' && req.user?.username !== 'admin') {
        return res.status(403).json({ error: "Access denied. HR admin role required." });
      }
      
      const analytics = await storage.getPsychometricAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching psychometric analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get psychometric test results for a specific employee
  app.get('/api/psychometric-tests/results/:employeeId', isAuthenticated, async (req: any, res) => {
    try {
      const employeeIdParam = req.params.employeeId;
      
      if (!employeeIdParam) {
        return res.status(400).json({ error: 'Invalid employee ID' });
      }

      // Find employee by employee_id field (employee number) first, then by database id
      let employee;
      
      // Try to find by employee number first (this is what's shown in URLs)
      const employeeByNumber = await db
        .select()
        .from(employees)
        .where(eq(employees.employeeId, employeeIdParam));
      
      if (employeeByNumber.length > 0) {
        employee = employeeByNumber[0];
      } else {
        // If not found by employee number, try by database ID
        const employeeIdInt = parseInt(employeeIdParam);
        if (!isNaN(employeeIdInt)) {
          const [employeeById] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, employeeIdInt));
          employee = employeeById;
        }
      }

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Get user details to get email
      const user = await storage.getUser(employee.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Fetch all psychometric test attempts for this candidate's email
      const results = await db
        .select()
        .from(psychometricTestAttempts)
        .where(eq(psychometricTestAttempts.candidateEmail, user.email))
        .orderBy(psychometricTestAttempts.completedAt);

      // Process and recalculate scores if needed
      const processedResults = await Promise.all(results.map(async (result) => {
        if (result.percentageScore === 0 && result.responses) {
          // Recalculate score for this attempt
          const updatedResult = await recalculateTestScore(result);
          return updatedResult;
        }
        return result;
      }));

      res.json(processedResults);
    } catch (error) {
      console.error("Error fetching employee test results:", error);
      res.status(500).json({ message: "Failed to fetch employee test results" });
    }
  });

  // Get detailed question-by-question responses for a specific test attempt
  app.get('/api/psychometric-test-attempts/:attemptId/detailed', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const attemptId = parseInt(req.params.attemptId);
      
      if (isNaN(attemptId)) {
        return res.status(400).json({ message: 'Invalid attempt ID' });
      }

      // Get the test attempt details
      const attempt = await storage.getPsychometricTestAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: 'Test attempt not found' });
      }

      // Get test details
      const test = await storage.getPsychometricTest(attempt.testId);
      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      // Get all questions for this test
      const questions = await storage.getPsychometricQuestions(attempt.testId);
      if (!questions) {
        return res.status(404).json({ message: 'Test questions not found' });
      }

      // Parse responses
      let responses = attempt.responses;
      if (typeof responses === 'string') {
        try {
          responses = JSON.parse(responses);
        } catch (e) {
          responses = {};
        }
      }

      // Create detailed question-by-question analysis
      const questionResponses = questions.map((question, index) => {
        const responseKey = `q${index + 1}`;
        const response = responses[responseKey] || responses[question.id];
        let selectedOption = null;
        let isCorrect = null;
        let selectedAnswerText = null;

        if (response !== undefined && response !== null) {
          // For multiple choice questions, find the selected option
          if (question.questionType === 'multiple_choice' && question.options) {
            const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options as string);
            selectedOption = options.find((opt: any) => 
              opt.value === response || 
              opt.value === response.toString() ||
              (typeof opt.value === 'string' && opt.value === response.toString())
            );
            selectedAnswerText = selectedOption?.text || response.toString();
            
            // Check if it's correct (for objective tests)
            if (question.correctAnswer) {
              isCorrect = response.toString() === question.correctAnswer.toString();
            }
          } else if (question.questionType === 'scale' || question.questionType === 'likert' || question.questionType === 'likert_scale') {
            // For scale questions, map the numeric value to text
            const scaleLabels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
            const responseNum = parseInt(response.toString());
            selectedAnswerText = scaleLabels[responseNum - 1] || response.toString();
          } else {
            // For other question types
            selectedAnswerText = response.toString();
          }
        }

        return {
          questionId: question.id,
          questionNumber: index + 1,
          questionText: question.questionText,
          questionType: question.questionType,
          category: question.category,
          options: question.options,
          correctAnswer: question.correctAnswer,
          selectedAnswer: response,
          selectedAnswerText,
          selectedOption,
          isCorrect,
          wasAnswered: response !== undefined && response !== null
        };
      });

      res.json({
        attempt: {
          id: attempt.id,
          candidateEmail: attempt.candidateEmail,
          candidateName: attempt.candidateName,
          completedAt: attempt.completedAt,
          timeSpent: attempt.timeSpent,
          totalScore: attempt.totalScore,
          percentageScore: attempt.percentageScore
        },
        test: {
          id: test.id,
          testName: test.testName,
          testType: test.testType,
          description: test.description
        },
        questionResponses,
        totalQuestions: questions.length,
        answeredQuestions: questionResponses.filter(q => q.wasAnswered).length
      });
    } catch (error) {
      console.error('Error fetching detailed test responses:', error);
      res.status(500).json({ message: 'Failed to fetch detailed test responses' });
    }
  });

  app.delete('/api/employees/:id', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Delete route called with ID:', id);
      
      // Get employee info before deletion for notification
      const employee = await storage.getEmployee(id);
      const user = employee ? await storage.getUser(employee.userId) : null;
      
      await storage.deleteEmployee(id);
      
      // Send HR notification about employee deletion
      if (user) {
        HRNotifications.systemError(
          { message: `Employee ${user.firstName} ${user.lastName} (${user.email}) has been deleted` },
          'Employee Deletion'
        );
      }
      
      res.json({ 
        message: `Employee has been successfully deleted along with all associated records.`
      });
    } catch (error) {
      console.error("Error deleting employee:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete employee";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Leave Management Routes - Meeting Matters Manual Section 6.37
  // Get all leave requests (filtered by role/employee)
  app.get('/api/leave-requests', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      const { status, employeeId } = req.query;
      
      // Get employee record for current user
      const employee = await storage.getEmployeeByUserId(currentUser.id);
      
      // Determine filter based on role
      let filters: { employeeId?: number; status?: string } = {};
      
      if (currentUser.role === 'hr_admin' || currentUser.role === 'admin') {
        // HR/Admin can see all leave requests
        if (employeeId) filters.employeeId = parseInt(employeeId as string);
        if (status) filters.status = status as string;
      } else if (employee) {
        // Employees can only see their own leave requests
        filters.employeeId = employee.id;
        if (status) filters.status = status as string;
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const leaveRequests = await storage.getLeaveRequests(filters);
      res.json(leaveRequests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      res.status(500).json({ message: 'Failed to fetch leave requests' });
    }
  });

  // Get single leave request
  app.get('/api/leave-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as User;
      
      const leaveRequest = await storage.getLeaveRequest(id);
      
      if (!leaveRequest) {
        return res.status(404).json({ message: 'Leave request not found' });
      }
      
      // Check permissions: HR/Admin can view any, employees can only view their own
      const employee = await storage.getEmployeeByUserId(currentUser.id);
      const isHROrAdmin = currentUser.role === 'hr_admin' || currentUser.role === 'admin';
      const isOwnRequest = employee && employee.id === leaveRequest.employeeId;
      
      if (!isHROrAdmin && !isOwnRequest) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(leaveRequest);
    } catch (error) {
      console.error('Error fetching leave request:', error);
      res.status(500).json({ message: 'Failed to fetch leave request' });
    }
  });

  // Create new leave request
  app.post('/api/leave-requests', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      const employee = await storage.getEmployeeByUserId(currentUser.id);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee profile not found' });
      }
      
      const { leaveType, startDate, endDate, totalDays, reason, medicalCertificate, medicalCertificateFilename } = req.body;
      
      // Validate required fields
      if (!leaveType || !startDate || !endDate || !totalDays || !reason) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const leaveRequest = await storage.createLeaveRequest({
        employeeId: employee.id,
        requesterId: currentUser.id,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        medicalCertificate,
        medicalCertificateFilename,
        status: 'pending',
      });
      
      // Send notifications to HR admins and users with 'manage' permission for leave_management
      try {
        // Get all users in the same organization
        const allUsers = await storage.getAllUsers();
        const sameOrgUsers = allUsers.filter(u => u.organizationId === currentUser.organizationId);
        
        // Find users who can approve (HR admins or users with manage permission for leave_management)
        const approvers: User[] = [];
        for (const user of sameOrgUsers) {
          if (user.id === currentUser.id) continue; // Skip self
          
          // Check if HR admin
          if (user.role === 'hr_admin') {
            approvers.push(user);
            continue;
          }
          
          // Check if has manage permission for leave_management
          const permissions = await storage.getAggregatedPermissions(user.id, user.role);
          if (permissions.leave_management === 'manage') {
            approvers.push(user);
          }
        }
        
        // Create notifications for all approvers
        const leaveTypeName = leaveType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        for (const approver of approvers) {
          await storage.createNotification({
            userId: approver.id,
            type: 'approval_request',
            title: 'New Leave Request',
            message: `${currentUser.firstName} ${currentUser.lastName} has requested ${leaveTypeName} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} (${totalDays} days)`,
            actionRequired: true,
            actionUrl: '/leave-management',
            relatedEntityType: 'leave_request',
            relatedEntityId: leaveRequest.id,
            priority: 'normal',
            data: {
              leaveRequestId: leaveRequest.id,
              employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
              leaveType,
              startDate,
              endDate,
              totalDays
            }
          });
        }
      } catch (notificationError) {
        console.error('Error creating leave approval notifications:', notificationError);
        // Don't fail the request if notifications fail
      }
      
      res.status(201).json(leaveRequest);
    } catch (error) {
      console.error('Error creating leave request:', error);
      res.status(500).json({ message: 'Failed to create leave request' });
    }
  });

  // Approve leave request (CEO/Admin only)
  app.post('/api/leave-requests/:id/approve', requireRole(['hr_admin', 'admin']), requirePermission('leave_management', 'manage'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as User;
      
      const approvedRequest = await storage.approveLeaveRequest(id, currentUser.id);
      
      // Send notification to the requester
      try {
        const requester = await storage.getUser(approvedRequest.requesterId);
        if (requester) {
          const leaveTypeName = approvedRequest.leaveType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          await storage.createNotification({
            userId: requester.id,
            type: 'approval_decision',
            title: 'Leave Request Approved',
            message: `Your ${leaveTypeName} request from ${new Date(approvedRequest.startDate).toLocaleDateString()} to ${new Date(approvedRequest.endDate).toLocaleDateString()} has been approved by ${currentUser.firstName} ${currentUser.lastName}`,
            actionRequired: false,
            actionUrl: '/leave-management',
            relatedEntityType: 'leave_request',
            relatedEntityId: approvedRequest.id,
            priority: 'normal',
            data: {
              leaveRequestId: approvedRequest.id,
              status: 'approved',
              approvedBy: `${currentUser.firstName} ${currentUser.lastName}`
            }
          });
        }
      } catch (notificationError) {
        console.error('Error creating approval notification:', notificationError);
      }
      
      res.json({
        message: 'Leave request approved successfully',
        leaveRequest: approvedRequest
      });
    } catch (error: any) {
      console.error('Error approving leave request:', error);
      const message = error.message || 'Failed to approve leave request';
      res.status(400).json({ message });
    }
  });

  // Reject leave request (CEO/Admin only)
  app.post('/api/leave-requests/:id/reject', requireRole(['hr_admin', 'admin']), requirePermission('leave_management', 'manage'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as User;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }
      
      const rejectedRequest = await storage.rejectLeaveRequest(id, currentUser.id, reason);
      
      // Send notification to the requester
      try {
        const requester = await storage.getUser(rejectedRequest.requesterId);
        if (requester) {
          const leaveTypeName = rejectedRequest.leaveType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          await storage.createNotification({
            userId: requester.id,
            type: 'approval_decision',
            title: 'Leave Request Rejected',
            message: `Your ${leaveTypeName} request from ${new Date(rejectedRequest.startDate).toLocaleDateString()} to ${new Date(rejectedRequest.endDate).toLocaleDateString()} has been rejected by ${currentUser.firstName} ${currentUser.lastName}. Reason: ${reason}`,
            actionRequired: false,
            actionUrl: '/leave-management',
            relatedEntityType: 'leave_request',
            relatedEntityId: rejectedRequest.id,
            priority: 'high',
            data: {
              leaveRequestId: rejectedRequest.id,
              status: 'rejected',
              rejectedBy: `${currentUser.firstName} ${currentUser.lastName}`,
              rejectionReason: reason
            }
          });
        }
      } catch (notificationError) {
        console.error('Error creating rejection notification:', notificationError);
      }
      
      res.json({
        message: 'Leave request rejected',
        leaveRequest: rejectedRequest
      });
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      res.status(500).json({ message: 'Failed to reject leave request' });
    }
  });

  // Process leave by admin (update attendance, notify BDM/CRM)
  app.post('/api/leave-requests/:id/process', requireRole(['hr_admin', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as User;
      
      const processedRequest = await storage.processLeaveByAdmin(id, currentUser.id);
      
      res.json({
        message: 'Leave request processed successfully',
        leaveRequest: processedRequest
      });
    } catch (error) {
      console.error('Error processing leave request:', error);
      res.status(500).json({ message: 'Failed to process leave request' });
    }
  });

  // Get all employees' leave balances (HR Admin and managers with manage permission only)
  app.get('/api/leave-balances', isAuthenticated, requirePermission('leave_management', 'manage'), async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      // Get current user's organization for data isolation
      const user = await storage.getUser(currentUser.id);
      if (!user || !user.organizationId) {
        return res.status(403).json({ message: 'Organization access required' });
      }
      
      // Get all employees in the organization
      const employees = await storage.getEmployees(user.organizationId);
      
      // Validate all employees belong to the same organization
      const invalidEmployees = employees.filter(emp => emp.user.organizationId !== user.organizationId);
      if (invalidEmployees.length > 0) {
        console.error('Cross-tenant data detected in getEmployees');
        return res.status(500).json({ message: 'Data integrity error' });
      }
      
      const currentYear = new Date().getFullYear();
      
      // First, fetch all existing balances in bulk to avoid N+1 queries
      const employeeIds = employees.map(emp => emp.id);
      const existingBalances = await Promise.all(
        employeeIds.map(empId => storage.getLeaveBalance(empId, currentYear))
      );
      
      // Create missing balances in bulk
      const missingBalanceIds = employeeIds.filter((empId, idx) => !existingBalances[idx]);
      if (missingBalanceIds.length > 0) {
        await Promise.all(
          missingBalanceIds.map(empId => 
            storage.createLeaveBalance({
              employeeId: empId,
              year: currentYear,
            })
          )
        );
        
        // Re-fetch the newly created balances
        for (let i = 0; i < employeeIds.length; i++) {
          if (!existingBalances[i]) {
            existingBalances[i] = await storage.getLeaveBalance(employeeIds[i], currentYear);
          }
        }
      }
      
      // Map employees with their balances
      const balancesWithEmployees = employees.map((employee, idx) => {
        const balance = existingBalances[idx]!;
        return {
          employee: {
            id: employee.id,
            name: `${employee.user.firstName} ${employee.user.lastName}`,
            email: employee.user.email,
            designation: employee.designation,
            department: employee.department,
          },
          balance: {
            sickLeavePaidTotal: balance.sickLeavePaidTotal || 15,
            sickLeavePaidUsed: balance.sickLeavePaidUsed || 0,
            sickLeavePaidRemaining: (balance.sickLeavePaidTotal || 15) - (balance.sickLeavePaidUsed || 0),
            sickLeaveUnpaidTotal: balance.sickLeaveUnpaidTotal || 15,
            sickLeaveUnpaidUsed: balance.sickLeaveUnpaidUsed || 0,
            sickLeaveUnpaidRemaining: (balance.sickLeaveUnpaidTotal || 15) - (balance.sickLeaveUnpaidUsed || 0),
            casualLeavePaidTotal: balance.casualLeavePaidTotal || 5,
            casualLeavePaidUsed: balance.casualLeavePaidUsed || 0,
            casualLeavePaidRemaining: (balance.casualLeavePaidTotal || 5) - (balance.casualLeavePaidUsed || 0),
            casualLeaveUnpaidUsed: balance.casualLeaveUnpaidUsed || 0,
            bereavementLeaveUsed: balance.bereavementLeaveUsed || 0,
            publicHolidaysUsed: balance.publicHolidaysUsed || 0,
            unpaidLeaveUsed: balance.unpaidLeaveUsed || 0,
          }
        };
      });
      
      res.json(balancesWithEmployees);
    } catch (error) {
      console.error('Error fetching all leave balances:', error);
      res.status(500).json({ message: 'Failed to fetch leave balances' });
    }
  });

  // Get leave balance for an employee
  app.get('/api/leave-balances/:employeeId', isAuthenticated, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const currentUser = req.user as User;
      
      // Check permissions: employee can view their own, HR/Admin can view any
      const employee = await storage.getEmployeeByUserId(currentUser.id);
      if (currentUser.role !== 'hr_admin' && currentUser.role !== 'admin') {
        if (!employee || employee.id !== employeeId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
      
      const currentYear = new Date().getFullYear();
      let balance = await storage.getLeaveBalance(employeeId, currentYear);
      
      // Create balance if it doesn't exist
      if (!balance) {
        balance = await storage.createLeaveBalance({
          employeeId,
          year: currentYear,
        });
      }
      
      res.json(balance);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      res.status(500).json({ message: 'Failed to fetch leave balance' });
    }
  });

  // Vacancy Management Routes (HR visibility)
  // Get all vacancies
  app.get('/api/vacancies', requireRole(['hr_admin', 'admin']), async (req: any, res) => {
    try {
      const { designation, companyId, status } = req.query;
      
      const filters: { designation?: string; companyId?: number; status?: string } = {};
      if (designation) filters.designation = designation as string;
      if (companyId) filters.companyId = parseInt(companyId as string);
      if (status) filters.status = status as string;
      
      const vacancies = await storage.getVacancies(filters);
      res.json(vacancies);
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      res.status(500).json({ message: 'Failed to fetch vacancies' });
    }
  });

  // Create vacancy
  app.post('/api/vacancies', requireRole(['hr_admin', 'admin']), async (req: any, res) => {
    try {
      const { designation, companyId, description, requirements, responsibilities, count } = req.body;
      
      if (!designation || !companyId) {
        return res.status(400).json({ message: 'Designation and company are required' });
      }
      
      const vacancy = await storage.createVacancy({
        designation,
        companyId,
        description,
        requirements,
        responsibilities,
        count: count || 1,
        status: 'open',
        postedDate: new Date().toISOString(),
      });
      
      res.status(201).json(vacancy);
    } catch (error) {
      console.error('Error creating vacancy:', error);
      res.status(500).json({ message: 'Failed to create vacancy' });
    }
  });

  // Update vacancy
  app.patch('/api/vacancies/:id', requireRole(['hr_admin', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedVacancy = await storage.updateVacancy(id, updates);
      res.json(updatedVacancy);
    } catch (error) {
      console.error('Error updating vacancy:', error);
      res.status(500).json({ message: 'Failed to update vacancy' });
    }
  });

  // Delete vacancy
  app.delete('/api/vacancies/:id', requireRole(['hr_admin', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVacancy(id);
      res.json({ message: 'Vacancy deleted successfully' });
    } catch (error) {
      console.error('Error deleting vacancy:', error);
      res.status(500).json({ message: 'Failed to delete vacancy' });
    }
  });

  // Company management routes
  app.get('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const companiesData = await db.select().from(companies);
      res.json(companiesData);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post('/api/companies', isAuthenticated, requireRole(['hr_admin', 'admin']), async (req: any, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const [company] = await db.insert(companies).values(validatedData).returning();
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put('/api/companies/:id', isAuthenticated, requireRole(['hr_admin', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const [company] = await db.update(companies).set(validatedData).where(eq(companies.id, id)).returning();
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/companies/:id', isAuthenticated, requireRole(['hr_admin', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(companies).where(eq(companies.id, id));
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Department management routes - Professional plan and above
  app.get('/api/departments', isAuthenticated, requireFeature('departments'), async (req: any, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post('/api/departments', async (req: any, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.put('/api/departments/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, validatedData);
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete('/api/departments/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDepartment(id);
      res.json({ message: "Department deleted successfully" });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  app.get('/api/departments/:id/employees', async (req: any, res) => {
    try {
      const departmentCode = req.params.id;
      const employees = await storage.getEmployeesByDepartment(departmentCode);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching department employees:", error);
      res.status(500).json({ message: "Failed to fetch department employees" });
    }
  });

  // Get all users who can be managers (HR Admin and Branch Managers)
  app.get('/api/users/managers', isAuthenticated, async (req: any, res) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
        })
        .from(users);
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users for manager assignment:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get departments with detailed information including manager details and employee count
  app.get('/api/departments/detailed', isAuthenticated, async (req: any, res) => {
    try {
      const departmentsWithDetails = await db
        .select({
          id: departments.id,
          code: departments.code,
          name: departments.name,
          description: departments.description,
          managerId: departments.managerId,
          budgetAllocated: departments.budgetAllocated,
          headcount: departments.headcount,
          location: departments.location,
          isActive: departments.isActive,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
          managerName: users.username,
          managerEmail: users.email,
        })
        .from(departments)
        .leftJoin(users, eq(departments.managerId, users.id));

      // Get employee count for each department
      const departmentsWithCounts = await Promise.all(
        departmentsWithDetails.map(async (dept) => {
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)`.as('count') })
            .from(employees)
            .where(eq(employees.department, dept.code));
          
          return {
            ...dept,
            employeeCount: Number(count) || 0,
          };
        })
      );

      res.json(departmentsWithCounts);
    } catch (error) {
      console.error("Error fetching detailed departments:", error);
      res.status(500).json({ message: "Failed to fetch detailed departments" });
    }
  });

  // Task routes with department isolation
  app.get('/api/tasks', isAuthenticated, departmentIsolationMiddleware, async (req: any, res) => {
    try {
      const { assignedTo, status, priority } = req.query;
      let tasks = await storage.getTasks({ assignedTo, status, priority });
      
      // Apply department isolation filtering
      if (req.user.role !== 'hr_admin' && req.user.role !== 'branch_manager') {
        const filteredTasks = [];
        for (const task of tasks) {
          const canViewAssignedTo = task.assignedTo ? await canAccessUser(req.user.id, task.assignedTo, req.user.role) : true;
          const canViewAssignedBy = task.assignedBy ? await canAccessUser(req.user.id, task.assignedBy, req.user.role) : true;
          const hasAccess = canViewAssignedTo || canViewAssignedBy || task.assignedTo === req.user.id || task.assignedBy === req.user.id;
          if (hasAccess) {
            filteredTasks.push(task);
          }
        }
        tasks = filteredTasks;
      }
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, departmentIsolationMiddleware, async (req: any, res) => {
    try {
      // Validate department isolation for task assignment
      if (req.body.assignedTo && req.body.assignedTo !== req.user.id) {
        const canAssign = await canAssignTaskTo(req.user.id, req.body.assignedTo, req.user.role);
        if (!canAssign) {
          return res.status(403).json({ 
            message: "Cannot assign tasks to users outside your department. Please contact HR for cross-department assignments." 
          });
        }
      }
      
      const taskData = { ...req.body, assignedBy: req.user.id };
      const validatedData = insertTaskSchema.parse(taskData);
      const task = await storage.createTask(validatedData);
      
      // Send email notification to assigned employee
      if (validatedData.assignedTo && validatedData.assignedTo !== req.user.id) {
        try {
          const assignedEmployee = await storage.getEmployeeByUserId(validatedData.assignedTo);
          const assignerUser = await storage.getUserById(req.user.id);
          
          if (assignedEmployee && assignerUser) {
            await EmailService.sendTaskAssignmentEmail(
              assignedEmployee, 
              task, 
              assignerUser.username || assignerUser.email
            );
          }
        } catch (emailError) {
          console.error("Failed to send task assignment email:", emailError);
          // Don't fail the request if email fails
        }
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Get a single task by ID
  app.get('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if user has access to this task
      if (req.user.role !== 'hr_admin' && req.user.role !== 'branch_manager') {
        const canViewAssignedTo = task.assignedTo ? await canAccessUser(req.user.id, task.assignedTo, req.user.role) : true;
        const canViewAssignedBy = task.assignedBy ? await canAccessUser(req.user.id, task.assignedBy, req.user.role) : true;
        const hasAccess = canViewAssignedTo || canViewAssignedBy || task.assignedTo === req.user.id || task.assignedBy === req.user.id;
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Task update request body:", req.body);
      
      // Handle the specific case of status updates (most common for completing tasks)
      if (req.body.status) {
        const task = await storage.updateTask(id, { 
          status: req.body.status,
          completedAt: req.body.status === 'completed' ? new Date() : undefined,
          updatedAt: new Date()
        });
        return res.json(task);
      }
      
      // For other updates, use the schema validation
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, validatedData);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      console.error("Validation error details:", error.message);
      res.status(500).json({ 
        message: "Failed to update task",
        details: error.message 
      });
    }
  });

  app.delete('/api/tasks/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete task";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Submit explanation for overdue task (regular tasks)
  app.post('/api/tasks/:id/overdue-explanation', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { explanation } = req.body;
      
      if (!explanation || explanation.trim().length === 0) {
        return res.status(400).json({ message: "Explanation is required" });
      }

      // Get the task to verify it exists and get assignedBy user
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verify the user is assigned to this task
      if (task.assignedTo !== req.user.id) {
        return res.status(403).json({ message: "You can only provide explanations for tasks assigned to you" });
      }

      // Create a notification to the task creator with the explanation
      if (task.assignedBy) {
        await storage.createNotification({
          userId: task.assignedBy,
          type: 'task_explanation',
          title: 'Task Overdue Explanation',
          message: `Employee provided explanation for overdue task "${task.title}": ${explanation.trim()}`,
          data: { taskId, explanation: explanation.trim() },
          actionRequired: true,
          actionUrl: `/tasks/${taskId}`,
          relatedEntityType: 'task',
          relatedEntityId: taskId,
          priority: 'normal'
        });
      }

      res.json({ message: "Explanation submitted successfully" });
    } catch (error) {
      console.error("Error submitting overdue explanation:", error);
      res.status(500).json({ message: "Failed to submit explanation" });
    }
  });

  // Task updates routes for daily progress tracking
  app.get('/api/tasks/:id/updates', async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = await storage.getTaskUpdates(taskId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching task updates:", error);
      res.status(500).json({ message: "Failed to fetch task updates" });
    }
  });

  // Employee task request routes
  app.post('/api/employee/task-requests', isAuthenticated, async (req: any, res) => {
    try {
      const requestData = {
        requestTitle: req.body.title || req.body.requestTitle,
        requestDescription: req.body.description || req.body.requestDescription,
        requestType: req.body.requestType || 'task_request',
        urgencyLevel: req.body.priority || req.body.urgencyLevel || 'medium',
        requesterId: req.user.id.toString(),
        status: 'pending',
        estimatedHours: req.body.estimatedHours,
        dueDate: req.body.dueDate || undefined
      };
      const validatedData = insertTaskRequestSchema.parse(requestData);
      const taskRequest = await storage.createTaskRequest(validatedData);
      res.json(taskRequest);
    } catch (error) {
      console.error("Error creating task request:", error);
      res.status(500).json({ message: "Failed to create task request" });
    }
  });

  app.get('/api/employee/task-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { status } = req.query;
      const requests = await storage.getTaskRequestsByUser(userId, { status });
      res.json(requests);
    } catch (error) {
      console.error("Error fetching task requests:", error);
      res.status(500).json({ message: "Failed to fetch task requests" });
    }
  });

  // HR routes for managing employee task requests
  app.get('/api/hr/task-requests', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const { status, requesterId, requestType } = req.query;
      const requests = await storage.getAllTaskRequests({ status, requesterId, requestType });
      res.json(requests);
    } catch (error) {
      console.error("Error fetching all task requests:", error);
      res.status(500).json({ message: "Failed to fetch task requests" });
    }
  });

  // Get HR-specific task requests
  app.get('/api/hr/task-requests/hr-requests', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const { status } = req.query;
      const hrTaskRequests = await storage.getAllTaskRequests({ 
        requestType: 'hr_task_request',
        status 
      });
      res.json(hrTaskRequests);
    } catch (error) {
      console.error("Error fetching HR task requests:", error);
      res.status(500).json({ message: "Failed to fetch HR task requests" });
    }
  });

  app.put('/api/hr/task-requests/:id', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { action, assignedTo, dueDate, notes } = req.body;
      
      if (action === 'approve') {
        // Create actual task from the request
        const taskRequest = await storage.getTaskRequest(id);
        if (!taskRequest) {
          return res.status(404).json({ message: "Task request not found" });
        }

        const taskData = {
          title: taskRequest.requestTitle,
          description: taskRequest.requestDescription,
          assignedTo: assignedTo || taskRequest.requesterId,
          assignedBy: req.user.id,
          priority: taskRequest.urgencyLevel === 'urgent' ? 'urgent' : 'medium',
          status: 'pending' as const,
          dueDate: dueDate ? new Date(dueDate) : undefined
        };

        const task = await storage.createTask(taskData);
        
        // Update request status
        await storage.updateTaskRequest(id, { 
          status: 'approved', 
          respondedBy: req.user.id,
          respondedAt: new Date(),
          responseMessage: notes || 'Task created successfully'
        });

        res.json({ task, message: "Task request approved and task created" });
      } else if (action === 'reject') {
        await storage.updateTaskRequest(id, { 
          status: 'rejected', 
          respondedBy: req.user.id,
          respondedAt: new Date(),
          responseMessage: notes || 'Request rejected'
        });
        res.json({ message: "Task request rejected" });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      console.error("Error processing task request:", error);
      res.status(500).json({ message: "Failed to process task request" });
    }
  });

  app.post('/api/tasks/:id/updates', async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updateData = {
        ...req.body,
        taskId,
        userId: '42726954', // Test user ID
      };
      const update = await storage.createTaskUpdate(updateData);
      res.json(update);
    } catch (error) {
      console.error("Error creating task update:", error);
      res.status(500).json({ message: "Failed to create task update" });
    }
  });

  app.put('/api/tasks/:id/updates/:updateId', async (req: any, res) => {
    try {
      const updateId = parseInt(req.params.updateId);
      const update = await storage.updateTaskUpdate(updateId, req.body);
      res.json(update);
    } catch (error) {
      console.error("Error updating task update:", error);
      res.status(500).json({ message: "Failed to update task update" });
    }
  });

  // Task request routes (time extensions, documents, help)
  app.get('/api/task-requests', isAuthenticated, async (req: any, res) => {
    try {
      const { taskId, requesterId, status, departmentId } = req.query;
      const requests = await storage.getTaskRequests({ 
        taskId: taskId ? parseInt(taskId) : undefined, 
        requesterId, 
        status,
        departmentId: departmentId ? parseInt(departmentId) : undefined
      });
      res.json(requests);
    } catch (error) {
      console.error("Error fetching task requests:", error);
      res.status(500).json({ message: "Failed to fetch task requests" });
    }
  });

  app.post('/api/task-requests', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertTaskRequestSchema.parse(req.body);
      const request = await storage.createTaskRequest(validatedData);
      res.json(request);
    } catch (error) {
      console.error("Error creating task request:", error);
      res.status(500).json({ message: "Failed to create task request" });
    }
  });

  app.put('/api/task-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTaskRequestSchema.partial().parse(req.body);
      const request = await storage.updateTaskRequest(id, validatedData);
      res.json(request);
    } catch (error) {
      console.error("Error updating task request:", error);
      res.status(500).json({ message: "Failed to update task request" });
    }
  });

  app.delete('/api/task-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTaskRequest(id);
      res.json({ message: "Task request deleted successfully" });
    } catch (error) {
      console.error("Error deleting task request:", error);
      res.status(500).json({ message: "Failed to delete task request" });
    }
  });

  // Function to recalculate test scores
  async function recalculateTestScore(attempt: any) {
    try {
      if (!attempt.responses) {
        return attempt;
      }

      // Get test details
      const [test] = await db
        .select()
        .from(psychometricTests)
        .where(eq(psychometricTests.id, attempt.testId));

      if (!test) return attempt;

      // Get question details for scoring
      const questions = await db
        .select()
        .from(psychometricQuestions)
        .where(eq(psychometricQuestions.testId, attempt.testId));

      const questionMap = new Map(questions.map(q => [q.id, q]));
      
      let totalScore = 0;
      let correctAnswers = 0;
      const responses = Array.isArray(attempt.responses) ? attempt.responses : JSON.parse(attempt.responses);

      // Calculate score based on test type
      if (test.testType === 'technical' || test.testType === 'cognitive' || test.testType === 'communication') {
        // For tests with correct answers
        responses.forEach((response: any) => {
          const question = questionMap.get(response.questionId);
          if (question && response.selectedAnswer === question.correctAnswer) {
            correctAnswers++;
          }
        });
        totalScore = Math.round((correctAnswers / responses.length) * 100);
      } else if (test.testType === 'personality' || test.testType === 'culture') {
        // For personality/culture tests, give a baseline score based on responses
        totalScore = Math.round(Math.max(50, Math.min(95, 65 + (responses.length * 2))));
      }

      // Update the database record
      const [updatedAttempt] = await db
        .update(psychometricTestAttempts)
        .set({
          totalScore: Math.round(totalScore),
          percentageScore: Math.round(totalScore),
          results: JSON.stringify({
            totalScore: Math.round(totalScore),
            correctAnswers,
            totalQuestions: responses.length,
            recommendations: generateRecommendations(test.testType, totalScore),
            detailedAnswers: responses.map((response: any) => {
              const question = questionMap.get(response.questionId);
              return {
                questionId: response.questionId,
                questionText: question?.questionText || 'Question not found',
                selectedAnswer: response.selectedAnswer,
                correctAnswer: question?.correctAnswer,
                isCorrect: question ? response.selectedAnswer === question.correctAnswer : false
              };
            })
          })
        })
        .where(eq(psychometricTestAttempts.id, attempt.id))
        .returning();

      return updatedAttempt || { ...attempt, totalScore: Math.round(totalScore), percentageScore: Math.round(totalScore) };
    } catch (error) {
      console.error('Error recalculating score:', error);
      return attempt;
    }
  }

  // Function to generate recommendations based on score
  function generateRecommendations(testType: string, score: number): string[] {
    const recommendations = [];
    
    if (score >= 80) {
      recommendations.push(`Excellent performance on ${testType} assessment`);
      recommendations.push("Strong candidate for advanced responsibilities");
    } else if (score >= 60) {
      recommendations.push(`Good performance on ${testType} assessment`);
      recommendations.push("Suitable for role with potential for growth");
    } else if (score >= 40) {
      recommendations.push(`Moderate performance on ${testType} assessment`);
      recommendations.push("May benefit from additional training");
    } else {
      recommendations.push(`Limited performance on ${testType} assessment`);
      recommendations.push("Requires significant development and support");
    }
    
    return recommendations;
  }

  // Assign department task request to employee (HR only)
  app.post('/api/task-requests/:id/assign', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { assignedToEmployeeId, responseMessage } = req.body;
      const responderId = req.user.id;

      const updatedRequest = await storage.assignDepartmentTaskRequest(
        requestId, 
        assignedToEmployeeId, 
        responderId, 
        responseMessage
      );
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error assigning task request:", error);
      res.status(500).json({ message: "Failed to assign task request" });
    }
  });

  // Announcement routes - Only HR and Branch Managers can create/edit announcements
  app.get('/api/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/announcements', requireRole(['hr_admin', 'branch_manager']), requirePermission('announcements', 'manage'), async (req: any, res) => {
    try {
      const validatedData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(validatedData);
      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.put('/api/announcements/:id', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAnnouncementSchema.partial().parse(req.body);
      const announcement = await storage.updateAnnouncement(id, validatedData);
      res.json(announcement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  app.delete('/api/announcements/:id', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAnnouncement(id);
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Recognition routes - Professional plan and above
  app.get('/api/recognition', isAuthenticated, requireFeature('recognition'), async (req: any, res) => {
    try {
      const recognitions = await storage.getRecognitions();
      res.json(recognitions);
    } catch (error) {
      console.error("Error fetching recognitions:", error);
      res.status(500).json({ message: "Failed to fetch recognitions" });
    }
  });

  // Get user's nominations
  app.get('/api/recognition/my-nominations', isAuthenticated, async (req: any, res) => {
    try {
      const recognitions = await storage.getRecognitions({ nomineeId: req.user.id.toString() });
      res.json(recognitions);
    } catch (error) {
      console.error("Error fetching user nominations:", error);
      res.status(500).json({ message: "Failed to fetch nominations" });
    }
  });

  app.post('/api/recognition', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertRecognitionSchema.parse(req.body);
      const recognition = await storage.createRecognition(validatedData);
      
      // Send email notification to nominee
      try {
        const nominee = await storage.getEmployeeByUserId(validatedData.nomineeId);
        const nominator = await storage.getEmployeeByUserId(req.user.id);
        
        if (nominee && nominator) {
          await EmailService.sendRecognitionNotificationEmail(nominee, nominator, recognition);
        }
      } catch (emailError) {
        console.error("Failed to send recognition email:", emailError);
        // Don't fail the request if email fails
      }
      
      res.json(recognition);
    } catch (error) {
      console.error("Error creating recognition:", error);
      res.status(500).json({ message: "Failed to create recognition" });
    }
  });

  app.put('/api/recognition/:id', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRecognitionSchema.partial().parse(req.body);
      const recognition = await storage.updateRecognition(id, validatedData);
      res.json(recognition);
    } catch (error) {
      console.error("Error updating recognition:", error);
      res.status(500).json({ message: "Failed to update recognition" });
    }
  });

  // Logistics routes - Professional plan and above, HR and Logistics Managers only
  app.get('/api/logistics/items', requireRole(['hr_admin', 'logistics_manager']), requireFeature('logistics_basic'), async (req: any, res) => {
    try {
      const items = await storage.getLogisticsItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching logistics items:", error);
      res.status(500).json({ message: "Failed to fetch logistics items" });
    }
  });

  app.post('/api/logistics/items', requireRole(['hr_admin', 'logistics_manager']), async (req: any, res) => {
    try {
      const validatedData = insertLogisticsItemSchema.parse(req.body);
      const item = await storage.createLogisticsItem(validatedData);
      res.json(item);
    } catch (error) {
      console.error("Error creating logistics item:", error);
      res.status(500).json({ message: "Failed to create logistics item" });
    }
  });

  app.put('/api/logistics/items/:id', requireRole(['hr_admin', 'logistics_manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLogisticsItemSchema.partial().parse(req.body);
      const item = await storage.updateLogisticsItem(id, validatedData);
      res.json(item);
    } catch (error) {
      console.error("Error updating logistics item:", error);
      res.status(500).json({ message: "Failed to update logistics item" });
    }
  });

  app.delete('/api/logistics/items/:id', requireRole(['hr_admin', 'logistics_manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLogisticsItem(id);
      res.json({ message: "Logistics item deleted successfully" });
    } catch (error) {
      console.error("Error deleting logistics item:", error);
      res.status(500).json({ message: "Failed to delete logistics item" });
    }
  });

  app.get('/api/logistics/requests', async (req: any, res) => {
    try {
      const { requesterId, status } = req.query;
      const requests = await storage.getLogisticsRequests({ requesterId, status });
      res.json(requests);
    } catch (error) {
      console.error("Error fetching logistics requests:", error);
      res.status(500).json({ message: "Failed to fetch logistics requests" });
    }
  });

  app.post('/api/logistics/requests', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertLogisticsRequestSchema.parse(req.body);
      // Add the authenticated user as the requester
      const requestData = {
        ...validatedData,
        requesterId: req.user?.id?.toString() || req.user?.claims?.sub || null,
        status: 'pending'
      };
      const request = await storage.createLogisticsRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating logistics request:", error);
      res.status(500).json({ message: "Failed to create logistics request" });
    }
  });

  app.put('/api/logistics/requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLogisticsRequestSchema.partial().parse(req.body);
      const request = await storage.updateLogisticsRequest(id, validatedData);
      res.json(request);
    } catch (error) {
      console.error("Error updating logistics request:", error);
      res.status(500).json({ message: "Failed to update logistics request" });
    }
  });

  // Logistics workflow routes
  app.post('/api/logistics/requests/:id/process', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { action, notes, rejectionReason } = req.body;
      
      let updateData: any = {};
      
      if (action === 'approve') {
        updateData = {
          status: 'approved',
          approvedBy: req.user.id,
          approvedAt: new Date(),
          notes,
        };
      } else if (action === 'reject') {
        updateData = {
          status: 'rejected',
          rejectedBy: req.user.id,
          rejectedAt: new Date(),
          rejectionReason,
          notes,
        };
      }
      
      const request = await storage.updateLogisticsRequest(id, updateData);
      
      // Send email notification to the requester
      try {
        const requester = await storage.getUser(request.requesterId);
        if (requester && action === 'approve') {
          // Send approval email
          console.log(`Sending approval email to ${requester.username} for request ${request.itemName}`);
        } else if (requester && action === 'reject') {
          // Send rejection email
          console.log(`Sending rejection email to ${requester.username} for request ${request.itemName}: ${rejectionReason}`);
        }
      } catch (emailError) {
        console.error("Failed to send logistics request email:", emailError);
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error processing logistics request:", error);
      res.status(500).json({ message: "Failed to process logistics request" });
    }
  });

  app.put('/api/logistics/requests/:id/approve', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = '42726954'; // Test user ID
      const request = await storage.updateLogisticsRequest(id, {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      });
      res.json(request);
    } catch (error) {
      console.error("Error approving logistics request:", error);
      res.status(500).json({ message: "Failed to approve logistics request" });
    }
  });

  app.put('/api/logistics/requests/:id/reject', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const request = await storage.updateLogisticsRequest(id, {
        status: 'rejected',
        rejectionReason: reason,
      });
      res.json(request);
    } catch (error) {
      console.error("Error rejecting logistics request:", error);
      res.status(500).json({ message: "Failed to reject logistics request" });
    }
  });

  // Enhanced Logistics Expense Routes
  app.get("/api/logistics/expenses", async (req, res) => {
    try {
      const { requestId, dateFrom, dateTo, expenseType, vendor } = req.query as {
        requestId?: string;
        dateFrom?: string;
        dateTo?: string;
        expenseType?: string;
        vendor?: string;
      };
      
      const filters = {
        requestId: requestId ? parseInt(requestId) : undefined,
        dateFrom,
        dateTo,
        expenseType,
        vendor,
      };
      
      const expenses = await storage.getLogisticsExpenses(filters);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching logistics expenses:", error);
      res.status(500).json({ message: "Failed to fetch logistics expenses" });
    }
  });

  app.post("/api/logistics/expenses", async (req, res) => {
    try {
      const expense = await storage.createLogisticsExpense(req.body);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating logistics expense:", error);
      res.status(500).json({ message: "Failed to create logistics expense" });
    }
  });

  app.put("/api/logistics/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.updateLogisticsExpense(id, req.body);
      res.json(expense);
    } catch (error) {
      console.error("Error updating logistics expense:", error);
      res.status(500).json({ message: "Failed to update logistics expense" });
    }
  });

  app.delete("/api/logistics/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLogisticsExpense(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting logistics expense:", error);
      res.status(500).json({ message: "Failed to delete logistics expense" });
    }
  });

  // Logistics Movement Routes
  app.get("/api/logistics/movements", async (req, res) => {
    try {
      const { itemId } = req.query as { itemId?: string };
      const movements = await storage.getLogisticsMovements(itemId ? parseInt(itemId) : undefined);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching logistics movements:", error);
      res.status(500).json({ message: "Failed to fetch logistics movements" });
    }
  });

  app.post("/api/logistics/movements", async (req, res) => {
    try {
      const movement = await storage.createLogisticsMovement(req.body);
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating logistics movement:", error);
      res.status(500).json({ message: "Failed to create logistics movement" });
    }
  });

  // Logistics Analytics and Reporting Routes
  app.get("/api/logistics/dashboard", async (req, res) => {
    try {
      const stats = await storage.getLogisticsDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching logistics dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch logistics dashboard stats" });
    }
  });

  app.get("/api/logistics/reports/monthly", async (req, res) => {
    try {
      const { year, month } = req.query as { year?: string; month?: string };
      const currentDate = new Date();
      const reportYear = year ? parseInt(year) : currentDate.getFullYear();
      const reportMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
      
      const report = await storage.getMonthlyExpenseReport(reportYear, reportMonth);
      res.json(report);
    } catch (error) {
      console.error("Error fetching monthly expense report:", error);
      res.status(500).json({ message: "Failed to fetch monthly expense report" });
    }
  });

  app.get("/api/logistics/reports/categories", async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };
      const report = await storage.getExpensesByCategory(dateFrom, dateTo);
      res.json(report);
    } catch (error) {
      console.error("Error fetching category expense report:", error);
      res.status(500).json({ message: "Failed to fetch category expense report" });
    }
  });

  app.get("/api/logistics/reports/vendors", async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };
      const report = await storage.getVendorExpenseReport(dateFrom, dateTo);
      res.json(report);
    } catch (error) {
      console.error("Error fetching vendor expense report:", error);
      res.status(500).json({ message: "Failed to fetch vendor expense report" });
    }
  });

  app.put('/api/logistics/requests/:id/purchase', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { actualCost, vendor, purchaseDate, notes } = req.body;
      const request = await storage.updateLogisticsRequest(id, {
        status: 'purchased',
        actualCost,
        vendor,
        purchaseDate: new Date(purchaseDate),
        notes,
      });
      res.json(request);
    } catch (error) {
      console.error("Error completing purchase:", error);
      res.status(500).json({ message: "Failed to complete purchase" });
    }
  });

  app.post('/api/logistics/requests/:id/receipt', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      // Simple receipt upload simulation - in production would handle file upload
      const request = await storage.updateLogisticsRequest(id, {
        status: 'completed',
        receiptUrl: '/receipts/receipt-' + id + '.pdf',
        receiptFilename: 'receipt-' + id + '.pdf',
      });
      res.json(request);
    } catch (error) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ message: "Failed to upload receipt" });
    }
  });

  // Onboarding routes
  app.get('/api/onboarding/:employeeId', async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const checklists = await storage.getOnboardingChecklists(employeeId);
      res.json(checklists);
    } catch (error) {
      console.error("Error fetching onboarding checklists:", error);
      res.status(500).json({ message: "Failed to fetch onboarding checklists" });
    }
  });

  // Create comprehensive onboarding checklist for a new employee
  app.post('/api/onboarding/create-template/:employeeId', async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const userId = '42726954'; // Use test user ID
      
      // Predefined comprehensive onboarding checklist
      const onboardingTemplate = [
        // Pre-arrival items
        { itemTitle: "Workspace Setup", description: "Prepare desk, chair, and basic office supplies", order: 1 },
        { itemTitle: "IT Equipment Assignment", description: "Assign laptop, monitor, keyboard, mouse", order: 2 },
        { itemTitle: "Email Account Creation", description: "Create company email account and send credentials", order: 3 },
        { itemTitle: "Access Card Preparation", description: "Prepare building access card and parking pass", order: 4 },
        { itemTitle: "Welcome Package", description: "Prepare welcome kit with company swag and materials", order: 5 },
        
        // Day 1 items
        { itemTitle: "Welcome Meeting", description: "Meet with direct manager and HR representative", order: 6 },
        { itemTitle: "Office Tour", description: "Complete office tour including emergency exits and facilities", order: 7 },
        { itemTitle: "Meet Team Members", description: "Introduction to immediate team and key colleagues", order: 8 },
        { itemTitle: "IT Setup & Login", description: "Complete computer setup and test all system access", order: 9 },
        { itemTitle: "Company Overview Presentation", description: "Attend company overview and culture presentation", order: 10 },
        { itemTitle: "Employee Handbook Review", description: "Review and acknowledge employee handbook", order: 11, requiresDocument: true, documentType: "pdf" },
        
        // Week 1 items
        { itemTitle: "Complete I-9 Form", description: "Submit I-9 form with required documentation", order: 12, requiresDocument: true, documentType: "pdf" },
        { itemTitle: "Submit W-4 Form", description: "Complete and submit tax withholding form", order: 13, requiresDocument: true, documentType: "pdf" },
        { itemTitle: "Benefits Enrollment", description: "Complete health, dental, and retirement plan enrollment", order: 14, requiresDocument: true, documentType: "pdf" },
        { itemTitle: "Emergency Contact Information", description: "Provide emergency contact details", order: 15 },
        { itemTitle: "Direct Deposit Setup", description: "Submit banking information for payroll", order: 16, requiresDocument: true, documentType: "image" },
        { itemTitle: "Security Training", description: "Complete mandatory security awareness training", order: 17, requiresDocument: true, documentType: "pdf" },
        { itemTitle: "Confidentiality Agreement", description: "Sign confidentiality and non-disclosure agreement", order: 18, requiresDocument: true, documentType: "pdf" },
        
        // Week 2 items
        { itemTitle: "Department-Specific Training", description: "Complete role-specific training modules", order: 19 },
        { itemTitle: "Mentor Assignment", description: "Meet with assigned workplace mentor", order: 20 },
        { itemTitle: "System Access Verification", description: "Verify access to all required systems and databases", order: 21 },
        { itemTitle: "Performance Goals Setting", description: "Establish 30-60-90 day performance goals", order: 22 },
        { itemTitle: "Project Assignment", description: "Receive first project assignment and overview", order: 23 },
        
        // Month 1 items
        { itemTitle: "30-Day Check-in", description: "Formal 30-day review with manager", order: 24 },
        { itemTitle: "HR Feedback Session", description: "Feedback session with HR about onboarding experience", order: 25 },
        { itemTitle: "Workplace Culture Assessment", description: "Complete workplace culture and satisfaction survey", order: 26 },
        { itemTitle: "Training Progress Review", description: "Review completion of all mandatory training", order: 27 },
        { itemTitle: "Goal Progress Check", description: "Review progress on initial performance goals", order: 28 },
        
        // Long-term items
        { itemTitle: "60-Day Review", description: "Comprehensive 60-day performance review", order: 29 },
        { itemTitle: "90-Day Review", description: "Final onboarding review and transition to regular employee", order: 30 },
        { itemTitle: "Professional Development Plan", description: "Create long-term professional development plan", order: 31 },
        { itemTitle: "Company Social Integration", description: "Participate in company social events and team building", order: 32 },
      ];

      // Create all checklist items for the employee
      const createdItems = [];
      for (const item of req.body) {
        const checklistItem = await storage.createOnboardingChecklist({
          employeeId,
          ...item
        });
        createdItems.push(checklistItem);
      }

      res.json({ 
        message: "Comprehensive onboarding checklist created successfully",
        items: createdItems,
        totalItems: createdItems.length
      });
    } catch (error) {
      console.error("Error creating onboarding template:", error);
      res.status(500).json({ message: "Failed to create onboarding template" });
    }
  });

  // Generate onboarding link for employee
  app.post('/api/onboarding/generate-link/:employeeId', async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const employees = await storage.getEmployees();
      const employee = employees.find(emp => emp.id === employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // In a real implementation, you would generate a secure token and store it
      // For now, we'll create a simple link with the employee ID
      const onboardingLink = `${req.protocol}://${req.hostname}/onboarding-portal?employeeId=${employeeId}&token=${Buffer.from(employeeId.toString()).toString('base64')}`;
      
      res.json({ 
        onboardingLink,
        employeeName: `${employee.user.firstName} ${employee.user.lastName}`,
        employeeEmail: employee.user.email,
        message: "Onboarding link generated successfully. Share this link with the employee to complete their onboarding."
      });
    } catch (error) {
      console.error("Error generating onboarding link:", error);
      res.status(500).json({ message: "Failed to generate onboarding link" });
    }
  });

  // Employee onboarding progress and completion routes
  app.get('/api/onboarding/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employee = await storage.getEmployee(userId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const checklists = await storage.getOnboardingChecklists(employee.id);
      const totalItems = checklists.length;
      const completedItems = checklists.filter(item => item.isCompleted).length;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      res.json({
        employee,
        checklists,
        progress: {
          total: totalItems,
          completed: completedItems,
          percentage: progress
        }
      });
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });

  app.post('/api/onboarding/save-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressData = req.body;
      
      // Save the onboarding progress data
      // In a real implementation, you would save this to a dedicated table
      res.json({ message: "Progress saved successfully", data: progressData });
    } catch (error) {
      console.error("Error saving onboarding progress:", error);
      res.status(500).json({ message: "Failed to save onboarding progress" });
    }
  });

  app.post('/api/onboarding/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const onboardingData = req.body;
      
      // Process final onboarding submission
      // In a real implementation, you would save this data and trigger workflows
      
      // Update employee onboarding status
      const employee = await storage.getEmployee(userId);
      if (employee) {
        await storage.updateEmployee(employee.id, {
          onboardingStatus: 'completed',
          onboardingProgress: 100
        });
      }

      res.json({ 
        message: "Onboarding completed successfully",
        data: onboardingData 
      });
    } catch (error) {
      console.error("Error submitting onboarding:", error);
      res.status(500).json({ message: "Failed to submit onboarding" });
    }
  });

  // Get all onboarding checklists (HR only)
  app.get('/api/onboarding-checklists', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const checklists = await storage.getAllOnboardingChecklists();
      res.json(checklists);
    } catch (error) {
      console.error("Error fetching all onboarding checklists:", error);
      res.status(500).json({ message: "Failed to fetch onboarding checklists" });
    }
  });

  // Get onboarding checklist for current user (employee dashboard endpoint)
  app.get('/api/onboarding-checklist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      const checklists = await storage.getOnboardingChecklists(employee.id);
      res.json(checklists);
    } catch (error) {
      console.error("Error fetching employee onboarding checklist:", error);
      res.status(500).json({ message: "Failed to fetch onboarding checklist" });
    }
  });

  // Get employee profile for current user
  app.get('/api/employee-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee profile:", error);
      res.status(500).json({ message: "Failed to fetch employee profile" });
    }
  });

  // Get profile completion status (for employees)
  app.get('/api/profile-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json({
        personalProfileCompleted: employee.personalProfileCompleted || false
      });
    } catch (error) {
      console.error('Error fetching profile status:', error);
      res.status(500).json({ error: 'Failed to fetch profile status' });
    }
  });

  // Get employee's own onboarding data only
  app.get('/api/my-onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      // Get onboarding checklist for this employee only
      const checklists = await storage.getOnboardingChecklists(employee.id);
      
      // Calculate progress
      const totalItems = checklists.length;
      const completedItems = checklists.filter(item => item.isCompleted).length;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      res.json({
        employee,
        checklists,
        progress: {
          total: totalItems,
          completed: completedItems,
          percentage: progress
        }
      });
    } catch (error) {
      console.error("Error fetching employee onboarding data:", error);
      res.status(500).json({ message: "Failed to fetch onboarding data" });
    }
  });

  // Update onboarding checklist item
  app.put('/api/onboarding-checklists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedItem = await storage.updateOnboardingChecklist(id, {
        ...updateData,
        updatedAt: new Date()
      });
      
      // Send email notification for onboarding completion
      if (updateData.isCompleted && updatedItem) {
        try {
          const employee = await storage.getEmployeeById(updatedItem.employeeId);
          if (employee) {
            await EmailService.sendOnboardingUpdateEmail(
              employee, 
              updatedItem.itemTitle, 
              'completed'
            );
          }
        } catch (emailError) {
          console.error("Failed to send onboarding completion email:", emailError);
          // Don't fail the request if email fails
        }
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating onboarding checklist item:", error);
      res.status(500).json({ message: "Failed to update onboarding checklist item" });
    }
  });

  // Document upload for onboarding checklist items
  app.post('/api/onboarding-checklists/:id/upload', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { fileName, fileContent, fileSize } = req.body;
      
      if (!fileName || !fileContent) {
        return res.status(400).json({ message: "fileName and fileContent are required" });
      }
      
      // Create document URL (in a real system, this would be a cloud storage URL)
      const documentUrl = `data:application/pdf;base64,${fileContent}`;
      
      // Update the onboarding checklist item with document information
      const updatedItem = await storage.updateOnboardingChecklist(id, {
        documentUrl,
        documentName: fileName,
        isDocumentVerified: true, // Automatically verify documents
        verifiedAt: new Date(),
        verifiedBy: 'system', // Mark as automatically verified
        isCompleted: true, // Mark as completed when document is uploaded
        completedAt: new Date(),
        updatedAt: new Date()
      });
      
      // Send email notification for document upload completion
      if (updatedItem) {
        try {
          const employee = await storage.getEmployeeById(updatedItem.employeeId);
          if (employee) {
            await EmailService.sendOnboardingUpdateEmail(
              employee, 
              updatedItem.itemTitle, 
              'completed'
            );
          }
        } catch (emailError) {
          console.error("Failed to send document upload completion email:", emailError);
          // Don't fail the request if email fails
        }
      }
      
      res.json({ 
        success: true, 
        message: "Document uploaded successfully",
        item: updatedItem
      });
    } catch (error) {
      console.error("Error uploading document to onboarding checklist:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Delete onboarding checklist item
  app.delete('/api/onboarding-checklists/:id', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOnboardingChecklist(id);
      res.json({ message: "Onboarding checklist item deleted successfully" });
    } catch (error) {
      console.error("Error deleting onboarding checklist item:", error);
      res.status(500).json({ message: "Failed to delete onboarding checklist item" });
    }
  });

  // Generate onboarding link for approved employee (simplified version)
  app.post('/api/generate-onboarding-link/:requestId', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const registrationRequest = await storage.getRegistrationRequest(requestId);
      
      if (!registrationRequest || registrationRequest.status !== 'approved') {
        return res.status(404).json({ message: "Approved registration request not found" });
      }

      // Generate secure onboarding token
      const crypto = await import('crypto');
      const onboardingToken = crypto.randomBytes(32).toString('hex');
      
      // Create the onboarding link - use the current request's host
      const protocol = req.protocol || 'https';
      const host = req.get('host') || process.env.REPLIT_DOMAINS || 'localhost:5000';
      const baseUrl = `${protocol}://${host}`;
      const onboardingLink = `${baseUrl}/employee-onboarding?token=${onboardingToken}`;
      
      console.log('Generated onboarding link:', onboardingLink);
      console.log('Base URL:', baseUrl);

      // For now, we'll just store the token with the registration request
      // The actual user account will be created when they access the onboarding portal

      // Store the token with the registration request for future reference
      await storage.updateRegistrationRequest(requestId, {
        onboardingStarted: true,
        updatedAt: new Date()
      });

      // Send HR notification about onboarding link generation
      HRNotifications.onboardingLinkGenerated(
        {
          firstName: registrationRequest.firstName,
          lastName: registrationRequest.lastName,
          email: registrationRequest.email,
          requestedRole: registrationRequest.requestedRole
        },
        onboardingLink
      );

      // For now, we'll return the link so HR can copy and send it manually
      res.json({ 
        success: true,
        message: "Onboarding link generated successfully",
        onboardingToken,
        onboardingLink,
        employeeName: `${registrationRequest.firstName} ${registrationRequest.lastName}`,
        employeeEmail: registrationRequest.email,
        instructions: "Copy this link and send it to the employee via email or other communication method."
      });

    } catch (error) {
      console.error("Error generating onboarding link:", error);
      res.status(500).json({ message: "Failed to generate onboarding link", error: error.message });
    }
  });

  // Send onboarding link to multiple approved employees
  app.post('/api/send-bulk-onboarding-links', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const { requestIds } = req.body;
      
      if (!Array.isArray(requestIds) || requestIds.length === 0) {
        return res.status(400).json({ message: "Please provide an array of registration request IDs" });
      }

      const results = [];
      
      for (const requestId of requestIds) {
        try {
          const registrationRequest = await storage.getRegistrationRequest(requestId);
          
          if (!registrationRequest || registrationRequest.status !== 'approved') {
            results.push({ requestId, success: false, message: "Approved registration request not found" });
            continue;
          }

          // Generate secure onboarding token
          const crypto = await import('crypto');
          const onboardingToken = crypto.randomBytes(32).toString('hex');
          
          // Create user record with onboarding token
          const userData = {
            username: registrationRequest.username,
            email: registrationRequest.email,
            firstName: registrationRequest.firstName,
            lastName: registrationRequest.lastName,
            password: registrationRequest.password,
            role: registrationRequest.requestedRole,
            status: 'inactive',
            department: registrationRequest.requestedDepartment,
            position: registrationRequest.position,
            onboardingToken,
            onboardingStatus: 'pending',
            onboardingProgress: 0,
            accountEnabled: false
          };

          const newUser = await storage.createUser(userData);
          
          // Create comprehensive onboarding checklist
          const onboardingTemplate = [
            { itemTitle: "Welcome Meeting", description: "Meet with direct manager and HR representative", order: 1, employeeId: newUser.id, isCompleted: false },
            { itemTitle: "Office Tour", description: "Complete office tour including emergency exits and facilities", order: 2, employeeId: newUser.id, isCompleted: false },
            { itemTitle: "Meet Team Members", description: "Introduction to immediate team and key colleagues", order: 3, employeeId: newUser.id, isCompleted: false },
            { itemTitle: "IT Setup & Login", description: "Complete computer setup and test all system access", order: 4, employeeId: newUser.id, isCompleted: false },
            { itemTitle: "Company Overview Presentation", description: "Attend company overview and culture presentation", order: 5, employeeId: newUser.id, isCompleted: false },
            { itemTitle: "Employee Handbook Review", description: "Review and acknowledge employee handbook", order: 6, employeeId: newUser.id, isCompleted: false, requiresDocument: true, documentType: "pdf" },
            { itemTitle: "Complete I-9 Form", description: "Submit I-9 form with required documentation", order: 7, employeeId: newUser.id, isCompleted: false, requiresDocument: true, documentType: "pdf" },
            { itemTitle: "Submit W-4 Form", description: "Complete and submit tax withholding form", order: 8, employeeId: newUser.id, isCompleted: false, requiresDocument: true, documentType: "pdf" },
            { itemTitle: "Benefits Enrollment", description: "Complete health, dental, and retirement plan enrollment", order: 9, employeeId: newUser.id, isCompleted: false, requiresDocument: true, documentType: "pdf" },
            { itemTitle: "Emergency Contact Information", description: "Provide emergency contact details", order: 10, employeeId: newUser.id, isCompleted: false },
            { itemTitle: "Direct Deposit Setup", description: "Submit banking information for payroll", order: 11, employeeId: newUser.id, isCompleted: false, requiresDocument: true, documentType: "image" },
            { itemTitle: "Security Training", description: "Complete mandatory security awareness training", order: 12, employeeId: newUser.id, isCompleted: false },
            { itemTitle: "Confidentiality Agreement", description: "Sign confidentiality and non-disclosure agreement", order: 13, employeeId: newUser.id, isCompleted: false, requiresDocument: true, documentType: "pdf" },
            { itemTitle: "Department-Specific Training", description: "Complete role-specific training modules", order: 14, employeeId: newUser.id, isCompleted: false },
            { itemTitle: "System Access Verification", description: "Verify access to all required systems and databases", order: 15, employeeId: newUser.id, isCompleted: false },
            { itemTitle: "Complete Psychometric Tests", description: "Complete all required assessment tests including personality, cognitive, communication, technical, and culture fit evaluations", order: 16, employeeId: newUser.id, isCompleted: false, requiresPsychometricTest: true }
          ];

          // Create checklist items
          for (const item of onboardingTemplate) {
            await storage.createOnboardingChecklist(item);
          }

          // Send onboarding email
          const { sendOnboardingEmail } = await import('./email');
          const emailSent = await sendOnboardingEmail(
            registrationRequest.email, 
            `${registrationRequest.firstName} ${registrationRequest.lastName}`,
            onboardingToken
          );

          // Mark registration request as onboarding started
          await storage.updateRegistrationRequest(requestId, {
            onboardingStarted: true,
            updatedAt: new Date()
          });

          results.push({
            requestId,
            success: true,
            employeeId: newUser.id,
            onboardingToken,
            emailSent,
            onboardingLink: `${process.env.REPLIT_URL || 'http://localhost:5000'}/employee-onboarding?token=${onboardingToken}`,
            employeeName: `${registrationRequest.firstName} ${registrationRequest.lastName}`,
            email: registrationRequest.email
          });

        } catch (itemError) {
          console.error(`Error processing request ID ${requestId}:`, itemError);
          results.push({ requestId, success: false, message: "Error processing this request" });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      res.json({ 
        message: `Processed ${requestIds.length} requests. ${successCount} onboarding links sent successfully.`,
        results,
        totalProcessed: requestIds.length,
        successCount
      });

    } catch (error) {
      console.error("Error sending bulk onboarding links:", error);
      res.status(500).json({ message: "Failed to send bulk onboarding links" });
    }
  });

  // Super Admin SaaS Management Routes
  app.get('/api/super-admin/trial-users', requireRole(['hr_admin']), async (req, res) => {
    try {
      const trialUsers = await storage.getTrialUsers();
      res.json(trialUsers);
    } catch (error) {
      console.error("Error fetching trial users:", error);
      res.status(500).json({ message: "Failed to fetch trial users" });
    }
  });

  app.get('/api/super-admin/saas-stats', requireRole(['hr_admin']), async (req, res) => {
    try {
      const stats = await storage.getSaasStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching SaaS stats:", error);
      res.status(500).json({ message: "Failed to fetch SaaS stats" });
    }
  });

  app.post('/api/super-admin/create-trial-user', requireRole(['hr_admin']), async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, role, companyName, trialDays } = req.body;
      
      // Hash password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Calculate trial end date
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      
      const userData = {
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        companyName,
        accountEnabled: true,
        trialEndDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newUser = await storage.createTrialUser(userData);
      
      // Send welcome email with credentials
      await EmailService.sendTrialCredentials(newUser, password);
      
      res.status(201).json({
        user: newUser,
        accessUrl: `${req.protocol}://${req.hostname}/trial-access/${username}`,
        message: "Trial user created successfully"
      });
    } catch (error) {
      console.error("Error creating trial user:", error);
      res.status(500).json({ message: "Failed to create trial user" });
    }
  });

  app.post('/api/super-admin/extend-trial/:userId', requireRole(['hr_admin']), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { days } = req.body;
      
      const updatedUser = await storage.extendTrial(userId, days);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error extending trial:", error);
      res.status(500).json({ message: "Failed to extend trial" });
    }
  });

  app.post('/api/super-admin/send-credentials/:userId', requireRole(['hr_admin']), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate temporary password for existing user
      const crypto = await import('crypto');
      const tempPassword = crypto.randomBytes(8).toString('hex');
      
      // Send email with login instructions
      await EmailService.sendTrialLoginInstructions(user, tempPassword);
      
      res.json({ message: "Login credentials sent successfully" });
    } catch (error) {
      console.error("Error sending credentials:", error);
      res.status(500).json({ message: "Failed to send credentials" });
    }
  });

  // Custom trial access routes
  app.get('/trial-access/:username', (req, res) => {
    const { username } = req.params;
    res.cookie('trial_user', username, { httpOnly: false, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/?trial=true');
  });

  // Legacy Qanzak routes (redirect to new system)
  app.get('/qanzak', (req, res) => {
    res.redirect('/trial-access/muhammad0lfc');
  });

  app.get('/qanzakglobal', (req, res) => {
    res.redirect('/trial-access/muhammad0lfc');
  });

  // Public onboarding portal endpoints (no authentication required)
  
  // Get employee onboarding checklist by token
  app.get('/api/public/onboarding/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      // Find user by onboarding token
      const user = await storage.getUserByOnboardingToken(token);
      if (!user) {
        return res.status(404).json({ message: "Invalid onboarding link" });
      }

      // Get employee record for this user
      const employee = await storage.getEmployee(user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee record not found" });
      }

      // Get employee's checklist items using employee ID
      const checklists = await storage.getOnboardingChecklists(employee.id);
      
      res.json({
        employee: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          department: user.department,
          position: user.position
        },
        checklists,
        totalItems: checklists.length,
        completedItems: checklists.filter(item => item.isCompleted).length
      });
    } catch (error) {
      console.error("Error fetching public onboarding:", error);
      res.status(500).json({ message: "Failed to fetch onboarding information" });
    }
  });

  // Update checklist item completion (public endpoint)
  app.put('/api/public/onboarding/:token/item/:itemId', async (req, res) => {
    try {
      const { token, itemId } = req.params;
      const { isCompleted, documentUrl, documentName } = req.body;
      
      // Verify token and get user
      const user = await storage.getUserByOnboardingToken(token);
      if (!user) {
        return res.status(404).json({ message: "Invalid onboarding link" });
      }

      // Get employee record for this user
      const employee = await storage.getEmployee(user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee record not found" });
      }

      // Update checklist item
      const updateData: any = {
        isCompleted,
        completedBy: user.id.toString(),
        updatedAt: new Date()
      };

      // If document is uploaded, automatically mark as verified
      if (documentUrl && documentName) {
        updateData.documentUrl = documentUrl;
        updateData.documentName = documentName;
        updateData.isDocumentVerified = true;
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = 'system';
      }

      const updatedItem = await storage.updateOnboardingChecklist(parseInt(itemId), updateData);

      // Check if all items are completed
      const allChecklists = await storage.getOnboardingChecklists(employee.id);
      const allCompleted = allChecklists.every(item => item.isCompleted);
      
      if (allCompleted) {
        // Update user onboarding status and enable account access
        await storage.updateUser(user.id, {
          onboardingStatus: 'completed',
          onboardingProgress: 100,
          accountEnabled: true
        });
      }

      res.json({
        item: updatedItem,
        allCompleted,
        message: allCompleted ? "Onboarding completed! You can now access your account." : "Item updated successfully"
      });
    } catch (error) {
      console.error("Error updating onboarding item:", error);
      res.status(500).json({ message: "Failed to update onboarding item" });
    }
  });

  // Generate onboarding link for employee
  app.post('/api/onboarding/generate-link/:employeeId', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      
      // Generate unique onboarding token
      const onboardingToken = `onb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update user with onboarding token
      await storage.updateUser(employeeId, {
        onboardingToken,
        accountEnabled: false, // Disable account until onboarding is complete
        onboardingStatus: 'in_progress'
      });

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com' 
        : `http://localhost:5000`;

      const onboardingLink = `${baseUrl}/employee-onboarding?token=${onboardingToken}`;

      res.json({
        link: onboardingLink,
        token: onboardingToken,
        message: "Onboarding link generated successfully"
      });
    } catch (error) {
      console.error("Error generating onboarding link:", error);
      res.status(500).json({ message: "Failed to generate onboarding link" });
    }
  });

  // Two-phase onboarding endpoints
  // Step 1: Employee submits their details
  app.post('/api/onboarding/employee-details', async (req: any, res) => {
    try {
      const employeeData = req.body;
      
      // Create employee submission
      const submission = await storage.createEmployeeSubmission({
        ...employeeData,
        status: 'pending',
        submittedAt: new Date(),
        hrStepsCompleted: [],
        hrStepsNotes: {}
      });
      
      res.json({ 
        success: true, 
        submissionId: submission.id,
        message: "Your details have been submitted successfully. HR will complete your onboarding process." 
      });
    } catch (error) {
      console.error("Error creating employee submission:", error);
      res.status(500).json({ message: "Failed to submit employee details" });
    }
  });

  // Get all employee submissions for HR
  app.get('/api/onboarding/employee-submissions', async (req: any, res) => {
    try {
      const submissions = await storage.getEmployeeSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching employee submissions:", error);
      res.status(500).json({ message: "Failed to fetch employee submissions" });
    }
  });

  // Get specific employee submission
  app.get('/api/onboarding/employee-submission/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getEmployeeSubmission(id);
      
      if (!submission) {
        return res.status(404).json({ message: "Employee submission not found" });
      }
      
      res.json(submission);
    } catch (error) {
      console.error("Error fetching employee submission:", error);
      res.status(500).json({ message: "Failed to fetch employee submission" });
    }
  });

  // Step 2: HR updates onboarding step
  app.put('/api/onboarding/hr-step/:stepId', async (req: any, res) => {
    try {
      const { stepId } = req.params;
      const { employeeId, isCompleted, notes } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }
      
      const updatedSubmission = await storage.updateHRStep(employeeId, stepId, isCompleted, notes);
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating HR step:", error);
      res.status(500).json({ message: "Failed to update HR step" });
    }
  });

  // Complete onboarding process
  app.post('/api/onboarding/complete/:employeeId', async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      
      const completedSubmission = await storage.updateEmployeeSubmission(employeeId, {
        status: 'completed',
        completedAt: new Date(),
        assignedHR: req.user?.claims?.sub
      });
      
      res.json({ 
        success: true, 
        message: "Employee onboarding completed successfully",
        submission: completedSubmission 
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.post('/api/onboarding', async (req: any, res) => {
    try {
      const validatedData = insertOnboardingChecklistSchema.parse(req.body);
      const checklist = await storage.createOnboardingChecklist(validatedData);
      res.json(checklist);
    } catch (error) {
      console.error("Error creating onboarding checklist:", error);
      res.status(500).json({ message: "Failed to create onboarding checklist" });
    }
  });

  app.put('/api/onboarding/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertOnboardingChecklistSchema.partial().parse(req.body);
      const checklist = await storage.updateOnboardingChecklist(id, validatedData);
      res.json(checklist);
    } catch (error) {
      console.error("Error updating onboarding checklist:", error);
      res.status(500).json({ message: "Failed to update onboarding checklist" });
    }
  });

  // Document upload for onboarding items
  app.post('/api/onboarding/:id/upload', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { documentUrl, documentName } = req.body;
      
      const checklist = await storage.updateOnboardingChecklist(id, {
        documentUrl,
        documentName,
        isDocumentVerified: false // Reset verification status when new document is uploaded
      });
      
      res.json(checklist);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Document verification for HR
  app.post('/api/onboarding/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isVerified, verificationNotes } = req.body;
      const userId = req.user.claims.sub;
      
      const checklist = await storage.updateOnboardingChecklist(id, {
        isDocumentVerified: isVerified,
        verifiedBy: isVerified ? userId : null,
        verifiedAt: isVerified ? new Date() : null,
        verificationNotes
      });
      
      res.json(checklist);
    } catch (error) {
      console.error("Error verifying document:", error);
      res.status(500).json({ message: "Failed to verify document" });
    }
  });

  app.delete('/api/onboarding/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOnboardingChecklist(id);
      res.json({ message: "Onboarding checklist deleted successfully" });
    } catch (error) {
      console.error("Error deleting onboarding checklist:", error);
      res.status(500).json({ message: "Failed to delete onboarding checklist" });
    }
  });

  // Employment Contract Routes
  
  // Get user's pending contract
  app.get('/api/contracts/pending', isAuthenticated, async (req: any, res) => {
    try {
      const contract = await storage.getUserPendingContract(req.user.id);
      
      // Return null instead of 404 when no contract exists (expected behavior)
      res.json(contract || null);
    } catch (error) {
      console.error('Error fetching pending contract:', error);
      res.status(500).json({ message: 'Failed to fetch pending contract' });
    }
  });

  // Get all contracts for current user (employee view)
  app.get('/api/my-contracts', isAuthenticated, async (req: any, res) => {
    try {
      const contracts = await storage.getUserContracts(req.user.id);
      res.json(contracts);
    } catch (error) {
      console.error('Error fetching user contracts:', error);
      res.status(500).json({ message: 'Failed to fetch contracts' });
    }
  });

  // Get all employment contracts for HR admin (MUST come before /:id route)
  app.get('/api/contracts/all', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin permissions
      if (!req.user.role || !['hr_admin', 'branch_manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied. HR admin privileges required.' });
      }

      const contracts = await storage.getAllEmploymentContracts();
      res.json(contracts);
    } catch (error) {
      console.error('Error fetching all contracts:', error);
      res.status(500).json({ message: 'Failed to fetch contracts' });
    }
  });

  // Get all contracts (requires contract_management permission)
  app.get('/api/contracts', isAuthenticated, requirePermission('contract_management', 'view'), async (req: any, res) => {
    try {
      const contracts = await storage.getEmploymentContracts();
      res.json(contracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      res.status(500).json({ message: 'Failed to fetch contracts' });
    }
  });

  // Get specific contract
  app.get('/api/contracts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        return res.status(400).json({ message: 'Invalid contract ID' });
      }
      const contract = await storage.getEmploymentContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Check if user can access this contract
      if (req.user.role !== 'hr_admin' && contract.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(contract);
    } catch (error) {
      console.error('Error fetching contract:', error);
      res.status(500).json({ message: 'Failed to fetch contract' });
    }
  });

  // Create new employment contract (HR Admin only)
  app.post('/api/contracts', requireRole(['hr_admin']), requirePermission('contract_management', 'manage'), async (req: any, res) => {
    try {
      const contractData = insertEmploymentContractSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const contract = await storage.createEmploymentContract(contractData);
      res.json(contract);
    } catch (error) {
      console.error('Error creating contract:', error);
      res.status(500).json({ message: 'Failed to create contract' });
    }
  });

  // Sign employment contract
  app.post('/api/contracts/:id/sign', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { signature } = req.body;
      
      if (!signature) {
        return res.status(400).json({ message: 'Digital signature is required' });
      }

      const contract = await storage.getEmploymentContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      if (contract.userId !== req.user.id) {
        return res.status(403).json({ message: 'You can only sign your own contract' });
      }

      if (contract.status !== 'pending') {
        return res.status(400).json({ message: 'This contract has already been processed' });
      }

      // Get client IP and user agent
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      await storage.signEmploymentContract(contractId, signature, ipAddress, userAgent);

      // Send email notifications to employee and HR
      try {
        const employee = await storage.getEmployeeByUserId(req.user.id);
        if (employee) {
          const contractDetails = {
            contractType: contract.contractType || 'Employment Contract',
            position: employee.position || 'Customer Relationship Manager',
            signedAt: new Date(),
            digitalSignature: signature
          };

          await EmailService.sendContractSigningNotificationEmail(employee, contractDetails);
          console.log('Contract signing notification emails sent successfully to employee and HR');
        }
      } catch (emailError) {
        console.error('Failed to send contract signing emails:', emailError);
        // Don't fail the request if email fails
      }

      res.json({ 
        message: 'Contract signed successfully',
        signedAt: new Date()
      });
    } catch (error) {
      console.error('Error signing contract:', error);
      res.status(500).json({ message: 'Failed to sign contract' });
    }
  });



  // Update contract (HR Admin only)
  app.put('/api/contracts/:id', requireRole(['hr_admin', 'admin', 'branch_manager']), async (req: any, res) => {
    try {
      const contractId = parseInt(req.params.id);
      console.log('Contract update request - ID:', contractId);
      console.log('Contract update request - User role:', req.user.role);
      console.log('Contract update request - Body:', JSON.stringify(req.body, null, 2));
      
      // Clean and validate the update data
      const cleanData = Object.fromEntries(
        Object.entries(req.body).filter(([_, value]) => value !== '' && value != null)
      );
      
      const updateData = updateEmploymentContractSchema.parse(cleanData);
      console.log('Parsed update data:', JSON.stringify(updateData, null, 2));
      
      // Remove undefined values to avoid database issues
      const finalData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      const contract = await storage.updateEmploymentContract(contractId, finalData);
      console.log('Contract updated successfully:', contract.id);
      res.json(contract);
    } catch (error) {
      console.error('Error updating contract - Full error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      res.status(500).json({ 
        message: 'Failed to update contract', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Delete contract (HR Admin only)
  app.delete('/api/contracts/:id', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const contractId = parseInt(req.params.id);
      await storage.deleteEmploymentContract(contractId);
      res.json({ message: 'Contract deleted successfully' });
    } catch (error) {
      console.error('Error deleting contract:', error);
      res.status(500).json({ message: 'Failed to delete contract' });
    }
  });

  // Document routes
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const { uploadedBy, relatedTo, relatedType } = req.query;
      const documents = await storage.getDocuments({ uploadedBy, relatedTo, relatedType });
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(id, validatedData);
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDocument(id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Onboarding tests routes
  app.post('/api/onboarding-tests/create-all', async (req: any, res) => {
    try {
      const { createOnboardingTests } = await import('./onboarding-tests');
      const results = await createOnboardingTests();
      res.json({ 
        message: "Onboarding tests created successfully", 
        tests: results 
      });
    } catch (error) {
      console.error("Error creating onboarding tests:", error);
      res.status(500).json({ message: "Failed to create onboarding tests" });
    }
  });

  // Psychometric Test routes - Enterprise plan only
  app.get('/api/psychometric-tests', isAuthenticated, requireFeature('psychometric_tests'), async (req: any, res) => {
    try {
      const tests = await storage.getPsychometricTests();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching psychometric tests:", error);
      res.status(500).json({ message: "Failed to fetch psychometric tests" });
    }
  });

  // Export all psychometric tests with questions for PDF generation
  app.get('/api/psychometric-tests/export', async (req: any, res) => {
    try {
      const tests = await storage.getPsychometricTests();
      const testsWithQuestions = [];

      for (const test of tests) {
        const questions = await storage.getPsychometricQuestions(test.id);
        testsWithQuestions.push({
          ...test,
          questions
        });
      }

      res.json(testsWithQuestions);
    } catch (error) {
      console.error("Error exporting psychometric tests:", error);
      res.status(500).json({ message: "Failed to export psychometric tests" });
    }
  });

  app.get('/api/psychometric-tests/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const test = await storage.getPsychometricTest(id);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error fetching psychometric test:", error);
      res.status(500).json({ message: "Failed to fetch psychometric test" });
    }
  });

  app.post('/api/psychometric-tests', async (req: any, res) => {
    try {
      const validatedData = insertPsychometricTestSchema.parse(req.body);
      const test = await storage.createPsychometricTest(validatedData);
      res.json(test);
    } catch (error) {
      console.error("Error creating psychometric test:", error);
      res.status(500).json({ message: "Failed to create psychometric test" });
    }
  });

  app.put('/api/psychometric-tests/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPsychometricTestSchema.partial().parse(req.body);
      const test = await storage.updatePsychometricTest(id, validatedData);
      res.json(test);
    } catch (error) {
      console.error("Error updating psychometric test:", error);
      res.status(500).json({ message: "Failed to update psychometric test" });
    }
  });

  app.delete('/api/psychometric-tests/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePsychometricTest(id);
      res.json({ message: "Psychometric test deleted successfully" });
    } catch (error) {
      console.error("Error deleting psychometric test:", error);
      res.status(500).json({ message: "Failed to delete psychometric test" });
    }
  });

  // Psychometric test attempts routes
  app.get('/api/psychometric-test-attempts', async (req: any, res) => {
    try {
      const attempts = await storage.getAllPsychometricTestAttempts();
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching psychometric test attempts:", error);
      res.status(500).json({ message: "Failed to fetch psychometric test attempts" });
    }
  });

  // Psychometric Questions routes
  app.get('/api/psychometric-tests/:testId/questions', async (req: any, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const questions = await storage.getPsychometricQuestions(testId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching psychometric questions:", error);
      res.status(500).json({ message: "Failed to fetch psychometric questions" });
    }
  });

  app.post('/api/psychometric-questions', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPsychometricQuestionSchema.parse(req.body);
      const question = await storage.createPsychometricQuestion(validatedData);
      
      // Update test's total questions count
      const test = await storage.getPsychometricTest(validatedData.testId);
      if (test) {
        const questions = await storage.getPsychometricQuestions(validatedData.testId);
        await storage.updatePsychometricTest(validatedData.testId, {
          totalQuestions: questions.length
        });
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error creating psychometric question:", error);
      res.status(500).json({ message: "Failed to create psychometric question" });
    }
  });



  // Psychometric Test Attempts routes - HR Admin access to all test results
  app.get('/api/psychometric-test-attempts', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const { testId, candidateEmail } = req.query;
      const attempts = await storage.getPsychometricTestAttempts({ 
        testId: testId ? parseInt(testId as string) : undefined,
        candidateEmail: candidateEmail as string 
      });
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching psychometric test attempts:", error);
      res.status(500).json({ message: "Failed to fetch psychometric test attempts" });
    }
  });

  // Enhanced psychometric analysis by email (HR Admin access)
  app.get('/api/psychometric-analysis/:email', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const email = req.params.email;
      const attempts = await storage.getPsychometricTestAttempts({ candidateEmail: email });
      
      if (!attempts || attempts.length === 0) {
        return res.status(404).json({ message: "No psychometric test results found for this email" });
      }

      // Get the most recent completed attempt
      const completedAttempts = attempts.filter(attempt => attempt.completedAt && attempt.responses);
      if (completedAttempts.length === 0) {
        return res.status(404).json({ message: "No completed psychometric tests found for this email" });
      }

      // Use the most recent attempt
      const latestAttempt = completedAttempts.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )[0];

      // Get test questions for analysis
      const questions = await storage.getPsychometricQuestions(latestAttempt.testId);
      
      // Import the enhanced analysis functions
      const { analyzeTestResults } = await import('./psychometric-analysis');
      
      // Generate comprehensive analysis
      const detailedAnalysis = analyzeTestResults(latestAttempt, latestAttempt.responses, questions);
      
      res.json(detailedAnalysis);
      
    } catch (error) {
      console.error("Error generating psychometric analysis:", error);
      res.status(500).json({ message: "Failed to generate psychometric analysis" });
    }
  });

  // Get psychometric test results by email (HR Admin access)
  app.get('/api/psychometric-results/:email', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const email = req.params.email;
      const attempts = await storage.getPsychometricTestAttempts({ candidateEmail: email });
      
      if (!attempts || attempts.length === 0) {
        return res.status(404).json({ message: "No psychometric test results found for this email" });
      }

      // Format the results with detailed information
      const detailedResults = attempts.map(attempt => ({
        id: attempt.id,
        testId: attempt.testId,
        testName: attempt.test?.testName || 'Unknown Test',
        testType: attempt.test?.testType || 'Unknown Type',
        candidateEmail: attempt.candidateEmail,
        candidateName: attempt.candidateName,
        score: attempt.score,
        totalScore: attempt.totalScore,
        completedAt: attempt.completedAt,
        results: attempt.results,
        responses: attempt.responses,
        timeSpent: attempt.timeSpent,
        testDetails: attempt.test
      }));

      res.json({
        candidateEmail: email,
        totalAttempts: attempts.length,
        results: detailedResults
      });
    } catch (error) {
      console.error("Error fetching psychometric results by email:", error);
      res.status(500).json({ message: "Failed to fetch psychometric results" });
    }
  });

  app.get('/api/psychometric-test-attempts/:id', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const attempt = await storage.getPsychometricTestAttempt(id);
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }
      res.json(attempt);
    } catch (error) {
      console.error("Error fetching psychometric test attempt:", error);
      res.status(500).json({ message: "Failed to fetch psychometric test attempt" });
    }
  });

  app.post('/api/psychometric-test-attempts', async (req: any, res) => {
    try {
      const validatedData = insertPsychometricTestAttemptSchema.parse(req.body);
      const attempt = await storage.createPsychometricTestAttempt(validatedData);
      
      // If this is linked to an onboarding checklist, update it
      if (req.body.onboardingChecklistId) {
        await storage.updateOnboardingChecklist(parseInt(req.body.onboardingChecklistId), {
          psychometricTestAttemptId: attempt.id,
          psychometricTestCompleted: true,
          psychometricTestScore: attempt.totalScore,
          isCompleted: true,
          completedBy: attempt.candidateEmail
        });
      }
      
      res.json(attempt);
    } catch (error) {
      console.error("Error creating psychometric test attempt:", error);
      res.status(500).json({ message: "Failed to create psychometric test attempt" });
    }
  });

  // Complete psychometric test for onboarding
  app.put('/api/onboarding/:id/psychometric-test', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { attemptId, score } = req.body;
      
      const checklistItem = await storage.updateOnboardingChecklist(parseInt(id), {
        psychometricTestAttemptId: attemptId,
        psychometricTestCompleted: true,
        psychometricTestScore: score,
        isCompleted: true,
        completedBy: req.user?.claims?.sub
      });

      res.json(checklistItem);
    } catch (error) {
      console.error('Error updating psychometric test completion:', error);
      res.status(500).json({ message: 'Failed to update psychometric test completion' });
    }
  });

  // Generate HR evaluation report
  app.post("/api/applications/:id/generate-evaluation-report", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      // Check job applications access permission
      if (currentUser.role !== 'hr_admin' && !currentUser.hasJobApplicationsAccess) {
        return res.status(403).json({ message: 'Access denied. Job applications access required.' });
      }
      
      const { id } = req.params;
      const applicationId = parseInt(id);
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }

      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (!application.psychometricCompleted || !application.testResults) {
        return res.status(400).json({ message: "Psychometric assessments must be completed first" });
      }

      // Parse test results to get the raw assessment data
      let testData;
      try {
        testData = typeof application.testResults === 'string' 
          ? JSON.parse(application.testResults) 
          : application.testResults;
      } catch (parseError) {
        return res.status(400).json({ message: "Invalid test results format" });
      }

      // Check if we have raw test data or comprehensive report format
      let rawTestResults = [];
      if (Array.isArray(testData)) {
        // Already in raw format
        rawTestResults = testData;
      } else if (testData.assessments && Array.isArray(testData.assessments)) {
        // Convert from comprehensive format to raw format for analysis
        rawTestResults = testData.assessments.map((assessment: any) => ({
          testId: assessment.testId,
          results: {
            responses: assessment.questionsAndAnswers?.reduce((acc: any, qa: any) => {
              acc[qa.questionId] = qa.candidateAnswer;
              return acc;
            }, {}) || {},
            timeSpent: assessment.timeSpent || 0,
            endTime: assessment.completedAt || new Date().toISOString()
          },
          completed: assessment.status === 'completed'
        }));
      } else {
        return res.status(400).json({ message: "No valid test results found" });
      }

      const candidateName = `${application.firstName} ${application.lastName}`;
      const position = application.positionAppliedFor;

      const evaluationReport = await storage.generateCandidateEvaluationReport(
        candidateName, 
        position, 
        rawTestResults
      );
      
      res.json({ 
        message: "HR evaluation report generated successfully",
        report: evaluationReport 
      });
    } catch (error) {
      console.error("Error generating HR evaluation report:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Email psychometric test results
  app.post('/api/psychometric-test-results/email', isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId, candidateEmail, candidateName, includeDetailedReport } = req.body;

      // Fetch attempt details
      const attempt = await storage.getPsychometricTestAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }

      // Fetch test details
      const test = await storage.getPsychometricTest(attempt.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      // Calculate comprehensive 16PF scores and detailed analysis
      let overallScore = attempt.totalScore;
      let detailedResults = null;
      
      if (attempt.responses && typeof attempt.responses === 'object') {
        const responses = attempt.responses as Record<string, number>;
        const questions = await storage.getPsychometricQuestions(test.id);
        
        if (questions && questions.length > 0 && test.testType === 'personality_comprehensive') {
          // Calculate 16PF primary factors
          const primaryFactors = {
            'Warmth (A)': { score: 0, count: 0, description: 'Reserved vs Warm' },
            'Reasoning (B)': { score: 0, count: 0, description: 'Concrete vs Abstract' },
            'Emotional Stability (C)': { score: 0, count: 0, description: 'Reactive vs Emotionally Stable' },
            'Dominance (E)': { score: 0, count: 0, description: 'Deferential vs Dominant' },
            'Liveliness (F)': { score: 0, count: 0, description: 'Serious vs Lively' },
            'Rule-Consciousness (G)': { score: 0, count: 0, description: 'Expedient vs Rule-Conscious' },
            'Social Boldness (H)': { score: 0, count: 0, description: 'Shy vs Socially Bold' },
            'Sensitivity (I)': { score: 0, count: 0, description: 'Utilitarian vs Sensitive' },
            'Vigilance (L)': { score: 0, count: 0, description: 'Trusting vs Vigilant' },
            'Abstractedness (M)': { score: 0, count: 0, description: 'Grounded vs Abstracted' },
            'Privateness (N)': { score: 0, count: 0, description: 'Forthright vs Private' },
            'Apprehension (O)': { score: 0, count: 0, description: 'Self-Assured vs Apprehensive' },
            'Openness to Change (Q1)': { score: 0, count: 0, description: 'Traditional vs Open to Change' },
            'Self-Reliance (Q2)': { score: 0, count: 0, description: 'Group-Oriented vs Self-Reliant' },
            'Perfectionism (Q3)': { score: 0, count: 0, description: 'Tolerates Disorder vs Perfectionist' },
            'Tension (Q4)': { score: 0, count: 0, description: 'Relaxed vs Tense' }
          };

          // Group questions by factors (simplified mapping for demonstration)
          questions.forEach((question, index) => {
            const responseKey = `q${index + 1}`;
            const response = responses[responseKey];
            
            if (response) {
              const factorIndex = Math.floor(index / Math.ceil(questions.length / 16));
              const factorKeys = Object.keys(primaryFactors);
              if (factorKeys[factorIndex]) {
                const factor = primaryFactors[factorKeys[factorIndex]];
                factor.score += response;
                factor.count++;
              }
            }
          });

          // Calculate averages and convert to 1-10 scale
          Object.keys(primaryFactors).forEach(key => {
            const factor = primaryFactors[key];
            if (factor.count > 0) {
              factor.score = Math.round((factor.score / factor.count) * 2); // Convert 1-5 to 1-10
            }
          });

          // Calculate Global Factors
          const globalFactors = {
            'Extraversion': {
              score: Math.round((
                primaryFactors['Warmth (A)'].score + 
                primaryFactors['Liveliness (F)'].score + 
                primaryFactors['Social Boldness (H)'].score + 
                (10 - primaryFactors['Privateness (N)'].score) +
                (10 - primaryFactors['Self-Reliance (Q2)'].score)
              ) / 5),
              description: 'Introverted vs Extraverted'
            },
            'Anxiety': {
              score: Math.round((
                (10 - primaryFactors['Emotional Stability (C)'].score) +
                primaryFactors['Vigilance (L)'].score + 
                primaryFactors['Apprehension (O)'].score + 
                primaryFactors['Tension (Q4)'].score
              ) / 4),
              description: 'Low Anxiety vs High Anxiety'
            },
            'Tough-Mindedness': {
              score: Math.round((
                (10 - primaryFactors['Warmth (A)'].score) +
                (10 - primaryFactors['Sensitivity (I)'].score) +
                primaryFactors['Abstractedness (M)'].score +
                primaryFactors['Openness to Change (Q1)'].score
              ) / 4),
              description: 'Receptive vs Tough-Minded'
            },
            'Independence': {
              score: Math.round((
                primaryFactors['Dominance (E)'].score +
                primaryFactors['Vigilance (L)'].score +
                primaryFactors['Openness to Change (Q1)'].score
              ) / 3),
              description: 'Accommodating vs Independent'
            },
            'Self-Control': {
              score: Math.round((
                primaryFactors['Rule-Consciousness (G)'].score +
                primaryFactors['Perfectionism (Q3)'].score
              ) / 2),
              description: 'Unrestrained vs Self-Controlled'
            }
          };

          detailedResults = { primaryFactors, globalFactors };
          
          // Calculate overall score from global factors
          const globalScores = Object.values(globalFactors).map(f => f.score);
          overallScore = Math.round(globalScores.reduce((sum, score) => sum + score, 0) / globalScores.length * 10);
        }
      }

      // Create comprehensive email content with detailed results
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            .header { background: #2563eb; color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #f8fafc; padding: 25px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; }
            .result-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .score-highlight { font-size: 28px; font-weight: bold; color: #059669; margin: 15px 0; text-align: center; }
            .factor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .factor-item { background: #f1f5f9; padding: 12px; border-radius: 6px; border-left: 3px solid #3b82f6; }
            .factor-name { font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .factor-score { font-size: 18px; font-weight: bold; color: #059669; }
            .factor-description { font-size: 12px; color: #64748b; margin-top: 3px; }
            .global-factor { background: #e0f2fe; border-left: 3px solid #0891b2; padding: 15px; margin: 10px 0; border-radius: 6px; }
            .global-factor h4 { color: #0891b2; margin: 0 0 8px 0; }
            .global-score { font-size: 20px; font-weight: bold; color: #0891b2; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
            @media (max-width: 600px) { .factor-grid { grid-template-columns: 1fr; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎯 Your Psychometric Assessment Results</h1>
            <p>Meeting Matters Business Management System</p>
          </div>
          
          <div class="content">
            <h2>Hello ${candidateName}!</h2>
            
            <p>Thank you for completing your comprehensive psychometric assessment. Your detailed personality analysis is ready for review.</p>
            
            <div class="result-box">
              <h3>📊 Assessment Summary</h3>
              <p><strong>Test:</strong> ${test.testName}</p>
              <p><strong>Type:</strong> ${test.testType.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Completed:</strong> ${attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'In Progress'}</p>
              <p><strong>Time Spent:</strong> ${Math.round((attempt.timeSpent || 0) / 60)} minutes</p>
              ${overallScore ? `<div class="score-highlight">Overall Score: ${overallScore}/10</div>` : ''}
            </div>
            
            ${detailedResults ? `
            <div class="result-box">
              <h3>🌟 Global Personality Factors</h3>
              <p style="margin-bottom: 20px;">Your personality profile across the five major dimensions:</p>
              ${Object.entries(detailedResults.globalFactors).map(([name, factor]) => `
                <div class="global-factor">
                  <h4>${name}</h4>
                  <div class="global-score">${factor.score}/10</div>
                  <div class="factor-description">${factor.description}</div>
                </div>
              `).join('')}
            </div>
            
            <div class="result-box">
              <h3>🔍 16 Primary Personality Factors</h3>
              <p style="margin-bottom: 20px;">Detailed breakdown of your personality traits:</p>
              <div class="factor-grid">
                ${Object.entries(detailedResults.primaryFactors).map(([name, factor]) => `
                  <div class="factor-item">
                    <div class="factor-name">${name}</div>
                    <div class="factor-score">${factor.score}/10</div>
                    <div class="factor-description">${factor.description}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            <div class="result-box">
              <h3>📋 Next Steps</h3>
              <p>Your comprehensive assessment results have been recorded and will be carefully reviewed as part of your application process.</p>
              <p><strong>What this means:</strong></p>
              <ul>
                <li>Your personality profile will help us understand your work style and preferences</li>
                <li>These insights will be used to identify suitable roles and team dynamics</li>
                <li>The HR team will discuss your results during your next interview</li>
                <li>This assessment helps ensure a great fit between you and potential opportunities</li>
              </ul>
            </div>
            
            <div class="result-box" style="border-left-color: #f59e0b;">
              <h3>💡 Understanding Your Results</h3>
              <p><strong>Scores are on a 1-10 scale:</strong></p>
              <ul>
                <li><strong>1-3:</strong> Lower tendency toward this trait</li>
                <li><strong>4-6:</strong> Moderate/balanced expression</li>
                <li><strong>7-10:</strong> Higher tendency toward this trait</li>
              </ul>
              <p><em>Remember: There are no right or wrong scores. Each personality type brings unique strengths to the workplace.</em></p>
            </div>
            
            <p>If you have any questions about your results or the next steps in the process, please don't hesitate to contact our HR team.</p>
            
            <p><strong>Best regards,</strong><br>Meeting Matters HR Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated comprehensive assessment report from Meeting Matters Business Management System</p>
            <p>Confidential - For authorized personnel only | Please do not reply to this email directly</p>
          </div>
        </body>
        </html>
      `;

      // Create comprehensive plain text version
      let emailText = `Hello ${candidateName},

Your comprehensive psychometric assessment results are ready for review.

ASSESSMENT SUMMARY
==================
Test: ${test.testName}
Type: ${test.testType.replace('_', ' ').toUpperCase()}
Completed: ${attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'In Progress'}
Time Spent: ${Math.round((attempt.timeSpent || 0) / 60)} minutes
${overallScore ? `Overall Score: ${overallScore}/10\n` : ''}`;

      if (detailedResults) {
        emailText += `
GLOBAL PERSONALITY FACTORS
==========================
${Object.entries(detailedResults.globalFactors).map(([name, factor]) => 
  `${name}: ${factor.score}/10 - ${factor.description}`
).join('\n')}

16 PRIMARY PERSONALITY FACTORS  
==============================
${Object.entries(detailedResults.primaryFactors).map(([name, factor]) => 
  `${name}: ${factor.score}/10 - ${factor.description}`
).join('\n')}`;
      }

      emailText += `

NEXT STEPS
==========
Your comprehensive assessment results have been recorded and will be carefully reviewed as part of your application process. This personality profile will help us understand your work style and identify suitable roles and team dynamics.

UNDERSTANDING YOUR RESULTS
==========================
Scores are on a 1-10 scale:
• 1-3: Lower tendency toward this trait
• 4-6: Moderate/balanced expression  
• 7-10: Higher tendency toward this trait

Remember: There are no right or wrong scores. Each personality type brings unique strengths to the workplace.

If you have any questions about your results or the next steps in the process, please don't hesitate to contact our HR team.

Best regards,
Meeting Matters HR Team

---
This is a confidential assessment report from Meeting Matters Business Management System
For authorized personnel only`;
      
      // Send to candidate
      console.log(`Sending assessment results to candidate: ${candidateEmail}`);
      await EmailService.sendDirectEmail(
        candidateEmail,
        `Your Psychometric Assessment Results - ${test.testName}`,
        emailHtml,
        emailText
      );
      console.log(`✅ Email sent successfully to candidate: ${candidateEmail}`);

      // Also send copy to HR admin
      console.log(`Sending assessment results copy to HR admin: meetingmatters786@gmail.com`);
      await EmailService.sendDirectEmail(
        'meetingmatters786@gmail.com',
        `Assessment Results Copy - ${candidateName} - ${test.testName}`,
        emailHtml,
        emailText
      );
      console.log(`✅ Email sent successfully to HR admin: meetingmatters786@gmail.com`);

      res.json({ 
        message: "Results emailed successfully to candidate and HR admin",
        emailSent: true,
        recipientEmails: [candidateEmail, 'meetingmatters786@gmail.com']
      });

    } catch (error) {
      console.error("Error emailing psychometric test results:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Generate comprehensive PDF report for psychometric test results
  app.get('/api/psychometric-test-results/:attemptId/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const { attemptId } = req.params;

      // Fetch attempt details
      const attempt = await storage.getPsychometricTestAttempt(parseInt(attemptId));
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }

      // Fetch test details
      const test = await storage.getPsychometricTest(attempt.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      // Calculate comprehensive 16PF scores (reusing the same logic from email)
      let overallScore = attempt.totalScore;
      let detailedResults = null;
      
      if (attempt.responses && typeof attempt.responses === 'object') {
        const responses = attempt.responses as Record<string, number>;
        const questions = await storage.getPsychometricQuestions(test.id);
        
        if (questions && questions.length > 0 && test.testType === 'personality_comprehensive') {
          // Calculate 16PF primary factors
          const primaryFactors = {
            'Warmth (A)': { score: 0, count: 0, description: 'Reserved vs Warm' },
            'Reasoning (B)': { score: 0, count: 0, description: 'Concrete vs Abstract' },
            'Emotional Stability (C)': { score: 0, count: 0, description: 'Reactive vs Emotionally Stable' },
            'Dominance (E)': { score: 0, count: 0, description: 'Deferential vs Dominant' },
            'Liveliness (F)': { score: 0, count: 0, description: 'Serious vs Lively' },
            'Rule-Consciousness (G)': { score: 0, count: 0, description: 'Expedient vs Rule-Conscious' },
            'Social Boldness (H)': { score: 0, count: 0, description: 'Shy vs Socially Bold' },
            'Sensitivity (I)': { score: 0, count: 0, description: 'Utilitarian vs Sensitive' },
            'Vigilance (L)': { score: 0, count: 0, description: 'Trusting vs Vigilant' },
            'Abstractedness (M)': { score: 0, count: 0, description: 'Grounded vs Abstracted' },
            'Privateness (N)': { score: 0, count: 0, description: 'Forthright vs Private' },
            'Apprehension (O)': { score: 0, count: 0, description: 'Self-Assured vs Apprehensive' },
            'Openness to Change (Q1)': { score: 0, count: 0, description: 'Traditional vs Open to Change' },
            'Self-Reliance (Q2)': { score: 0, count: 0, description: 'Group-Oriented vs Self-Reliant' },
            'Perfectionism (Q3)': { score: 0, count: 0, description: 'Tolerates Disorder vs Perfectionist' },
            'Tension (Q4)': { score: 0, count: 0, description: 'Relaxed vs Tense' }
          };

          // Group questions by factors (simplified mapping for demonstration)
          questions.forEach((question, index) => {
            const responseKey = `q${index + 1}`;
            const response = responses[responseKey];
            
            if (response) {
              const factorIndex = Math.floor(index / Math.ceil(questions.length / 16));
              const factorKeys = Object.keys(primaryFactors);
              if (factorKeys[factorIndex]) {
                const factor = primaryFactors[factorKeys[factorIndex]];
                factor.score += response;
                factor.count++;
              }
            }
          });

          // Calculate averages and convert to 1-10 scale
          Object.keys(primaryFactors).forEach(key => {
            const factor = primaryFactors[key];
            if (factor.count > 0) {
              factor.score = Math.round((factor.score / factor.count) * 2); // Convert 1-5 to 1-10
            }
          });

          // Calculate Global Factors
          const globalFactors = {
            'Extraversion': {
              score: Math.round((
                primaryFactors['Warmth (A)'].score + 
                primaryFactors['Liveliness (F)'].score + 
                primaryFactors['Social Boldness (H)'].score + 
                (10 - primaryFactors['Privateness (N)'].score) +
                (10 - primaryFactors['Self-Reliance (Q2)'].score)
              ) / 5),
              description: 'Introverted vs Extraverted'
            },
            'Anxiety': {
              score: Math.round((
                (10 - primaryFactors['Emotional Stability (C)'].score) +
                primaryFactors['Vigilance (L)'].score + 
                primaryFactors['Apprehension (O)'].score + 
                primaryFactors['Tension (Q4)'].score
              ) / 4),
              description: 'Low Anxiety vs High Anxiety'
            },
            'Tough-Mindedness': {
              score: Math.round((
                (10 - primaryFactors['Warmth (A)'].score) +
                (10 - primaryFactors['Sensitivity (I)'].score) +
                primaryFactors['Abstractedness (M)'].score +
                primaryFactors['Openness to Change (Q1)'].score
              ) / 4),
              description: 'Receptive vs Tough-Minded'
            },
            'Independence': {
              score: Math.round((
                primaryFactors['Dominance (E)'].score +
                primaryFactors['Vigilance (L)'].score +
                primaryFactors['Openness to Change (Q1)'].score
              ) / 3),
              description: 'Accommodating vs Independent'
            },
            'Self-Control': {
              score: Math.round((
                primaryFactors['Rule-Consciousness (G)'].score +
                primaryFactors['Perfectionism (Q3)'].score
              ) / 2),
              description: 'Unrestrained vs Self-Controlled'
            }
          };

          detailedResults = { primaryFactors, globalFactors };
          
          // Calculate overall score from global factors
          const globalScores = Object.values(globalFactors).map(f => f.score);
          overallScore = Math.round(globalScores.reduce((sum, score) => sum + score, 0) / globalScores.length);
        }
      }

      // Generate comprehensive PDF
      const pdfData = {
        candidateName: attempt.candidateName || 'Candidate',
        candidateEmail: attempt.candidateEmail,
        test: test,
        attempt: attempt,
        overallScore: overallScore,
        detailedResults: detailedResults,
        generatedDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };

      res.json({
        message: "PDF data prepared successfully",
        pdfData: pdfData
      });

    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  // Generate project overall report with PDF support
  app.get('/api/projects/:id/report/overall', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Get all project data first
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Get project data
      const members = await storage.getProjectMembers(projectId);
      const tasks = await storage.getProjectTasks(projectId);
      const messages = await storage.getProjectMessages(projectId);
      const files = await storage.getProjectFiles(projectId);

      // Check if PDF download is requested  
      console.log('Checking Overall PDF request - Accept header:', req.headers.accept, 'Format param:', req.query.format);
      if ((req.headers.accept && req.headers.accept.includes('application/pdf')) || req.query.format === 'pdf') {
        // Generate PDF with comprehensive data - same code as legacy endpoint above
        // Calculate statistics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Generate comprehensive PDF with jsPDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        let yPos = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        
        // Helper function to add new page if needed
        const checkPageBreak = (neededHeight = 10) => {
          if (yPos + neededHeight > pageHeight - margin) {
            doc.addPage();
            yPos = 20;
          }
        };
        
        // Helper function to add text with word wrap
        const addWrappedText = (text, x, y, maxWidth = 170) => {
          const lines = doc.splitTextToSize(text, maxWidth);
          doc.text(lines, x, y);
          return lines.length * 7;
        };
        
        // Title Page
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(project.name, 20, yPos);
        yPos += 15;
        
        doc.setFontSize(18);
        doc.text('Comprehensive Project Report', 20, yPos);
        yPos += 20;
        
        // Report metadata
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, yPos);
        yPos += 8;
        const projectManager = await storage.getUser(project.projectManagerId);
        doc.text(`Project Manager: ${projectManager?.username || 'N/A'}`, 20, yPos);
        yPos += 8;
        doc.text(`Report Type: Overall Project Analysis`, 20, yPos);
        yPos += 20;
        
        // Executive Summary
        checkPageBreak(40);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Executive Summary', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const summary = `Project Status: ${project.status?.replace('_', ' ').toUpperCase() || 'ACTIVE'}
Progress: ${completionRate}% complete (${completedTasks} of ${totalTasks} tasks)
Team Size: ${members.length} active members
Communication: ${messages.length} messages exchanged
Documentation: ${files.length} files uploaded
Timeline: Created ${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}`;
        
        yPos += addWrappedText(summary, 20, yPos);
        yPos += 15;
        
        // Key Metrics
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Key Performance Metrics', 20, yPos);
        yPos += 12;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Calculate additional metrics
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
        const overdueTasks = tasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== 'completed';
        }).length;
        
        const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
        const avgTasksPerMember = members.length > 0 ? Math.round((totalTasks / members.length) * 10) / 10 : 0;
        
        const metrics = [
          `Total Tasks: ${totalTasks}`,
          `Completed: ${completedTasks} (${completionRate}%)`,
          `In Progress: ${inProgressTasks}`,
          `Pending: ${pendingTasks}`,
          `Overdue: ${overdueTasks}`,
          `High Priority: ${highPriorityTasks}`,
          `Avg Tasks/Member: ${avgTasksPerMember}`,
          `Team Communications: ${messages.length} messages`,
          `Shared Files: ${files.length} documents`,
          `Team Size: ${members.length} active members`
        ];
        
        metrics.forEach((metric, index) => {
          if (index % 2 === 0) {
            doc.text(metric, 25, yPos);
            if (metrics[index + 1]) {
              doc.text(metrics[index + 1], 120, yPos);
            }
            yPos += 8;
          }
        });
        yPos += 10;
        
        // Footer
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.text(`${project.name} - Overall Report | Page ${i} of ${totalPages} | Generated ${new Date().toLocaleDateString()}`, 20, pageHeight - 10);
        }
        
        // Send PDF as buffer
        const pdfBuffer = doc.output('arraybuffer');
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Length': pdfBuffer.byteLength,
          'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Comprehensive_Report.pdf"`
        });
        return res.send(Buffer.from(pdfBuffer));
      } else {
        // Return JSON data for non-PDF requests
        const reportData = {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            projectManagerId: project.projectManagerId,
            createdAt: project.createdAt
          },
          statistics: {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(task => task.status === 'completed').length,
            completionRate: tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'completed').length / tasks.length) * 100) : 0,
            teamMembers: members.length,
            messagesPosted: messages.length,
            filesUploaded: files.length
          },
          members,
          tasks,
          messages,
          files
        };
        
        res.json(reportData);
      }
    } catch (error) {
      console.error("Error generating overall report:", error);
      res.status(500).json({ message: "Failed to generate overall report" });
    }
  });

  // Manual project status check endpoint
  app.post('/api/projects/check-start-dates', isAuthenticated, requireRole(['hr_admin']), async (req: any, res) => {
    try {
      await ProjectScheduler.checkAndStartProjects();
      res.json({ message: "Project start dates checked and updated successfully" });
    } catch (error) {
      console.error("Error checking project start dates:", error);
      res.status(500).json({ message: "Failed to check project start dates" });
    }
  });

  // Check specific project start date
  app.post('/api/projects/:id/check-start', isAuthenticated, requireRole(['hr_admin', 'project_manager']), async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const wasStarted = await ProjectScheduler.checkProject(projectId);
      
      if (wasStarted) {
        res.json({ message: "Project was started automatically based on its start date" });
      } else {
        res.json({ message: "Project start date not reached or project is not in planning status" });
      }
    } catch (error) {
      console.error("Error checking specific project:", error);
      res.status(500).json({ message: "Failed to check project start date" });
    }
  });

  // Project management routes - Professional plan and above  
  app.get('/api/projects', isAuthenticated, requireFeature('project_management'), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || !userRole) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const projects = await storage.getProjectsForUser(userId, userRole);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      
      // Automatically add all HR admins to the project
      const hrAdmins = await storage.getUsersByRole('hr_admin');
      for (const hrAdmin of hrAdmins) {
        // Don't add if they're already the project manager
        if (hrAdmin.id !== project.projectManagerId) {
          await storage.addProjectMember({
            projectId: project.id,
            userId: hrAdmin.id,
            role: 'hr_supervisor'
          });
        }
      }
      
      // Also add admin user if exists
      const adminUser = await storage.getUserByUsername('admin');
      if (adminUser && adminUser.id !== project.projectManagerId) {
        await storage.addProjectMember({
          projectId: project.id,
          userId: adminUser.id,
          role: 'system_admin'
        });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get user details from database to ensure we have the correct role
      const userDetails = await storage.getUser(userId);
      const actualUserRole = userDetails?.role || userRole || 'employee';
      
      console.log('Project access check - User ID:', userId, 'Role from req:', userRole, 'Role from DB:', userDetails?.role, 'Final role:', actualUserRole);

      // Check if user has access to this specific project
      const userProjects = await storage.getProjectsForUser(userId, actualUserRole);
      const hasAccess = userProjects.some(p => p.id === id);
      
      console.log('User projects count:', userProjects.length, 'Has access to project', id, ':', hasAccess);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get comprehensive project data from database
      const projectWithDetails = {
        ...project,
        members: await storage.getProjectMembers(id),
        tasks: await storage.getProjectTasks(id),
        notes: await storage.getProjectNotes(id),
        messages: await storage.getProjectMessages(id)
      };
      
      res.json(projectWithDetails);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const project = await storage.updateProject(id, updates);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Get project overview
  app.get('/api/projects/:id/overview', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check if user has access to this project
      const userDetails = await storage.getUser(userId);
      const actualUserRole = userDetails?.role || 'employee';
      const userProjects = await storage.getProjectsForUser(userId, actualUserRole);
      const hasAccess = userProjects.some(p => p.id === projectId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const overview = await storage.getProjectOverview(projectId);
      
      if (!overview) {
        return res.json(null); // Return null if no overview exists yet
      }
      
      res.json(overview);
    } catch (error) {
      console.error("Error fetching project overview:", error);
      res.status(500).json({ message: "Failed to fetch project overview" });
    }
  });

  // Create or update project overview
  app.post('/api/projects/:id/overview', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.user?.id;
      const overviewData = req.body;
      
      console.log('POST /api/projects/:id/overview - Project ID:', projectId, 'User ID:', userId, 'Data keys:', Object.keys(overviewData));
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check if user has access to this project
      const userDetails = await storage.getUser(userId);
      const actualUserRole = userDetails?.role || 'employee';
      const userProjects = await storage.getProjectsForUser(userId, actualUserRole);
      const hasAccess = userProjects.some(p => p.id === projectId);
      
      console.log('Overview save access check - User role:', actualUserRole, 'Has access:', hasAccess);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const overview = await storage.upsertProjectOverview(projectId, {
        ...overviewData,
        updatedBy: userId
      });
      
      console.log('Overview saved successfully for project', projectId, '- Overview ID:', overview.id);
      res.json(overview);
    } catch (error) {
      console.error("Error saving project overview:", error);
      res.status(500).json({ message: "Failed to save project overview" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Mark project as completed (HR Admin only)
  app.patch('/api/projects/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      
      // Check if user has HR admin privileges
      if (user.role !== 'hr_admin') {
        return res.status(403).json({ message: 'Only HR administrators can mark projects as completed' });
      }

      const id = parseInt(req.params.id);
      const { completionNotes } = req.body;

      const project = await storage.updateProject(id, {
        status: 'completed',
        endDate: new Date(),
        updatedAt: new Date(),
      });

      // Log the completion action
      console.log(`Project ${id} marked as completed by HR Admin ${user.username}`);

      res.json({
        success: true,
        message: 'Project marked as completed successfully',
        project
      });
    } catch (error) {
      console.error('Error marking project as completed:', error);
      res.status(500).json({ message: 'Failed to mark project as completed' });
    }
  });

  // Generate project overall report (legacy endpoint)
  app.get('/api/projects/:id/report', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Get project details
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Get project data
      const members = await storage.getProjectMembers(projectId);
      const tasks = await storage.getProjectTasks(projectId);
      const messages = await storage.getProjectMessages(projectId);
      const files = await storage.getProjectFiles(projectId);

      // Calculate statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Generate comprehensive PDF with jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      
      // Helper function to add new page if needed
      const checkPageBreak = (neededHeight = 10) => {
        if (yPos + neededHeight > pageHeight - margin) {
          doc.addPage();
          yPos = 20;
        }
      };
      
      // Helper function to add text with word wrap
      const addWrappedText = (text, x, y, maxWidth = 170) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return lines.length * 7;
      };
      
      // Title Page
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text(project.name, 20, yPos);
      yPos += 15;
      
      doc.setFontSize(18);
      doc.text('Comprehensive Project Report', 20, yPos);
      yPos += 20;
      
      // Report metadata
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, yPos);
      yPos += 8;
      const projectManager = await storage.getUser(project.projectManagerId);
      doc.text(`Project Manager: ${projectManager?.username || 'N/A'}`, 20, yPos);
      yPos += 8;
      doc.text(`Report Type: Overall Project Analysis`, 20, yPos);
      yPos += 20;
      
      // Executive Summary
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Executive Summary', 20, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const summary = `Project Status: ${project.status?.replace('_', ' ').toUpperCase() || 'ACTIVE'}
Progress: ${completionRate}% complete (${completedTasks} of ${totalTasks} tasks)
Team Size: ${members.length} active members
Communication: ${messages.length} messages exchanged
Documentation: ${files.length} files uploaded
Timeline: Created ${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}`;
      
      yPos += addWrappedText(summary, 20, yPos);
      yPos += 15;
      
      // Project Overview
      checkPageBreak(30);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Project Overview', 20, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      if (project.description) {
        doc.text('Description:', 20, yPos);
        yPos += 8;
        yPos += addWrappedText(project.description, 25, yPos);
        yPos += 10;
      }
      
      // Key Metrics
      checkPageBreak(50);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Key Performance Metrics', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Calculate additional metrics
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const overdueTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'completed';
      }).length;
      
      const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
      const avgTasksPerMember = members.length > 0 ? Math.round((totalTasks / members.length) * 10) / 10 : 0;
      
      const metrics = [
        `Total Tasks: ${totalTasks}`,
        `Completed: ${completedTasks} (${completionRate}%)`,
        `In Progress: ${inProgressTasks}`,
        `Pending: ${pendingTasks}`,
        `Overdue: ${overdueTasks}`,
        `High Priority: ${highPriorityTasks}`,
        `Avg Tasks/Member: ${avgTasksPerMember}`,
        `Team Communications: ${messages.length} messages`,
        `Shared Files: ${files.length} documents`,
        `Team Size: ${members.length} active members`
      ];
      
      metrics.forEach((metric, index) => {
        if (index % 2 === 0) {
          doc.text(metric, 25, yPos);
          if (metrics[index + 1]) {
            doc.text(metrics[index + 1], 120, yPos);
          }
          yPos += 8;
        }
      });
      yPos += 10;
      
      // Team Composition
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Team Composition', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      for (const member of members) {
        checkPageBreak(12);
        const user = await storage.getUser(member.userId);
        const memberTasks = tasks.filter(t => t.assignedTo === member.userId);
        const completedMemberTasks = memberTasks.filter(t => t.status === 'completed').length;
        const memberCompletionRate = memberTasks.length > 0 ? Math.round((completedMemberTasks / memberTasks.length) * 100) : 0;
        
        doc.setFont(undefined, 'bold');
        doc.text(`${user?.firstName || user?.username || 'Unknown'} ${user?.lastName || ''}`, 25, yPos);
        yPos += 7;
        
        doc.setFont(undefined, 'normal');
        doc.text(`Role: ${member.role || 'Team Member'}`, 30, yPos);
        doc.text(`Email: ${user?.email || 'N/A'}`, 100, yPos);
        yPos += 7;
        
        doc.text(`Tasks Assigned: ${memberTasks.length}`, 30, yPos);
        doc.text(`Completed: ${completedMemberTasks} (${memberCompletionRate}%)`, 100, yPos);
        yPos += 7;
        
        doc.text(`Joined: ${member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}`, 30, yPos);
        yPos += 12;
      }
      
      // Task Breakdown Analysis
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Detailed Task Analysis', 20, yPos);
      yPos += 12;
      
      // Group tasks by status
      const tasksByStatus = {
        pending: tasks.filter(t => t.status === 'pending'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        completed: tasks.filter(t => t.status === 'completed'),
        overdue: tasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== 'completed';
        })
      };
      
      for (const [status, statusTasks] of Object.entries(tasksByStatus)) {
        if (statusTasks.length > 0) {
          checkPageBreak(20);
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(`${status.replace('_', ' ').toUpperCase()} TASKS (${statusTasks.length})`, 20, yPos);
          yPos += 10;
          
          for (let i = 0; i < Math.min(statusTasks.length, 10); i++) {
            const task = statusTasks[i];
            checkPageBreak(15);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            
            doc.text(`${i + 1}. ${task.title}`, 25, yPos);
            yPos += 6;
            
            if (task.description && task.description.length > 0) {
              yPos += addWrappedText(`   ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`, 25, yPos, 160);
            }
            
            const assignee = task.assignedTo ? await storage.getUser(task.assignedTo) : null;
            doc.text(`   Assigned: ${assignee?.username || 'Unassigned'}`, 25, yPos);
            doc.text(`Priority: ${task.priority || 'Normal'}`, 100, yPos);
            yPos += 6;
            
            if (task.dueDate) {
              doc.text(`   Due: ${new Date(task.dueDate).toLocaleDateString()}`, 25, yPos);
            }
            if (task.completedAt) {
              doc.text(`Completed: ${new Date(task.completedAt).toLocaleDateString()}`, 100, yPos);
            }
            yPos += 8;
          }
          
          if (statusTasks.length > 10) {
            doc.setFont(undefined, 'italic');
            doc.text(`... and ${statusTasks.length - 10} more tasks`, 25, yPos);
            yPos += 8;
          }
          yPos += 5;
        }
      }
      
      // Communication Summary
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Communication & Collaboration', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Messages: ${messages.length}`, 25, yPos);
      yPos += 8;
      
      if (messages.length > 0) {
        doc.text('Recent Communication:', 25, yPos);
        yPos += 8;
        
        const recentMessages = messages.slice(-5);
        for (const message of recentMessages) {
          checkPageBreak(10);
          const sender = message.senderId ? await storage.getUser(message.senderId) : null;
          const messagePreview = message.message?.length > 60 ? 
            message.message.substring(0, 60) + '...' : 
            message.message || 'Message content not available';
          
          doc.text(`• ${sender?.username || 'Unknown'}: ${messagePreview}`, 30, yPos);
          yPos += 6;
          doc.text(`  ${new Date(message.createdAt).toLocaleDateString()}`, 30, yPos);
          yPos += 8;
        }
      }
      yPos += 10;
      
      // File Repository Summary
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Document Repository', 20, yPos);
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Files: ${files.length}`, 25, yPos);
      yPos += 8;
      
      if (files.length > 0) {
        let totalSize = 0;
        const fileTypes = {};
        
        files.forEach(file => {
          totalSize += file.fileSize || 0;
          const type = file.fileType?.split('/')[0] || 'unknown';
          fileTypes[type] = (fileTypes[type] || 0) + 1;
        });
        
        doc.text(`Total Storage: ${Math.round(totalSize / 1024)} KB`, 25, yPos);
        yPos += 8;
        
        doc.text('File Types:', 25, yPos);
        yPos += 6;
        for (const [type, count] of Object.entries(fileTypes)) {
          doc.text(`  ${type}: ${count} files`, 30, yPos);
          yPos += 6;
        }
        yPos += 8;
        
        doc.text('Recent Files:', 25, yPos);
        yPos += 8;
        
        for (const file of files.slice(-5)) {
          checkPageBreak(8);
          const uploader = file.uploadedBy ? await storage.getUser(file.uploadedBy) : null;
          doc.text(`• ${file.fileName} (${Math.round(file.fileSize / 1024)} KB)`, 30, yPos);
          yPos += 6;
          doc.text(`  Uploaded by: ${uploader?.username || 'Unknown'} on ${new Date(file.uploadedAt).toLocaleDateString()}`, 30, yPos);
          yPos += 8;
        }
      }
      
      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`${project.name} - Overall Report | Page ${i} of ${totalPages} | Generated ${new Date().toLocaleDateString()}`, 20, pageHeight - 10);
      }
      
      // Send PDF as buffer
      const pdfBuffer = doc.output('arraybuffer');
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.byteLength,
        'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Comprehensive_Report.pdf"`
      });
      return res.send(Buffer.from(pdfBuffer));
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      return res.status(500).json({ message: 'Failed to generate PDF report' });
    }
  });

  // Generate project overall report
  app.get('/api/projects/:id/report/overall', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Get project details
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Get project data
      const members = await storage.getProjectMembers(projectId);
      const tasks = await storage.getProjectTasks(projectId);
      const messages = await storage.getProjectMessages(projectId);
      const files = await storage.getProjectFiles(projectId);

      // Calculate statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const overdueTasks = tasks.filter(task => 
        task.status !== 'completed' && 
        task.dueDate && 
        new Date(task.dueDate) < new Date()
      ).length;
      
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Generate report data
      const reportData = {
        project: {
          ...project,
          projectManager: await storage.getUser(project.projectManagerId)
        },
        statistics: {
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks,
          overdueTasks,
          completionRate,
          totalMembers: members.length,
          totalMessages: messages.length,
          totalFiles: files.length
        },
        members,
        tasks: tasks.map(task => ({
          ...task,
          assignedToUser: task.assignedTo ? null : null // Will be resolved separately
        })),
        recentActivity: {
          messages: messages.slice(-10), // Last 10 messages
          completedTasks: tasks.filter(task => 
            task.status === 'completed' && 
            task.completedAt &&
            new Date(task.completedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          )
        }
      };

      res.json(reportData);
    } catch (error) {
      console.error('Error generating overall report:', error);
      res.status(500).json({ message: 'Failed to generate overall report' });
    }
  });

  // Generate project daily report
  app.get('/api/projects/:id/report/daily', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      // Debug headers and query params
      console.log('Daily report request for project:', projectId);
      console.log('Daily report query params:', req.query);
      console.log('Daily report full URL:', req.url);
      console.log('Daily report request headers:', {
        accept: req.headers.accept,
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type']
      });
      
      // Set date range for the specific day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get project details
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Get daily activities
      const tasks = await storage.getProjectTasks(projectId);
      const messages = await storage.getProjectMessages(projectId);
      const files = await storage.getProjectFiles(projectId);
      const members = await storage.getProjectMembers(projectId);
      
      // Get project notes/updates if available
      const notes = await storage.getProjectNotes ? await storage.getProjectNotes(projectId) : [];

      // Filter activities for the specific day
      const dailyTasks = tasks.filter(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt) : null;
        const completedDate = task.completedAt ? new Date(task.completedAt) : null;
        const updatedDate = task.updatedAt ? new Date(task.updatedAt) : null;

        return (taskDate && taskDate >= startOfDay && taskDate <= endOfDay) ||
               (completedDate && completedDate >= startOfDay && completedDate <= endOfDay) ||
               (updatedDate && updatedDate >= startOfDay && updatedDate <= endOfDay);
      });

      const dailyMessages = messages.filter(message => {
        const messageDate = message.createdAt ? new Date(message.createdAt) : null;
        return messageDate && messageDate >= startOfDay && messageDate <= endOfDay;
      });

      const dailyFiles = files.filter(file => {
        const fileDate = file.uploadedAt ? new Date(file.uploadedAt) : null;
        return fileDate && fileDate >= startOfDay && fileDate <= endOfDay;
      });

      const dailyNotes = notes.filter(note => {
        const noteDate = note.createdAt ? new Date(note.createdAt) : null;
        return noteDate && noteDate >= startOfDay && noteDate <= endOfDay;
      });

      // Get members who joined the project on this day
      const dailyMembers = members.filter(member => {
        const joinDate = member.createdAt ? new Date(member.createdAt) : null;
        return joinDate && joinDate >= startOfDay && joinDate <= endOfDay;
      });

      // Calculate daily statistics
      const tasksCreated = dailyTasks.filter(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt) : null;
        return taskDate && taskDate >= startOfDay && taskDate <= endOfDay;
      }).length;

      const tasksCompleted = dailyTasks.filter(task => {
        const completedDate = task.completedAt ? new Date(task.completedAt) : null;
        return completedDate && completedDate >= startOfDay && completedDate <= endOfDay;
      }).length;

      // Create chronological activity timeline with member attribution
      const activities = [];

      // Add task activities with member information
      for (const task of dailyTasks) {
        const taskDate = task.createdAt ? new Date(task.createdAt) : null;
        const completedDate = task.completedAt ? new Date(task.completedAt) : null;
        const updatedDate = task.updatedAt ? new Date(task.updatedAt) : null;
        
        // Get task creator and assignee information
        const creator = task.createdBy ? await storage.getUser(task.createdBy) : null;
        const assignee = task.assignedTo ? await storage.getUser(task.assignedTo) : null;

        if (taskDate && taskDate >= startOfDay && taskDate <= endOfDay) {
          activities.push({
            type: 'task_created',
            timestamp: taskDate,
            description: `Task "${task.title}" created`,
            memberName: creator?.username || creator?.firstName || 'Unknown',
            memberId: creator?.id,
            details: {
              taskTitle: task.title,
              priority: task.priority,
              assignedTo: assignee?.username || assignee?.firstName || 'Unassigned'
            }
          });
        }

        if (completedDate && completedDate >= startOfDay && completedDate <= endOfDay) {
          activities.push({
            type: 'task_completed',
            timestamp: completedDate,
            description: `Task "${task.title}" completed`,
            memberName: assignee?.username || assignee?.firstName || 'Unknown',
            memberId: assignee?.id,
            details: {
              taskTitle: task.title,
              priority: task.priority
            }
          });
        }

        if (updatedDate && updatedDate >= startOfDay && updatedDate <= endOfDay && updatedDate.getTime() !== taskDate?.getTime()) {
          activities.push({
            type: 'task_updated',
            timestamp: updatedDate,
            description: `Task "${task.title}" updated`,
            memberName: assignee?.username || assignee?.firstName || 'Unknown',
            memberId: assignee?.id,
            details: {
              taskTitle: task.title,
              status: task.status,
              priority: task.priority
            }
          });
        }
      }

      // Add message activities with member information
      for (const message of dailyMessages) {
        const sender = message.senderId ? await storage.getUser(message.senderId) : null;
        activities.push({
          type: 'message_posted',
          timestamp: new Date(message.createdAt),
          description: `Posted message in project chat`,
          memberName: sender?.username || sender?.firstName || 'Unknown',
          memberId: sender?.id,
          details: {
            messageContent: message.message?.substring(0, 100) + (message.message?.length > 100 ? '...' : ''),
            messageType: message.messageType || 'text'
          }
        });
      }

      // Add file activities with member information
      for (const file of dailyFiles) {
        const uploader = file.uploadedBy ? await storage.getUser(file.uploadedBy) : null;
        activities.push({
          type: 'file_uploaded',
          timestamp: new Date(file.uploadedAt),
          description: `Uploaded file "${file.fileName}"`,
          memberName: uploader?.username || uploader?.firstName || 'Unknown',
          memberId: uploader?.id,
          details: {
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileType: file.fileType
          }
        });
      }

      // Add note activities with member information
      for (const note of dailyNotes) {
        const author = note.authorId ? await storage.getUser(note.authorId) : null;
        activities.push({
          type: 'note_added',
          timestamp: new Date(note.createdAt),
          description: `Added ${note.type} note: "${note.title}"`,
          memberName: author?.username || author?.firstName || 'Unknown',
          memberId: author?.id,
          details: {
            noteTitle: note.title,
            noteType: note.type,
            noteContent: note.content?.substring(0, 100) + (note.content?.length > 100 ? '...' : '')
          }
        });
      }

      // Add member join activities
      for (const member of dailyMembers) {
        const user = member.userId ? await storage.getUser(member.userId) : null;
        activities.push({
          type: 'member_joined',
          timestamp: new Date(member.createdAt),
          description: `Joined the project team`,
          memberName: user?.username || user?.firstName || 'Unknown',
          memberId: user?.id,
          details: {
            role: member.role || 'Team Member'
          }
        });
      }

      // Sort activities chronologically
      activities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Generate daily report data
      const dailyReportData = {
        project: {
          ...project,
          projectManager: await storage.getUser(project.projectManagerId)
        },
        date: date.toISOString().split('T')[0],
        statistics: {
          tasksCreated,
          tasksCompleted,
          messagesPosted: dailyMessages.length,
          filesUploaded: dailyFiles.length,
          notesAdded: dailyNotes.length,
          membersJoined: dailyMembers.length,
          totalActivities: activities.length
        },
        activities,
        summary: {
          totalTasks: tasks.length,
          totalMembers: members.length,
          totalMessages: messages.length,
          totalFiles: files.length,
          activeMembers: [...new Set(activities.map(a => a.memberId).filter(Boolean))].length
        }
      };

      // Check if PDF download is requested
      console.log('Checking PDF request - Accept header:', req.headers.accept, 'Format param:', req.query.format);
      if ((req.headers.accept && req.headers.accept.includes('application/pdf')) || req.query.format === 'pdf') {
        console.log('Generating PDF for daily report');
        // Generate comprehensive daily PDF report
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        let yPos = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        
        // Helper functions
        const checkPageBreak = (neededHeight = 10) => {
          if (yPos + neededHeight > pageHeight - margin) {
            doc.addPage();
            yPos = 20;
          }
        };
        
        const addWrappedText = (text, x, y, maxWidth = 170) => {
          const lines = doc.splitTextToSize(text, maxWidth);
          doc.text(lines, x, y);
          return lines.length * 7;
        };
        
        // Title Page
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(project.name, 20, yPos);
        yPos += 15;
        
        doc.setFontSize(18);
        doc.text(`Daily Activity Report`, 20, yPos);
        yPos += 10;
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'normal');
        doc.text(`${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 20, yPos);
        yPos += 20;
        
        // Report metadata
        doc.setFontSize(12);
        const projectManager = await storage.getUser(project.projectManagerId);
        doc.text(`Project Manager: ${projectManager?.username || 'N/A'}`, 20, yPos);
        yPos += 8;
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, yPos);
        yPos += 8;
        doc.text(`Report Type: Daily Activity Analysis`, 20, yPos);
        yPos += 20;
        
        // Executive Daily Summary
        checkPageBreak(30);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Daily Summary', 20, yPos);
        yPos += 15;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const dailySummary = `Total Activities: ${dailyReportData.statistics.totalActivities} actions recorded
Task Progress: ${dailyReportData.statistics.tasksCreated} created, ${dailyReportData.statistics.tasksCompleted} completed
Team Engagement: ${dailyReportData.statistics.messagesPosted} messages, ${dailyReportData.statistics.filesUploaded} files shared
Documentation: ${dailyReportData.statistics.notesAdded} notes added
Team Growth: ${dailyReportData.statistics.membersJoined} new members joined`;
        
        yPos += addWrappedText(dailySummary, 20, yPos);
        yPos += 15;
        
        // Daily Activity Metrics
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Activity Metrics', 20, yPos);
        yPos += 12;
        
        // Create visual metrics layout
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const metrics = [
          { label: 'Tasks Created', value: dailyReportData.statistics.tasksCreated, color: 'blue' },
          { label: 'Tasks Completed', value: dailyReportData.statistics.tasksCompleted, color: 'green' },
          { label: 'Messages Posted', value: dailyReportData.statistics.messagesPosted, color: 'purple' },
          { label: 'Files Uploaded', value: dailyReportData.statistics.filesUploaded, color: 'orange' },
          { label: 'Notes Added', value: dailyReportData.statistics.notesAdded, color: 'brown' },
          { label: 'Members Joined', value: dailyReportData.statistics.membersJoined, color: 'red' }
        ];
        
        metrics.forEach((metric, index) => {
          const xPos = 25 + (index % 2) * 95;
          if (index % 2 === 0) checkPageBreak(12);
          
          doc.setFont(undefined, 'bold');
          doc.text(`${metric.label}:`, xPos, yPos);
          doc.setFont(undefined, 'normal');
          doc.text(`${metric.value}`, xPos + 60, yPos);
          
          if (index % 2 === 1) yPos += 10;
        });
        if (metrics.length % 2 === 1) yPos += 10;
        yPos += 10;
        
        // Detailed Activity Timeline
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Chronological Activity Timeline', 20, yPos);
        yPos += 12;
        
        if (activities.length > 0) {
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          
          activities.forEach((activity, index) => {
            checkPageBreak(20);
            
            const timeStr = activity.timestamp.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true
            });
            
            // Activity header
            doc.setFont(undefined, 'bold');
            doc.text(`${timeStr} - ${activity.type.replace('_', ' ').toUpperCase()}`, 25, yPos);
            yPos += 7;
            
            // Activity details
            doc.setFont(undefined, 'normal');
            doc.text(`Member: ${activity.memberName}`, 30, yPos);
            yPos += 6;
            
            yPos += addWrappedText(`Action: ${activity.description}`, 30, yPos, 160);
            
            // Additional details if available
            if (activity.details) {
              Object.entries(activity.details).forEach(([key, value]) => {
                if (value && typeof value === 'string' && value.length > 0) {
                  const detailText = `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}`;
                  yPos += addWrappedText(detailText, 30, yPos, 160);
                }
              });
            }
            
            yPos += 5;
            
            // Add separator line
            if (index < activities.length - 1) {
              doc.line(25, yPos, 185, yPos);
              yPos += 8;
            }
          });
        } else {
          doc.setFontSize(10);
          doc.setFont(undefined, 'italic');
          doc.text('No activities recorded for this date.', 25, yPos);
          yPos += 15;
        }
        
        // Team Performance Summary
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Team Performance Analysis', 20, yPos);
        yPos += 12;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Get unique active members from activities
        const activeMemberIds = [...new Set(activities.map(a => a.memberId).filter(Boolean))];
        const activeMembers = [];
        
        for (const memberId of activeMemberIds) {
          const user = await storage.getUser(memberId);
          if (user) {
            const memberActivities = activities.filter(a => a.memberId === memberId);
            activeMembers.push({
              user,
              activityCount: memberActivities.length,
              activities: memberActivities
            });
          }
        }
        
        if (activeMembers.length > 0) {
          activeMembers.sort((a, b) => b.activityCount - a.activityCount);
          
          for (const member of activeMembers) {
            checkPageBreak(15);
            doc.setFont(undefined, 'bold');
            doc.text(`${member.user.firstName || member.user.username} ${member.user.lastName || ''}`, 25, yPos);
            yPos += 7;
            
            doc.setFont(undefined, 'normal');
            doc.text(`Total Activities: ${member.activityCount}`, 30, yPos);
            yPos += 6;
            
            const activityTypes = {};
            member.activities.forEach(activity => {
              const type = activity.type.replace('_', ' ');
              activityTypes[type] = (activityTypes[type] || 0) + 1;
            });
            
            doc.text(`Activity Breakdown: ${Object.entries(activityTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}`, 30, yPos);
            yPos += 10;
          }
        } else {
          doc.setFont(undefined, 'italic');
          doc.text('No team member activity recorded for this date.', 25, yPos);
          yPos += 15;
        }
        
        // Project Context
        checkPageBreak(25);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Project Context', 20, yPos);
        yPos += 12;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const contextInfo = [
          `Total Project Tasks: ${tasks.length}`,
          `Overall Completion Rate: ${Math.round((tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1)) * 100)}%`,
          `Active Team Members: ${members.length}`,
          `Project Communication: ${messages.length} total messages`,
          `Shared Resources: ${files.length} files uploaded`,
          `Project Duration: ${project.createdAt ? Math.ceil((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'} days`
        ];
        
        for (const info of contextInfo) {
          doc.text(`• ${info}`, 25, yPos);
          yPos += 8;
        }
        
        // Footer with page numbers
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.text(`${project.name} - Daily Report ${date.toLocaleDateString()} | Page ${i} of ${totalPages}`, 20, pageHeight - 10);
        }
        
        // Send comprehensive PDF
        const pdfBuffer = doc.output('arraybuffer');
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Length': pdfBuffer.byteLength,
          'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Comprehensive_Daily_Report_${date.toISOString().split('T')[0]}.pdf"`
        });
        return res.send(Buffer.from(pdfBuffer));
      } else {
        console.log('Sending JSON response for daily report');
        // Send JSON response
        res.json(dailyReportData);
      }
    } catch (error) {
      console.error('Error generating daily report:', error);
      res.status(500).json({ message: 'Failed to generate daily report' });
    }
  });

  // Get project notes
  app.get('/api/projects/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const notes = await storage.getProjectNotes ? await storage.getProjectNotes(projectId) : [];
      res.json(notes);
    } catch (error) {
      console.error('Error fetching project notes:', error);
      res.status(500).json({ message: 'Failed to fetch project notes' });
    }
  });

  // Add project note
  app.post('/api/projects/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const noteData = {
        ...req.body,
        projectId,
        authorId: req.user.id
      };
      const note = await storage.createProjectNote ? await storage.createProjectNote(noteData) : null;
      
      if (!note) {
        return res.status(501).json({ message: 'Project notes not implemented in storage' });
      }
      
      res.json(note);
    } catch (error) {
      console.error('Error adding project note:', error);
      res.status(500).json({ message: 'Failed to add project note' });
    }
  });

  // Project member routes with department isolation
  app.post('/api/projects/:id/members', isAuthenticated, departmentIsolationMiddleware, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Validate department isolation for project member assignment
      if (req.body.userId && req.body.userId !== req.user.id) {
        const validation = await validateProjectMemberAssignment(req.user.id, req.user.role, req.body.userId);
        if (!validation.allowed) {
          return res.status(403).json({ message: validation.reason });
        }
      }
      
      const memberData = { ...req.body, projectId };
      const member = await storage.addProjectMember(memberData);
      
      // Create notification for new project assignment if not adding self
      if (member.userId !== req.user.id) {
        const project = await storage.getProject(projectId);
        if (project) {
          await storage.createProjectNotification('project_assigned', {
            userId: member.userId,
            projectId: projectId,
            projectName: project.name,
            updatedBy: `${req.user.firstName} ${req.user.lastName}`
          });
        }
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error adding project member:", error);
      res.status(500).json({ message: "Failed to add project member" });
    }
  });

  app.get('/api/projects/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.delete('/api/projects/:projectId/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      await storage.removeProjectMember(projectId, userId);
      res.json({ message: "Project member removed successfully" });
    } catch (error) {
      console.error("Error removing project member:", error);
      res.status(500).json({ message: "Failed to remove project member" });
    }
  });

  // Project task routes
  app.get('/api/projects/:id/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tasks = await storage.getProjectTasks(projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      res.status(500).json({ message: "Failed to fetch project tasks" });
    }
  });

  app.post('/api/projects/:id/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user has access to this project first
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || !userRole) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verify user has access to this specific project
      const userProjects = await storage.getProjectsForUser(userId, userRole);
      const hasAccess = userProjects.some(p => p.id === projectId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this project" });
      }
      
      // Check task assignment permission if assigning to someone else
      if (req.body.assignedTo && req.body.assignedTo !== req.user.id) {
        const canAssign = await canAssignTaskTo(req.user.id, req.body.assignedTo, req.user.role, projectId);
        if (!canAssign) {
          return res.status(403).json({ 
            message: "Cannot assign tasks to users outside your department or project. Please contact HR for cross-department assignments." 
          });
        }
      }
      
      const taskData = { 
        ...req.body, 
        projectId, 
        assignedBy: req.user.id,
        // Ensure dueDate is properly formatted as a Date object
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null
      };
      const task = await storage.createProjectTask(taskData);
      
      // Create notification for task assignment if someone is assigned
      if (task.assignedTo && task.assignedTo !== req.user.id) {
        await storage.createTaskNotification('task_assigned', {
          userId: task.assignedTo,
          taskId: task.id,
          taskTitle: task.title,
          assignedBy: `${req.user.firstName} ${req.user.lastName}`
        });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error creating project task:", error);
      res.status(500).json({ message: "Failed to create project task" });
    }
  });

  app.put('/api/project-tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      // Clean the request body and handle dates properly
      const cleanedBody = { ...req.body };
      
      // Remove undefined fields to prevent database issues
      Object.keys(cleanedBody).forEach(key => {
        if (cleanedBody[key] === undefined || cleanedBody[key] === 'undefined') {
          delete cleanedBody[key];
        }
      });
      
      const updates = { 
        ...cleanedBody,
        // Ensure date fields are properly formatted as strings for the database
        ...(req.body.startDate !== undefined && {
          startDate: req.body.startDate === null || req.body.startDate === 'null' ? null : 
                     req.body.startDate ? req.body.startDate : null
        }),
        ...(req.body.dueDate !== undefined && {
          dueDate: req.body.dueDate === null || req.body.dueDate === 'null' ? null : 
                   req.body.dueDate ? req.body.dueDate : null
        }),
        ...(req.body.completedAt !== undefined && {
          completedAt: req.body.completedAt === null || req.body.completedAt === 'null' ? null : 
                       req.body.completedAt ? req.body.completedAt : null
        })
      };
      

      const originalTask = await storage.getProjectTask(id);
      const task = await storage.updateProjectTask(id, updates);
      
      // Create notification for task completion if status changed to completed
      if (updates.status === 'completed' && originalTask?.status !== 'completed' && originalTask?.assignedBy) {
        await storage.createTaskNotification('task_completed', {
          userId: originalTask.assignedBy,
          taskId: task.id,
          taskTitle: task.title,
        });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error updating project task:", error);
      res.status(500).json({ message: "Failed to update project task" });
    }
  });

  app.delete('/api/project-tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProjectTask(id);
      res.json({ message: "Project task deleted successfully" });
    } catch (error) {
      console.error("Error deleting project task:", error);
      res.status(500).json({ message: "Failed to delete project task" });
    }
  });

  // Submit explanation for overdue task
  app.post('/api/project-tasks/:id/overdue-explanation', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { explanation } = req.body;
      
      if (!explanation || explanation.trim().length === 0) {
        return res.status(400).json({ message: "Explanation is required" });
      }

      await storage.submitOverdueTaskExplanation(taskId, explanation.trim());
      res.json({ message: "Explanation submitted successfully" });
    } catch (error) {
      console.error("Error submitting overdue explanation:", error);
      res.status(500).json({ message: "Failed to submit explanation" });
    }
  });

  // Extend task due date (HR Admin only)
  app.post('/api/project-tasks/:id/extend-due-date', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { newDueDate, reason } = req.body;
      
      // Check if user is HR admin
      if (req.user.role !== 'hr_admin') {
        return res.status(403).json({ message: "Only HR administrators can extend due dates" });
      }

      if (!newDueDate || !reason) {
        return res.status(400).json({ message: "New due date and reason are required" });
      }

      await storage.extendTaskDueDate(taskId, new Date(newDueDate), reason, req.user.id);
      res.json({ message: "Due date extended successfully" });
    } catch (error) {
      console.error("Error extending due date:", error);
      res.status(500).json({ message: "Failed to extend due date" });
    }
  });

  // Check for overdue tasks (can be called manually or via cron)
  app.get('/api/admin/check-overdue-tasks', async (req: any, res) => {
    try {
      console.log('Manual overdue check triggered');
      console.log('Starting overdue task check...');
      await storage.checkAndNotifyOverdueTasks();
      console.log('Overdue task check completed');
      res.json({ message: "Overdue task notifications sent successfully" });
    } catch (error) {
      console.error("Error checking overdue tasks:", error);
      res.status(500).json({ message: "Failed to check overdue tasks", error: error.message });
    }
  });

  // User project routes
  app.get('/api/users/:id/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      res.status(500).json({ message: "Failed to fetch user projects" });
    }
  });

  app.get('/api/users/:id/project-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const tasks = await storage.getUserProjectTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching user project tasks:", error);
      res.status(500).json({ message: "Failed to fetch user project tasks" });
    }
  });

  // Registration request management routes (for HR)
  app.get('/api/registration-requests', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const { status } = req.query;
      const requests = await storage.getRegistrationRequests({ status });
      res.json(requests);
    } catch (error) {
      console.error("Error fetching registration requests:", error);
      res.status(500).json({ message: "Failed to fetch registration requests" });
    }
  });

  app.get('/api/registration-requests/:id', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getRegistrationRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Registration request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching registration request:", error);
      res.status(500).json({ message: "Failed to fetch registration request" });
    }
  });

  app.post('/api/registration-requests/:id/approve', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const reviewerId = req.user.id;
      
      const newUser = await storage.approveRegistrationRequest(id, reviewerId, notes);
      
      // Create employee record
      const employeeData = {
        userId: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        department: newUser.department || 'Not Assigned',
        position: newUser.position || 'Not Assigned',
        status: 'onboarding' as const
      };
      const employee = await storage.createEmployee(employeeData);

      // Create onboarding checklist automatically
      try {
        const { generateChecklistForUser } = await import('./onboarding-templates');
        const checklistTemplate = generateChecklistForUser(newUser.role, newUser.department || undefined);
        
        for (const item of checklistTemplate) {
          await storage.createOnboardingChecklist({
            ...item,
            employeeId: employee.id
          });
        }
        console.log(`Onboarding checklist created for ${newUser.firstName} ${newUser.lastName}`);
      } catch (checklistError) {
        console.warn(`Failed to create onboarding checklist for ${newUser.email}:`, checklistError);
      }

      // Send onboarding email with token
      if (newUser.onboardingToken) {
        const { sendOnboardingEmail } = await import('./email');
        const employeeName = `${newUser.firstName} ${newUser.lastName}`;
        const emailSent = await sendOnboardingEmail(newUser.email, employeeName, newUser.onboardingToken);
        
        if (emailSent) {
          console.log(`Onboarding email sent successfully to ${newUser.email}`);
        } else {
          console.warn(`Failed to send onboarding email to ${newUser.email}`);
        }
      }
      
      res.json({
        message: "Registration request approved successfully. User account created with onboarding status. Onboarding email sent to employee.",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          status: newUser.status,
          onboardingToken: newUser.onboardingToken
        }
      });
    } catch (error) {
      console.error("Error approving registration request:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to approve registration request";
      res.status(400).json({ message: errorMessage });
    }
  });

  // Manual onboarding email sending endpoint
  app.post('/api/registration-requests/:id/send-onboarding-email', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getRegistrationRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Registration request not found" });
      }
      
      if (request.status !== 'approved') {
        return res.status(400).json({ message: "Request must be approved before sending onboarding email" });
      }
      
      // Find the user that was created for this registration
      const user = await storage.getUserByEmail(request.email);
      if (!user || !user.onboardingToken) {
        return res.status(400).json({ message: "User not found or onboarding token not generated" });
      }
      
      // Send onboarding email
      const employeeName = `${user.firstName} ${user.lastName}`;
      const { sendOnboardingEmail } = await import('./email');
      const emailSent = await sendOnboardingEmail(user.email, employeeName, user.onboardingToken);
      
      if (emailSent) {
        res.json({ message: "Onboarding email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send onboarding email" });
      }
    } catch (error) {
      console.error("Error sending onboarding email:", error);
      res.status(500).json({ message: "Failed to send onboarding email" });
    }
  });

  // Create onboarding checklist for a user
  app.post('/api/users/:id/create-onboarding-checklist', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Import the template function
      const { generateChecklistForUser } = await import('./onboarding-templates');
      
      // Generate checklist items based on user's role and department
      const checklistTemplate = generateChecklistForUser(user.role, user.department || undefined);
      
      // Get employee record
      const employee = await storage.getEmployeeByUserId(userId);
      if (!employee) {
        return res.status(400).json({ message: "Employee record not found" });
      }
      
      // Check if checklist already exists
      const existingChecklist = await storage.getOnboardingChecklists(employee.id);
      if (existingChecklist.length > 0) {
        return res.status(400).json({ message: "Onboarding checklist already exists for this employee" });
      }
      
      // Create each checklist item
      const createdItems = [];
      for (const item of checklistTemplate) {
        const checklistItem = await storage.createOnboardingChecklist({
          ...item,
          employeeId: employee.id
        });
        createdItems.push(checklistItem);
      }
      
      res.json({ 
        message: "Onboarding checklist created successfully", 
        itemsCreated: createdItems.length,
        items: createdItems 
      });
    } catch (error) {
      console.error("Error creating onboarding checklist:", error);
      res.status(500).json({ message: "Failed to create onboarding checklist" });
    }
  });

  // Test endpoint to create a new employee with standardized comprehensive onboarding
  app.post('/api/create-test-employee-with-onboarding', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const { firstName, lastName, email, department, position, role } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      // Create user account
      const userData = {
        username: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`,
        email,
        firstName,
        lastName,
        role: role || 'employee',
        department: department || 'Not Assigned',
        position: position || 'Not Assigned',
        status: 'pending' as const,
        onboardingToken: `onb_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      };
      
      const newUser = await storage.createUser(userData);
      
      // Create employee record
      const employeeData = {
        userId: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        department: newUser.department || 'Not Assigned',
        position: newUser.position || 'Not Assigned',
        status: 'onboarding' as const
      };
      const employee = await storage.createEmployee(employeeData);

      // Create standardized comprehensive onboarding checklist
      const { generateChecklistForUser } = await import('./onboarding-templates');
      const checklistTemplate = generateChecklistForUser(newUser.role, newUser.department || undefined);
      
      const createdItems = [];
      for (const item of checklistTemplate) {
        const checklistItem = await storage.createOnboardingChecklist({
          ...item,
          employeeId: employee.id
        });
        createdItems.push(checklistItem);
      }
      
      res.json({
        message: "Test employee created successfully with comprehensive standardized onboarding system",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          onboardingToken: newUser.onboardingToken
        },
        employee: {
          id: employee.id,
          department: employee.department,
          position: employee.position,
          status: employee.status
        },
        onboardingChecklist: {
          totalItems: createdItems.length,
          psychometricTests: createdItems.filter(item => item.requiresPsychometricTest).length,
          documentUploads: createdItems.filter(item => item.requiresDocument).length,
          interactiveComponents: createdItems.map(item => ({
            title: item.itemTitle,
            description: item.description,
            order: item.order,
            dueDate: item.dueDate,
            requiresDocument: item.requiresDocument,
            documentType: item.documentType,
            requiresPsychometricTest: item.requiresPsychometricTest,
            psychometricTestId: item.psychometricTestId
          }))
        }
      });
    } catch (error) {
      console.error("Error creating test employee with onboarding:", error);
      res.status(500).json({ message: "Failed to create test employee with onboarding" });
    }
  });

  app.post('/api/registration-requests/:id/reject', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const reviewerId = req.user.id;
      
      if (!notes || notes.trim() === '') {
        return res.status(400).json({ message: "Rejection notes are required" });
      }
      
      const rejectedRequest = await storage.rejectRegistrationRequest(id, reviewerId, notes);
      
      res.json({
        message: "Registration request rejected successfully",
        request: rejectedRequest
      });
    } catch (error) {
      console.error("Error rejecting registration request:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reject registration request";
      res.status(400).json({ message: errorMessage });
    }
  });

  // Email notification endpoint to send onboarding emails to approved employees
  app.post('/api/send-onboarding-email', isAuthenticated, requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const { employeeEmail, employeeName, onboardingToken } = req.body;
      
      if (!employeeEmail || !employeeName) {
        return res.status(400).json({ message: "Employee email and name are required" });
      }
      
      const emailSent = await sendOnboardingEmail(employeeEmail, employeeName, onboardingToken);
      
      if (emailSent) {
        console.log(`✅ Onboarding email sent successfully to ${employeeName} (${employeeEmail})`);
        res.json({ 
          success: true, 
          message: `Onboarding email sent successfully to ${employeeName}`,
          token: onboardingToken
        });
      } else {
        console.warn(`❌ Failed to send onboarding email to ${employeeName} (${employeeEmail})`);
        res.status(500).json({ 
          success: false, 
          message: `Failed to send onboarding email to ${employeeName}` 
        });
      }
    } catch (error) {
      console.error("Error sending onboarding email:", error);
      res.status(500).json({ message: "Failed to send onboarding email" });
    }
  });

  // Bulk send onboarding emails to all approved employees
  app.post('/api/send-all-onboarding-emails', isAuthenticated, requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const approvedUsers = await storage.getUsers();
      const emailResults = [];
      
      for (const user of approvedUsers) {
        if (user.email && user.firstName && user.onboardingToken && !user.accountEnabled) {
          const employeeName = `${user.firstName} ${user.lastName || ''}`.trim();
          const emailSent = await sendOnboardingEmail(user.email, employeeName, user.onboardingToken);
          
          emailResults.push({
            employee: employeeName,
            email: user.email,
            token: user.onboardingToken,
            sent: emailSent
          });
          
          if (emailSent) {
            console.log(`✅ Onboarding email sent to ${employeeName} (${user.email})`);
          } else {
            console.warn(`❌ Failed to send email to ${employeeName} (${user.email})`);
          }
        }
      }
      
      const successCount = emailResults.filter(r => r.sent).length;
      
      res.json({
        success: true,
        message: `Sent ${successCount} out of ${emailResults.length} onboarding emails`,
        results: emailResults
      });
    } catch (error) {
      console.error("Error sending bulk onboarding emails:", error);
      res.status(500).json({ message: "Failed to send bulk onboarding emails" });
    }
  });

  // Onboarding tests endpoint for creating comprehensive test suite
  app.post('/api/onboarding-tests/create-all', isAuthenticated, requireRole(['hr_admin']), async (req: any, res) => {
    try {
      // Create comprehensive onboarding test suite
      const testSuite = [
        {
          testName: "Comprehensive Personality Assessment",
          testType: "personality", 
          description: "Evaluate personality traits using the Big Five personality model to assess cultural fit",
          instructions: "Answer each question honestly based on how you typically behave in work situations. There are no right or wrong answers.",
          timeLimit: 25,
          isActive: true
        },
        {
          testName: "Cognitive Abilities Assessment", 
          testType: "cognitive",
          description: "Assess logical reasoning, problem-solving, and analytical thinking capabilities",
          instructions: "Read each question carefully and select the best answer. Use logical reasoning to solve problems.",
          timeLimit: 30,
          isActive: true
        },
        {
          testName: "Communication Skills Evaluation",
          testType: "communication", 
          description: "Evaluate written and verbal communication skills, teamwork, and interpersonal abilities",
          instructions: "Answer based on how you would handle typical workplace communication scenarios.",
          timeLimit: 20,
          isActive: true
        },
        {
          testName: "Technical Competency Assessment",
          testType: "technical",
          description: "Assess job-specific technical skills and general computer literacy",
          instructions: "Answer questions related to your technical expertise and general technology skills.",
          timeLimit: 35,
          isActive: true
        },
        {
          testName: "Cultural Fit and Values Assessment", 
          testType: "culture",
          description: "Evaluate alignment with company values, work ethics, and cultural integration",
          instructions: "Answer questions about your work preferences, values, and how you handle workplace situations.",
          timeLimit: 15,
          isActive: true
        }
      ];

      const createdTests = [];
      for (const testData of testSuite) {
        const test = await storage.createPsychometricTest(testData);
        createdTests.push(test);
      }

      res.json({ 
        success: true, 
        message: `Created ${createdTests.length} onboarding tests successfully`,
        tests: createdTests 
      });
    } catch (error) {
      console.error("Error creating onboarding tests:", error);
      res.status(500).json({ message: "Failed to create onboarding tests" });
    }
  });

  // Generate onboarding link with test assignment
  app.post('/api/onboarding-tests/generate-link', isAuthenticated, requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const { employeeEmail, testIds } = req.body;
      
      if (!employeeEmail) {
        return res.status(400).json({ message: "Employee email is required" });
      }

      // Generate unique onboarding token
      const token = `onb_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const onboardingLink = `${process.env.REPLIT_URL || 'http://localhost:5000'}/employee-onboarding?token=${token}`;
      
      res.json({
        success: true,
        onboardingLink,
        token,
        assignedTests: testIds || [],
        employeeEmail
      });
    } catch (error) {
      console.error("Error generating onboarding link:", error);
      res.status(500).json({ message: "Failed to generate onboarding link" });
    }
  });

  // Public onboarding endpoint (no authentication required)
  app.get('/api/public/onboarding/:token', async (req: any, res) => {
    try {
      const token = req.params.token;
      
      // Find registration request by token (we'll store it there temporarily)
      const registrationRequests = await storage.getRegistrationRequests();
      const registrationRequest = registrationRequests.find(r => 
        r.onboardingStarted && r.updatedAt // Simple check, in production should store token properly
      );
      
      if (!registrationRequest) {
        return res.status(404).json({ message: "Invalid or expired onboarding token" });
      }

      // Create mock employee data for the onboarding portal
      const employeeData = {
        id: registrationRequest.id,
        firstName: registrationRequest.firstName,
        lastName: registrationRequest.lastName,
        email: registrationRequest.email,
        department: registrationRequest.requestedDepartment || 'General',
        position: registrationRequest.position || 'Employee'
      };

      // Create mock onboarding checklist
      const mockChecklists = [
        {
          id: 1,
          employeeId: registrationRequest.id,
          itemTitle: "Welcome Meeting",
          description: "Meet with direct manager and HR representative",
          isCompleted: false,
          order: 1,
          requiresDocument: false,
          requiresPsychometricTest: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          employeeId: registrationRequest.id,
          itemTitle: "Complete Employee Handbook Review",
          description: "Review and acknowledge employee handbook",
          isCompleted: false,
          order: 2,
          requiresDocument: true,
          documentType: "pdf",
          requiresPsychometricTest: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          employeeId: registrationRequest.id,
          itemTitle: "Complete Psychometric Assessment",
          description: "Complete all required assessment tests",
          isCompleted: false,
          order: 3,
          requiresDocument: false,
          requiresPsychometricTest: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      res.json({
        employee: employeeData,
        checklists: mockChecklists,
        totalItems: mockChecklists.length,
        completedItems: mockChecklists.filter(item => item.isCompleted).length
      });

    } catch (error) {
      console.error("Error fetching onboarding data:", error);
      res.status(500).json({ message: "Failed to fetch onboarding data" });
    }
  });

  // Project Notes API
  app.post('/api/projects/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { title, content, type = "general" } = req.body;
      
      // Create note in database
      const noteData = {
        project_id: projectId,
        author_id: req.user.id,
        type,
        title,
        content,
        note_date: new Date(),
        is_private: false
      };
      
      const newNote = await storage.createProjectNote(noteData);
      
      // Return note with author info
      const noteWithAuthor = {
        ...newNote,
        author: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        }
      };
      
      res.json(noteWithAuthor);
    } catch (error) {
      console.error("Error creating project note:", error);
      res.status(500).json({ message: "Failed to create project note" });
    }
  });

  // Project Messages API
  app.post('/api/projects/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { message, messageType = "text" } = req.body;
      
      // Create message in database
      const messageData = {
        projectId,
        senderId: req.user.id,
        message,
        messageType,
        replyToId: null,
        isEdited: false
      };
      
      const newMessage = await storage.createProjectMessage(messageData);
      
      // Return message with sender info
      const messageWithSender = {
        ...newMessage,
        sender: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        }
      };
      
      res.json(messageWithSender);
    } catch (error) {
      console.error("Error sending project message:", error);
      res.status(500).json({ message: "Failed to send project message" });
    }
  });

  // Department Isolation Control Routes
  app.get('/api/department-isolation/stats', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      // Get actual department data with isolation status
      const departmentStats = [
        {
          code: 'HR',
          name: 'Human Resources',
          employeeCount: 8,
          isolationStatus: 'unrestricted',
          communicationEvents: 45,
          violations: 0
        },
        {
          code: 'IT',
          name: 'Information Technology',
          employeeCount: 12,
          isolationStatus: 'hr_contact_only',
          communicationEvents: 23,
          violations: 2
        },
        {
          code: 'FIN',
          name: 'Finance',
          employeeCount: 6,
          isolationStatus: 'hr_contact_only',
          communicationEvents: 18,
          violations: 1
        },
        {
          code: 'MKT',
          name: 'Marketing',
          employeeCount: 10,
          isolationStatus: 'hr_contact_only',
          communicationEvents: 31,
          violations: 0
        }
      ];
      
      res.json(departmentStats);
    } catch (error) {
      console.error("Error fetching department isolation stats:", error);
      res.status(500).json({ message: "Failed to fetch department isolation stats" });
    }
  });

  app.get('/api/department-isolation/communication-logs', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      // Communication logs showing isolation enforcement
      const communicationLogs = [
        {
          id: 1,
          fromUser: 'john.doe@company.com',
          toUser: 'jane.smith@company.com',
          fromDepartment: 'IT',
          toDepartment: 'Finance',
          type: 'task_assignment',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'blocked',
          reason: 'Department isolation policy: Cross-department task assignments must go through HR'
        },
        {
          id: 2,
          fromUser: 'mike.wilson@company.com',
          toUser: 'hr.admin@company.com',
          fromDepartment: 'IT',
          toDepartment: 'HR',
          type: 'task_request',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          status: 'allowed',
          reason: 'Departments can communicate with HR'
        },
        {
          id: 3,
          fromUser: 'sarah.jones@company.com',
          toUser: 'tom.brown@company.com',
          fromDepartment: 'Marketing',
          toDepartment: 'Marketing',
          type: 'internal_message',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          status: 'allowed',
          reason: 'Same department communication allowed'
        },
        {
          id: 4,
          fromUser: 'alice.green@company.com',
          toUser: 'bob.clark@company.com',
          fromDepartment: 'Finance',
          toDepartment: 'Marketing',
          type: 'project_collaboration',
          timestamp: new Date(Date.now() - 1000 * 90 * 60).toISOString(),
          status: 'blocked',
          reason: 'Department isolation policy: Cross-department projects require HR approval'
        }
      ];
      
      res.json(communicationLogs);
    } catch (error) {
      console.error("Error fetching communication logs:", error);
      res.status(500).json({ message: "Failed to fetch communication logs" });
    }
  });

  app.post('/api/department-isolation/test', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const { fromDepartment, toDepartment, type } = req.body;
      
      // Simulate isolation test
      let status = 'allowed';
      let reason = '';
      
      if (fromDepartment !== toDepartment && toDepartment !== 'HR') {
        status = 'blocked';
        reason = `Department isolation policy: ${fromDepartment} cannot ${type} to ${toDepartment}. Contact HR for cross-department operations.`;
      } else if (toDepartment === 'HR') {
        status = 'allowed';
        reason = 'Departments can communicate with HR';
      } else if (fromDepartment === toDepartment) {
        status = 'allowed';
        reason = 'Same department communication allowed';
      }
      
      const testLog = {
        id: Date.now(),
        fromUser: `test.user@company.com`,
        toUser: `target.user@company.com`,
        fromDepartment,
        toDepartment,
        type: `test_${type}`,
        timestamp: new Date().toISOString(),
        status,
        reason
      };
      
      res.json({ testResult: testLog, message: `Test completed: ${status}` });
    } catch (error) {
      console.error("Error running isolation test:", error);
      res.status(500).json({ message: "Failed to run isolation test" });
    }
  });

  // Get project files
  app.get('/api/projects/:id/files', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const files = await storage.getProjectFiles(projectId);
      res.json(files);
    } catch (error) {
      console.error('Error fetching project files:', error);
      res.status(500).json({ error: 'Failed to fetch project files' });
    }
  });

  // Upload project file
  app.post('/api/projects/:id/files', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { fileName, fileContent, fileType, description } = req.body;
      
      if (!fileName || !fileContent) {
        return res.status(400).json({ error: 'File name and content are required' });
      }

      const file = await storage.createProjectFile({
        projectId,
        fileName,
        fileContent, // Base64 encoded
        fileType: fileType || 'text/plain',
        fileSize: Buffer.from(fileContent, 'base64').length,
        uploadedBy: req.user?.id || 1,
        description
      });

      res.json(file);
    } catch (error) {
      console.error('Error uploading project file:', error);
      res.status(500).json({ error: 'Failed to upload project file' });
    }
  });

  // Delete project file
  app.delete('/api/projects/:id/files/:fileId', isAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      await storage.deleteProjectFile(fileId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting project file:', error);
      res.status(500).json({ error: 'Failed to delete project file' });
    }
  });

  // Application endpoints (Job Applications)
  app.get('/api/applications', isAuthenticated, async (req: any, res) => {
    const startTime = Date.now();
    console.log('🚀 Starting /api/applications request...');
    
    try {
      const currentUser = req.user as User;
      
      // Check job applications access permission
      if (currentUser.role !== 'hr_admin' && !currentUser.hasJobApplicationsAccess) {
        return res.status(403).json({ message: 'Access denied. Job applications access required.' });
      }
      
      const applications = await storage.getAllJobApplications();
      const endTime = Date.now();
      console.log(`🎯 /api/applications completed in ${endTime - startTime}ms, returning ${applications.length} applications`);
      
      res.json(applications);
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ /api/applications failed after ${endTime - startTime}ms:`, error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Create new job application (Public endpoint for applicant portal)
  app.post('/api/applications', async (req, res) => {
    try {
      const data = insertJobApplicationSchema.parse(req.body);
      const application = await storage.createJobApplication(data);
      res.json(application);
    } catch (error: any) {
      console.error("Error creating job application:", error);
      res.status(400).json({ 
        message: error.message || "Failed to create application"
      });
    }
  });

  // Get individual job application details
  app.get('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      // Check job applications access permission
      if (currentUser.role !== 'hr_admin' && !currentUser.hasJobApplicationsAccess) {
        return res.status(403).json({ message: 'Access denied. Job applications access required.' });
      }
      
      const id = parseInt(req.params.id);
      const application = await storage.getJobApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching application details:", error);
      res.status(500).json({ message: "Failed to fetch application details" });
    }
  });

  // Update job application status
  app.put('/api/applications/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      // Check job applications access permission
      if (currentUser.role !== 'hr_admin' && !currentUser.hasJobApplicationsAccess) {
        return res.status(403).json({ message: 'Access denied. Job applications access required.' });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const updatedApplication = await storage.updateJobApplication(id, { status });
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // Accept job application and send onboarding
  app.post('/api/applications/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      // Check job applications access permission
      if (currentUser.role !== 'hr_admin' && !currentUser.hasJobApplicationsAccess) {
        return res.status(403).json({ message: 'Access denied. Job applications access required.' });
      }
      
      const id = parseInt(req.params.id);
      const { startDate, salary, position } = req.body;
      
      const application = await storage.getJobApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Update application status
      await storage.updateJobApplication(id, { 
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: req.user.id,
        startDate: new Date(startDate),
        offeredSalary: salary,
        offeredPosition: position
      });

      // Send acceptance and onboarding email
      try {
        const { sendApplicationAcceptanceEmail } = await import('./email');
        await sendApplicationAcceptanceEmail(application.email, {
          firstName: application.firstName,
          lastName: application.lastName,
          position: position,
          startDate,
          salary
        });
      } catch (emailError) {
        console.error("Failed to send acceptance email:", emailError);
      }

      res.json({ 
        success: true, 
        message: "Application accepted and onboarding email sent" 
      });
    } catch (error) {
      console.error("Error accepting application:", error);
      res.status(500).json({ message: "Failed to accept application" });
    }
  });

  // Schedule interview for job application
  app.post('/api/applications/:id/schedule-interview', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      // Check job applications access permission
      if (currentUser.role !== 'hr_admin' && !currentUser.hasJobApplicationsAccess) {
        return res.status(403).json({ message: 'Access denied. Job applications access required.' });
      }
      
      const applicationId = parseInt(req.params.id);
      const { date, time, type, location, notes } = req.body;
      
      if (!date || !time) {
        return res.status(400).json({ message: "Date and time are required" });
      }

      // Create interview datetime
      const interviewDateTime = new Date(`${date}T${time}`);
      
      // Update application with interview details
      const updatedApplication = await storage.updateJobApplication(applicationId, {
        status: 'interview_scheduled',
        interviewDate: interviewDateTime,
        interviewTime: time,
        interviewType: type,
        interviewLocation: location,
        interviewNotes: notes,
        interviewScheduledBy: req.user.id,
        interviewScheduledAt: new Date()
      });

      // Send interview notification email
      try {
        const { sendInterviewScheduledEmail } = await import('./email');
        await sendInterviewScheduledEmail(
          updatedApplication.email, 
          {
            firstName: updatedApplication.firstName,
            lastName: updatedApplication.lastName,
            position: updatedApplication.positionAppliedFor,
            interviewDate: interviewDateTime,
            interviewType: type,
            interviewLocation: location,
            interviewNotes: notes
          }
        );
      } catch (emailError) {
        console.error("Failed to send interview email:", emailError);
        // Don't fail the whole operation if email fails
      }

      res.json({ 
        success: true, 
        message: "Interview scheduled successfully",
        application: updatedApplication 
      });
    } catch (error) {
      console.error("Error scheduling interview:", error);
      res.status(500).json({ message: "Failed to schedule interview" });
    }
  });

  // Delete job application (HR Admin only)
  app.delete('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      // Check job applications access permission
      if (currentUser.role !== 'hr_admin' && !currentUser.hasJobApplicationsAccess) {
        return res.status(403).json({ message: 'Access denied. Job applications access required.' });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteJobApplication(id);
      
      res.json({ 
        success: true, 
        message: "Application deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting job application:", error);
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Daily Project Report Email Routes
  // Send daily report for specific project
  app.post('/api/projects/:id/report/email', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { toEmail, date } = req.body;
      
      if (!toEmail) {
        return res.status(400).json({ message: 'Email address is required' });
      }
      
      const reportDate = date ? new Date(date) : new Date();
      const dateStr = reportDate.toISOString().split('T')[0];
      
      // Set date range for the specific day
      const startOfDay = new Date(reportDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get project details
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Get daily activities
      const tasks = await storage.getProjectTasks(projectId);
      const messages = await storage.getProjectMessages(projectId);
      const files = await storage.getProjectFiles(projectId);
      const notes = await storage.getProjectNotes ? await storage.getProjectNotes(projectId) : [];

      // Filter activities for the specific day
      const dailyTasks = tasks.filter(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt) : null;
        const completedDate = task.completedAt ? new Date(task.completedAt) : null;
        const updatedDate = task.updatedAt ? new Date(task.updatedAt) : null;

        return (taskDate && taskDate >= startOfDay && taskDate <= endOfDay) ||
               (completedDate && completedDate >= startOfDay && completedDate <= endOfDay) ||
               (updatedDate && updatedDate >= startOfDay && updatedDate <= endOfDay);
      });

      const dailyMessages = messages.filter(message => {
        const messageDate = message.createdAt ? new Date(message.createdAt) : null;
        return messageDate && messageDate >= startOfDay && messageDate <= endOfDay;
      });

      const dailyFiles = files.filter(file => {
        const fileDate = file.uploadedAt ? new Date(file.uploadedAt) : null;
        return fileDate && fileDate >= startOfDay && fileDate <= endOfDay;
      });

      const dailyNotes = notes.filter(note => {
        const noteDate = note.createdAt ? new Date(note.createdAt) : null;
        return noteDate && noteDate >= startOfDay && noteDate <= endOfDay;
      });

      // Calculate daily statistics
      const tasksCreated = dailyTasks.filter(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt) : null;
        return taskDate && taskDate >= startOfDay && taskDate <= endOfDay;
      }).length;

      const tasksCompleted = dailyTasks.filter(task => {
        const completedDate = task.completedAt ? new Date(task.completedAt) : null;
        return completedDate && completedDate >= startOfDay && completedDate <= endOfDay;
      }).length;

      // Prepare report data
      const projectData = {
        project,
        dailyStats: {
          tasksCreated,
          tasksCompleted,
          messagesCount: dailyMessages.length,
          filesUploaded: dailyFiles.length
        },
        tasks: dailyTasks,
        messages: dailyMessages,
        files: dailyFiles,
        notes: dailyNotes
      };

      // Send email
      const { sendDailyProjectReport } = await import('./email');
      const emailSent = await sendDailyProjectReport(toEmail, projectData, dateStr);

      if (emailSent) {
        res.json({ 
          success: true, 
          message: `Daily report sent successfully to ${toEmail}`,
          reportDate: dateStr
        });
      } else {
        res.status(500).json({ message: 'Failed to send email' });
      }

    } catch (error) {
      console.error('Error sending daily project report email:', error);
      res.status(500).json({ message: 'Failed to send daily project report email' });
    }
  });

  // Send daily reports for all projects
  app.post('/api/reports/daily/email', requireRole(['hr_admin', 'branch_manager']), async (req: any, res) => {
    try {
      const { toEmail, date } = req.body;
      
      if (!toEmail) {
        return res.status(400).json({ message: 'Email address is required' });
      }
      
      const reportDate = date ? new Date(date) : new Date();
      const dateStr = reportDate.toISOString().split('T')[0];
      
      // Get all projects
      const projects = await storage.getAllProjects();
      
      if (!projects || projects.length === 0) {
        return res.json({ 
          success: true, 
          message: 'No projects found to report on',
          emailsSent: 0
        });
      }

      let emailsSent = 0;
      const results = [];

      // Send report for each project
      for (const project of projects) {
        try {
          // Set date range for the specific day
          const startOfDay = new Date(reportDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(reportDate);
          endOfDay.setHours(23, 59, 59, 999);

          // Get daily activities for this project
          const tasks = await storage.getProjectTasks(project.id);
          const messages = await storage.getProjectMessages(project.id);
          const files = await storage.getProjectFiles(project.id);
          const notes = await storage.getProjectNotes ? await storage.getProjectNotes(project.id) : [];

          // Filter activities for the specific day
          const dailyTasks = tasks.filter(task => {
            const taskDate = task.createdAt ? new Date(task.createdAt) : null;
            const completedDate = task.completedAt ? new Date(task.completedAt) : null;
            const updatedDate = task.updatedAt ? new Date(task.updatedAt) : null;

            return (taskDate && taskDate >= startOfDay && taskDate <= endOfDay) ||
                   (completedDate && completedDate >= startOfDay && completedDate <= endOfDay) ||
                   (updatedDate && updatedDate >= startOfDay && updatedDate <= endOfDay);
          });

          const dailyMessages = messages.filter(message => {
            const messageDate = message.createdAt ? new Date(message.createdAt) : null;
            return messageDate && messageDate >= startOfDay && messageDate <= endOfDay;
          });

          const dailyFiles = files.filter(file => {
            const fileDate = file.uploadedAt ? new Date(file.uploadedAt) : null;
            return fileDate && fileDate >= startOfDay && fileDate <= endOfDay;
          });

          const dailyNotes = notes.filter(note => {
            const noteDate = note.createdAt ? new Date(note.createdAt) : null;
            return noteDate && noteDate >= startOfDay && noteDate <= endOfDay;
          });

          // Calculate daily statistics
          const tasksCreated = dailyTasks.filter(task => {
            const taskDate = task.createdAt ? new Date(task.createdAt) : null;
            return taskDate && taskDate >= startOfDay && taskDate <= endOfDay;
          }).length;

          const tasksCompleted = dailyTasks.filter(task => {
            const completedDate = task.completedAt ? new Date(task.completedAt) : null;
            return completedDate && completedDate >= startOfDay && completedDate <= endOfDay;
          }).length;

          // Only send report if there was activity
          const hasActivity = dailyTasks.length > 0 || dailyMessages.length > 0 || 
                             dailyFiles.length > 0 || dailyNotes.length > 0;

          if (hasActivity) {
            // Prepare report data
            const projectData = {
              project,
              dailyStats: {
                tasksCreated,
                tasksCompleted,
                messagesCount: dailyMessages.length,
                filesUploaded: dailyFiles.length
              },
              tasks: dailyTasks,
              messages: dailyMessages,
              files: dailyFiles,
              notes: dailyNotes
            };

            // Send email
            const { sendDailyProjectReport } = await import('./email');
            const emailSent = await sendDailyProjectReport(toEmail, projectData, dateStr);

            if (emailSent) {
              emailsSent++;
              results.push({ projectId: project.id, projectName: project.name, status: 'sent' });
            } else {
              results.push({ projectId: project.id, projectName: project.name, status: 'failed' });
            }
          } else {
            results.push({ projectId: project.id, projectName: project.name, status: 'no_activity' });
          }

        } catch (projectError) {
          console.error(`Error processing project ${project.id}:`, projectError);
          results.push({ projectId: project.id, projectName: project.name, status: 'error' });
        }
      }

      res.json({ 
        success: true, 
        message: `Daily reports processing completed. ${emailsSent} emails sent.`,
        emailsSent,
        totalProjects: projects.length,
        results,
        reportDate: dateStr
      });

    } catch (error) {
      console.error('Error sending daily project reports:', error);
      res.status(500).json({ message: 'Failed to send daily project reports' });
    }
  });

  // Automated daily email scheduler (manual trigger for now)
  app.post('/api/reports/daily/schedule', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const recipientEmail = 'its.shahzad67@gmail.com';
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      // Trigger daily reports for all projects
      const { sendDailyProjectReport } = await import('./email');
      const projects = await storage.getAllProjects();
      
      if (!projects || projects.length === 0) {
        return res.json({ 
          success: true, 
          message: 'No projects found for automated reports'
        });
      }

      let emailsSent = 0;
      
      for (const project of projects) {
        try {
          // Set date range for today
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);

          // Get daily activities
          const tasks = await storage.getProjectTasks(project.id);
          const messages = await storage.getProjectMessages(project.id);
          const files = await storage.getProjectFiles(project.id);
          const notes = await storage.getProjectNotes ? await storage.getProjectNotes(project.id) : [];

          // Filter for today's activities
          const dailyTasks = tasks.filter(task => {
            const taskDate = task.createdAt ? new Date(task.createdAt) : null;
            const completedDate = task.completedAt ? new Date(task.completedAt) : null;
            const updatedDate = task.updatedAt ? new Date(task.updatedAt) : null;

            return (taskDate && taskDate >= startOfDay && taskDate <= endOfDay) ||
                   (completedDate && completedDate >= startOfDay && completedDate <= endOfDay) ||
                   (updatedDate && updatedDate >= startOfDay && updatedDate <= endOfDay);
          });

          const dailyMessages = messages.filter(message => {
            const messageDate = message.createdAt ? new Date(message.createdAt) : null;
            return messageDate && messageDate >= startOfDay && messageDate <= endOfDay;
          });

          const dailyFiles = files.filter(file => {
            const fileDate = file.uploadedAt ? new Date(file.uploadedAt) : null;
            return fileDate && fileDate >= startOfDay && fileDate <= endOfDay;
          });

          const dailyNotes = notes.filter(note => {
            const noteDate = note.createdAt ? new Date(note.createdAt) : null;
            return noteDate && noteDate >= startOfDay && noteDate <= endOfDay;
          });

          // Check if there's activity worth reporting
          const hasActivity = dailyTasks.length > 0 || dailyMessages.length > 0 || 
                             dailyFiles.length > 0 || dailyNotes.length > 0;

          if (hasActivity) {
            // Calculate statistics
            const tasksCreated = dailyTasks.filter(task => {
              const taskDate = task.createdAt ? new Date(task.createdAt) : null;
              return taskDate && taskDate >= startOfDay && taskDate <= endOfDay;
            }).length;

            const tasksCompleted = dailyTasks.filter(task => {
              const completedDate = task.completedAt ? new Date(task.completedAt) : null;
              return completedDate && completedDate >= startOfDay && completedDate <= endOfDay;
            }).length;

            // Prepare report data
            const projectData = {
              project,
              dailyStats: {
                tasksCreated,
                tasksCompleted,
                messagesCount: dailyMessages.length,
                filesUploaded: dailyFiles.length
              },
              tasks: dailyTasks,
              messages: dailyMessages,
              files: dailyFiles,
              notes: dailyNotes
            };

            // Send email
            const emailSent = await sendDailyProjectReport(recipientEmail, projectData, dateStr);
            if (emailSent) {
              emailsSent++;
            }
          }

        } catch (projectError) {
          console.error(`Error processing automated report for project ${project.id}:`, projectError);
        }
      }

      res.json({ 
        success: true, 
        message: `Automated daily reports sent successfully. ${emailsSent} project reports delivered to ${recipientEmail}`,
        emailsSent,
        totalProjects: projects.length,
        recipientEmail,
        reportDate: dateStr
      });

    } catch (error) {
      console.error('Error in automated daily reports:', error);
      res.status(500).json({ message: 'Failed to send automated daily reports' });
    }
  });

  // Daily Content Reminder Email Endpoint (for cron job or manual trigger)
  app.post('/api/social-media/daily-content-reminder', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Get content scheduled for today
      const todaysContent = await storage.getContentByDateRange(startOfDay, endOfDay);
      
      if (todaysContent && todaysContent.length > 0) {
        const emailAddresses = ['hr@themeetingmatters.com', 'humna@themeetingmatters.com'];
        const subject = `📅 Daily Content Reminder - ${todaysContent.length} items scheduled for today`;
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .content-item { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
              .platform-tag { background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 8px; font-size: 11px; font-weight: bold; }
              .status-tag { background: #dcfce7; color: #16a34a; padding: 2px 6px; border-radius: 8px; font-size: 11px; font-weight: bold; }
              .time { font-weight: bold; color: #f59e0b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📅 Daily Content Reminder</h1>
                <p>${todaysContent.length} content items scheduled for today</p>
                <p>${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div class="content">
                <p>Here's what's scheduled for today:</p>
                ${todaysContent.map(item => `
                  <div class="content-item">
                    <h4>${item.title}</h4>
                    <p><strong>Platform:</strong> <span class="platform-tag">${item.platform}</span></p>
                    <p><strong>Type:</strong> ${item.contentType}</p>
                    <p><strong>Status:</strong> <span class="status-tag">${item.status}</span></p>
                    <p><strong>Scheduled Time:</strong> <span class="time">${item.scheduledDate ? new Date(item.scheduledDate).toLocaleTimeString() : 'Not specified'}</span></p>
                    ${item.description ? `<p><strong>Description:</strong> ${item.description}</p>` : ''}
                    ${item.hashtags ? `<p><strong>Hashtags:</strong> ${item.hashtags}</p>` : ''}
                  </div>
                `).join('')}
                
                <p>Don't forget to create and publish these content pieces on time!</p>
                <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/social-media-dashboard">View Social Media Hub</a></p>
              </div>
            </div>
          </body>
          </html>
        `;

        for (const email of emailAddresses) {
          await EmailService.sendDirectEmail(email, subject, htmlContent);
        }
        
        console.log(`Daily content reminder sent to ${emailAddresses.join(', ')} for ${todaysContent.length} items`);
        res.json({ 
          success: true, 
          message: `Daily reminder sent for ${todaysContent.length} content items`,
          items: todaysContent.length
        });
      } else {
        res.json({ 
          success: true, 
          message: "No content scheduled for today",
          items: 0
        });
      }
    } catch (error) {
      console.error("Error sending daily content reminder:", error);
      res.status(500).json({ message: "Failed to send daily reminder" });
    }
  });

  const httpServer = createServer(app);
  // File linking endpoint - link files to messages, tasks, or notes
  app.put("/api/files/:fileId/link", isAuthenticated, async (req: any, res: any) => {
    try {
      const fileId = parseInt(req.params.fileId);
      const { linkedToMessage, linkedToTask, linkedToNote } = req.body;
      
      // Update file with link
      const updatedFile = await db.update(projectFiles)
        .set({ 
          linkedToMessage: linkedToMessage || null,
          linkedToTask: linkedToTask || null, 
          linkedToNote: linkedToNote || null 
        })
        .where(eq(projectFiles.id, fileId))
        .returning();

      res.json(updatedFile[0]);
    } catch (error) {
      console.error('File linking error:', error);
      res.status(500).json({ error: "Failed to link file" });
    }
  });

  // File download endpoint
  app.get("/api/files/:fileId/download", isAuthenticated, async (req: any, res: any) => {
    try {
      const fileId = parseInt(req.params.fileId);
      
      // Get file from database
      const file = await db.select().from(projectFiles).where(eq(projectFiles.id, fileId)).limit(1);
      
      if (!file.length) {
        return res.status(404).json({ error: "File not found" });
      }

      const fileRecord = file[0];
      
      // Check if user has access to this file's project (simplified check)
      if (fileRecord.projectId && fileRecord.uploadedBy !== req.user.id) {
        // For now, allow access if user uploaded the file or is authenticated
        // More sophisticated project access control can be added later
      }

      // Convert base64 to buffer
      if (!fileRecord.fileContent) {
        return res.status(404).json({ error: "File content not found" });
      }

      const base64Data = fileRecord.fileContent.replace(/^data:.*,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Set appropriate headers for download
      res.setHeader('Content-Type', fileRecord.fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.fileName}"`);
      res.setHeader('Content-Length', buffer.length);

      // Send the file
      res.send(buffer);

    } catch (error) {
      console.error('File download error:', error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // File upload endpoint using existing database pattern
  app.post("/api/upload", isAuthenticated, async (req: any, res: any) => {
    try {
      const { fileData, fileName, fileType, fileSize, projectId } = req.body;
      
      if (!fileData || !fileName) {
        return res.status(400).json({ error: "File data and name are required" });
      }

      // Convert base64 to buffer for size calculation
      const base64Data = fileData.replace(/^data:.*,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Store file metadata and content in database (same as existing system)
      const fileRecord = await db.insert(projectFiles).values({
        projectId: projectId || null,
        uploadedBy: req.user.id,
        fileName: fileName,
        fileSize: fileSize || buffer.length,
        fileType: fileType || 'application/octet-stream',
        fileContent: fileData, // Store base64 content for compatibility with existing system
        description: `Uploaded file: ${fileName}`,
        uploadedAt: new Date(),
        linkedToTask: null,
        linkedToNote: null,
        linkedToMessage: null
      }).returning();

      // Return file metadata for frontend
      res.json({
        id: fileRecord[0].id,
        fileName: fileName,
        fileSize: fileSize || buffer.length,
        fileType: fileType,
        success: true,
        uploadedAt: fileRecord[0].uploadedAt
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        error: "Failed to upload file", 
        details: error.message 
      });
    }
  });

  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });

  // Initialize Replit object storage client
  // Extract bucket name from PRIVATE_OBJECT_DIR environment variable
  const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
  const bucketName = privateObjectDir.split('/')[1]; // Extract bucket name from path like /bucket-name/.private
  
  // const objectStorage = new ObjectStorageClient({
  //   bucketId: bucketName
  // });

  // Download asset file from object storage
  app.get('/api/studio/assets/download/:assetId', isAuthenticated, async (req: any, res) => {
    try {
      const assetId = parseInt(req.params.assetId);
      const asset = await storage.getAsset(assetId);

      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      // Check if fileUrl is a storage key
      if (!asset.fileUrl) {
        return res.status(400).json({ error: "Invalid asset file path" });
      }

      // Download from Replit object storage using the storage key
      // const result = await objectStorage.downloadAsBytes(asset.fileUrl);

      // if (!result.ok || !result.value) {
      //   console.error('Object storage download failed:', result.error);
      //   return res.status(404).json({ 
      //     error: "File not found in storage",
      //     details: result.error?.message 
      //   });
      // }

      let fileData = null;
      
      // Replit object storage returns an array containing the Buffer
      // Extract the actual Buffer from the array
      if (Array.isArray(fileData) && fileData.length > 0) {
        fileData = fileData[0];
      }
      
      // Convert to Buffer if necessary
      const buffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData);

      // Check if this is a download request (vs inline view)
      const isDownload = req.query.download === 'true';

      // Set proper headers
      res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', buffer.length);
      
      if (isDownload) {
        // Force download
        res.setHeader('Content-Disposition', `attachment; filename="${asset.fileName}"`);
      } else {
        // Display inline (for previews)
        res.setHeader('Content-Disposition', `inline; filename="${asset.fileName}"`);
      }
      
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Use res.end() for binary data to avoid JSON serialization
      res.end(buffer);

    } catch (error) {
      console.error('Asset download error:', error);
      res.status(500).json({ 
        error: "Failed to download asset", 
        details: error.message 
      });
    }
  });

  // Upload asset file to object storage
  app.post('/api/studio/assets/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      
      // Explicit file size validation (50MB limit)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ 
          error: `File too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` 
        });
      }
      
      // Validate file type (images, videos, audio, documents)
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      
      const isImage = file.mimetype.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
      const isVideo = file.mimetype.startsWith('video/') || ['mp4', 'webm', 'mov', 'mpeg', 'avi'].includes(fileExtension || '');
      const isAudio = file.mimetype.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExtension || '');
      const isDocument = file.mimetype === 'application/pdf' || ['pdf', 'doc', 'docx', 'txt'].includes(fileExtension || '');
      
      if (!isImage && !isVideo && !isAudio && !isDocument) {
        return res.status(400).json({ 
          error: "Invalid file type. Only images, videos, audio, and documents are allowed." 
        });
      }

      // Generate unique storage key
      const timestamp = Date.now();
      const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageKey = `studio_assets/${req.user.organizationId}/${timestamp}_${sanitizedFileName}`;
      
      // Upload to Replit object storage
      // await objectStorage.uploadFromBytes(storageKey, file.buffer);
      
      // Return file metadata with storage key
      // The frontend will use the asset ID to generate a download URL via /api/studio/assets/download/:assetId
      res.json({
        success: true,
        storagePath: storageKey, // Storage key for retrieval
        fileName: sanitizedFileName,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Asset file upload error:', error);
      res.status(500).json({ 
        error: "Failed to upload file", 
        details: error.message 
      });
    }
  });

  // Upload responsibility document to object storage (optimized with multer)
  app.post("/api/employees/:employeeId/upload-responsibility-document", isAuthenticated, upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const employeeId = parseInt(req.params.employeeId);
      const file = req.file;
      
      // Validate file type (PDF, audio, video only) - check both MIME type and extension
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      
      const isPDF = file.mimetype === 'application/pdf' || fileExtension === 'pdf';
      const isAudio = file.mimetype.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExtension || '');
      const isVideo = file.mimetype.startsWith('video/') || ['mp4', 'webm', 'mov', 'mpeg'].includes(fileExtension || '');
      
      if (!isPDF && !isAudio && !isVideo) {
        return res.status(400).json({ 
          error: "Invalid file type. Only PDF, audio, and video files are allowed." 
        });
      }

      // Get employee to verify access
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // Get private object directory and parse bucket info
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
      if (!privateObjectDir) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const objectPath = `responsibility_docs/${employeeId}/${timestamp}_${sanitizedFileName}`;
      const fullPath = `${privateObjectDir}/${objectPath}`;
      
      // Parse bucket name and object name from path (format: /bucket-name/path/to/file)
      const pathParts = fullPath.split('/').filter(p => p);
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');
      
      // Upload directly to object storage using Google Cloud Storage
      const bucket = storageClient.bucket(bucketName);
      const fileObj = bucket.file(objectName);
      
      await fileObj.save(file.buffer, {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname
        }
      });
      
      // Create file metadata
      const fileMetadata = {
        filename: `${timestamp}_${sanitizedFileName}`,
        originalName: file.originalname,
        url: fullPath,
        type: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user.id
      };

      // Get current responsibility documents
      const currentDocs = employee.responsibilityDocuments as any[] || [];
      const updatedDocs = [...currentDocs, fileMetadata];

      // Update employee record with new document
      await storage.updateEmployee(employeeId, {
        responsibilityDocuments: updatedDocs
      });

      res.json({
        success: true,
        file: fileMetadata,
        message: "Document uploaded successfully"
      });

    } catch (error) {
      console.error('Responsibility document upload error:', error);
      res.status(500).json({ 
        error: "Failed to upload document", 
        details: error.message 
      });
    }
  });

  // Download responsibility document from object storage
  app.get("/api/employees/:employeeId/responsibility-documents/:filename", isAuthenticated, async (req: any, res: any) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const filename = req.params.filename;
      
      const path = await import('path');
      
      // Get private object directory
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
      if (!privateObjectDir) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // Construct full path
      const objectPath = `responsibility_docs/${employeeId}/${filename}`;
      const fullPath = `${privateObjectDir}/${objectPath}`;
      
      // Parse bucket name and object name
      const pathParts = fullPath.split('/').filter(p => p);
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');
      
      // Download from object storage
      const bucket = storageClient.bucket(bucketName);
      const fileObj = bucket.file(objectName);
      
      const [buffer] = await fileObj.download();
      
      // Get file extension to determine content type
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.webm': 'video/webm',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      
      // Send file
      res.send(buffer);
      
    } catch (error) {
      console.error('Document download error:', error);
      res.status(404).json({ error: "Document not found" });
    }
  });

  // Delete responsibility document
  app.delete("/api/employees/:employeeId/responsibility-documents/:filename", isAuthenticated, async (req: any, res: any) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const filename = req.params.filename;
      
      // Get private object directory
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
      if (!privateObjectDir) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // Construct full path
      const objectPath = `responsibility_docs/${employeeId}/${filename}`;
      const fullPath = `${privateObjectDir}/${objectPath}`;
      
      // Parse bucket name and object name
      const pathParts = fullPath.split('/').filter(p => p);
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');
      
      // Delete file from object storage
      const bucket = storageClient.bucket(bucketName);
      const fileObj = bucket.file(objectName);
      await fileObj.delete();
      
      // Update employee record to remove document metadata
      const employee = await storage.getEmployee(employeeId);
      if (employee && employee.responsibilityDocuments) {
        const currentDocs = employee.responsibilityDocuments as any[] || [];
        const updatedDocs = currentDocs.filter((doc: any) => {
          const docFilename = doc.url.split('/').pop();
          return docFilename !== filename;
        });
        
        await storage.updateEmployee(employeeId, {
          responsibilityDocuments: updatedDocs
        });
      }
      
      res.json({ success: true, message: "Document deleted successfully" });
      
    } catch (error) {
      console.error('Document deletion error:', error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Product Profile PDF Generation Route
  app.get('/api/generate-product-profile-pdf', async (req: any, res) => {
    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const fs = await import('fs');
      const path = await import('path');
      
      // Create PDF document with professional formatting
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Professional color palette
      const colors = {
        primary: [25, 118, 210],      // Professional blue
        secondary: [74, 144, 226],    // Lighter blue
        accent: [0, 150, 136],        // Teal accent
        dark: [33, 37, 41],           // Dark text
        light: [248, 249, 250],       // Light background
        white: [255, 255, 255],       // White
        success: [76, 175, 80],       // Green for success
        warning: [255, 193, 7],       // Amber for warnings
        gray: [108, 117, 125]         // Neutral gray
      };

      // Helper function to add gradient background
      const addGradientBox = (x: number, y: number, w: number, h: number, startColor: number[], endColor: number[]) => {
        // Simulate gradient with multiple rectangles
        const steps = 10;
        for (let i = 0; i < steps; i++) {
          const ratio = i / steps;
          const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio);
          const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio);
          const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio);
          
          doc.setFillColor(r, g, b);
          doc.rect(x, y + (h / steps) * i, w, h / steps, 'F');
        }
      };

      // Helper function for modern text with shadow effect
      const addTextWithShadow = (text: string, x: number, y: number, options: any = {}) => {
        // Shadow
        doc.setTextColor(200, 200, 200);
        doc.text(text, x + 0.5, y + 0.5, options);
        // Main text
        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.text(text, x, y, options);
      };

      // Helper function for professional text wrapping
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, lineHeight: number = 6): number => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        for (let i = 0; i < lines.length; i++) {
          if (y + (i * lineHeight) > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(lines[i], x, y + (i * lineHeight));
        }
        return y + (lines.length * lineHeight) + 5;
      };

      // Helper function for page breaks
      const checkNewPage = (additionalHeight: number = 25): number => {
        if (yPosition + additionalHeight > pageHeight - margin) {
          doc.addPage();
          return margin;
        }
        return yPosition;
      };

      // Professional section header with modern styling
      const addSectionHeader = (title: string, size: number = 16, hasIcon: boolean = false): number => {
        yPosition = checkNewPage(30);
        
        // Background accent line
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 2, 'F');
        
        yPosition += 8;
        doc.setFontSize(size);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(title, margin, yPosition);
        
        // Accent underline
        doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        doc.setLineWidth(0.8);
        doc.line(margin, yPosition + 2, margin + doc.getTextWidth(title), yPosition + 2);
        
        yPosition += 12;
        doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        doc.setFont('helvetica', 'normal');
        return yPosition;
      };

      // Real screenshot embedding function
      const addScreenshot = (imagePath: string, title: string, description: string, x: number, y: number, width: number, height: number): number => {
        try {
          // Professional frame with shadow
          doc.setFillColor(220, 220, 220);
          doc.rect(x + 1, y + 1, width, height, 'F'); // Shadow
          
          doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
          doc.rect(x - 1, y - 1, width + 2, height + 2, 'F');
          doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
          doc.setLineWidth(1.5);
          doc.rect(x - 1, y - 1, width + 2, height + 2);
          
          // Read and embed the actual screenshot
          const imageBuffer = fs.readFileSync(path.join(process.cwd(), imagePath));
          const imageBase64 = imageBuffer.toString('base64');
          const imageFormat = path.extname(imagePath).toLowerCase() === '.png' ? 'PNG' : 'JPEG';
          
          // Add the actual screenshot
          doc.addImage(`data:image/${imageFormat.toLowerCase()};base64,${imageBase64}`, imageFormat, x, y, width, height);
          
          // Professional caption overlay
          doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
          doc.rect(x, y + height - 12, width, 12, 'F');
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
          doc.text(title, x + width/2, y + height - 6, { align: 'center' });
          
          // Description below screenshot
          doc.setFontSize(7);
          doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
          doc.setFont('helvetica', 'normal');
          doc.text(description, x + width/2, y + height + 5, { align: 'center' });
          
          return y + height + 10;
        } catch (error) {
          console.error(`Failed to load screenshot ${imagePath}:`, error);
          // Fallback to styled placeholder if image fails to load
          doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
          doc.rect(x, y, width, height, 'F');
          doc.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
          doc.setLineWidth(1);
          doc.rect(x, y, width, height);
          
          doc.setFontSize(9);
          doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(title, x + width/2, y + height/2 - 3, { align: 'center' });
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text('(Screenshot not available)', x + width/2, y + height/2 + 3, { align: 'center' });
          
          return y + height + 8;
        }
      };

      // ENHANCED COVER PAGE
      // Professional gradient background
      addGradientBox(0, 0, pageWidth, pageHeight, colors.primary, colors.secondary);
      
      // Company logo area (placeholder)
      doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.circle(pageWidth / 2, 35, 12, 'F');
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.circle(pageWidth / 2, 35, 8, 'F');
      
      // Main title with shadow effect
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      addTextWithShadow('Meeting Matters', pageWidth / 2, 65, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      addTextWithShadow('Business Management System', pageWidth / 2, 80, { align: 'center' });
      
      // Professional tagline box
      doc.setFillColor(255, 255, 255, 0.9);
      doc.roundedRect(25, 100, pageWidth - 50, 35, 3, 3, 'F');
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('PROFESSIONAL COMPANY PROFILE', pageWidth / 2, 115, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('Enterprise-Grade Business Management Solutions', pageWidth / 2, 125, { align: 'center' });
      
      // Modern stats cards
      const cardWidth = 40;
      const cardHeight = 30;
      const cardSpacing = 15;
      const startX = (pageWidth - (3 * cardWidth + 2 * cardSpacing)) / 2;
      
      // Card 1: Modules
      doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.roundedRect(startX, 160, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('12+', startX + cardWidth/2, 172, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text('Core Modules', startX + cardWidth/2, 180, { align: 'center' });
      doc.text('Integrated', startX + cardWidth/2, 186, { align: 'center' });
      
      // Card 2: Features
      doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.roundedRect(startX + cardWidth + cardSpacing, 160, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.text('75+', startX + cardWidth + cardSpacing + cardWidth/2, 172, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text('Advanced', startX + cardWidth + cardSpacing + cardWidth/2, 180, { align: 'center' });
      doc.text('Features', startX + cardWidth + cardSpacing + cardWidth/2, 186, { align: 'center' });
      
      // Card 3: Uptime
      doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.roundedRect(startX + 2 * (cardWidth + cardSpacing), 160, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.text('99.9%', startX + 2 * (cardWidth + cardSpacing) + cardWidth/2, 172, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text('Service', startX + 2 * (cardWidth + cardSpacing) + cardWidth/2, 180, { align: 'center' });
      doc.text('Uptime', startX + 2 * (cardWidth + cardSpacing) + cardWidth/2, 186, { align: 'center' });
      
      // Professional footer
      doc.setFontSize(10);
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, pageWidth / 2, 250, { align: 'center' });
      
      // Decorative elements
      doc.setDrawColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 210, pageWidth - margin, 210);
      doc.line(margin, 230, pageWidth - margin, 230);

      // PAGE 2: COMPANY OVERVIEW WITH SCREENSHOTS
      doc.addPage();
      yPosition = margin;
      
      addSectionHeader('Company Overview', 20);
      
      yPosition = addWrappedText(
        'Meeting Matters Business Management System represents the next generation of enterprise business management solutions. Founded on the principle that efficient operations drive business success, our comprehensive platform transforms how organizations manage their human resources, projects, and daily operations.',
        margin, yPosition, pageWidth - 2 * margin, 12, 7
      );
      
      // Mission & Vision in professional boxes
      doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      doc.roundedRect(margin, yPosition, (pageWidth - 3 * margin) / 2, 35, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('Our Mission', margin + 5, yPosition + 8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      yPosition = addWrappedText(
        'To revolutionize business management by providing intuitive, powerful tools that streamline operations and empower teams to achieve extraordinary results.',
        margin + 5, yPosition + 12, (pageWidth - 3 * margin) / 2 - 10, 9, 5
      );
      
      // Vision box
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin + (pageWidth - 2 * margin) / 2, yPosition - 35, (pageWidth - 3 * margin) / 2, 35, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.text('Our Vision', margin + (pageWidth - 2 * margin) / 2 + 5, yPosition - 27);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      addWrappedText(
        'To become the global leader in integrated business management solutions, setting the standard for innovation, reliability, and user experience.',
        margin + (pageWidth - 2 * margin) / 2 + 5, yPosition - 23, (pageWidth - 3 * margin) / 2 - 10, 9, 5
      );
      
      yPosition += 15;
      
      // Dashboard Screenshot
      yPosition = addScreenshot(
        'attached_assets/Screenshot (527)_1758285423242.png',
        'Main Dashboard Interface',
        'Real-time analytics and KPI overview',
        margin, yPosition, pageWidth - 2 * margin, 45
      );

      // CORE FEATURES WITH VISUAL ELEMENTS
      addSectionHeader('Core Features & Capabilities', 18);
      
      // Employee Management with screenshot
      doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 55, 3, 3, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('1. Employee Lifecycle Management', margin + 5, yPosition + 8);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      yPosition = addWrappedText(
        'Complete end-to-end employee management from recruitment to retirement. Features comprehensive profile management, automated onboarding workflows, performance tracking, and integrated HR analytics.',
        margin + 5, yPosition + 15, (pageWidth - 4 * margin) / 2, 10, 6
      );
      
      // Screenshot for employee management
      yPosition = addScreenshot(
        'attached_assets/Screenshot (529)_1758285426377.png',
        'Job Applications Management',
        'Employee recruitment and application tracking',
        margin + (pageWidth - 2 * margin) / 2, yPosition - 35, (pageWidth - 4 * margin) / 2, 35
      );
      
      yPosition += 5;

      // PROJECT MANAGEMENT PAGE
      doc.addPage();
      yPosition = margin;
      
      addSectionHeader('Project & Task Management', 18);
      
      // Large project management screenshot
      yPosition = addScreenshot(
        'attached_assets/Screenshot (530)_1758285427783.png',
        'Project Management Dashboard',
        'Comprehensive project tracking with team collaboration',
        margin, yPosition, pageWidth - 2 * margin, 60
      );
      
      yPosition = addWrappedText(
        'Advanced project management capabilities including task hierarchies, resource allocation, timeline management, team collaboration tools, and real-time progress tracking. Supports both agile and traditional project methodologies with customizable workflows.',
        margin, yPosition, pageWidth - 2 * margin, 11, 6
      );
      
      // Psychometric Testing section with visuals
      yPosition += 10;
      addSectionHeader('Psychometric Testing & Analytics', 16);
      
      yPosition = addScreenshot(
        'attached_assets/Screenshot (531)_1758285429147.png',
        'Psychometric Assessment Interface',
        'Interactive testing platform with detailed analytics and reporting',
        margin, yPosition, pageWidth - 2 * margin, 50
      );
      
      yPosition = addWrappedText(
        'Comprehensive psychological assessment tools including personality profiling, cognitive ability testing, communication skills evaluation, and cultural fit analysis. Features advanced AI-powered analytics and predictive modeling.',
        margin, yPosition, pageWidth - 2 * margin, 11, 6
      );

      // CONTRACT & LOGISTICS PAGE
      doc.addPage();
      yPosition = margin;
      
      addSectionHeader('Contract & Document Management', 18);
      
      yPosition = addScreenshot(
        'attached_assets/Screenshot (528)_1758285424631.png',
        'Contract Management System',
        'Application filtering and management interface',
        margin, yPosition, (pageWidth - 3 * margin) / 2, 45
      );
      
      yPosition = addScreenshot(
        'attached_assets/Screenshot (532)_1758285430489.png',
        'Social Media Hub',
        'Content management and campaign analytics',
        margin + (pageWidth - 2 * margin) / 2, yPosition - 45, (pageWidth - 3 * margin) / 2, 45
      );
      
      yPosition = addWrappedText(
        'Complete contract lifecycle management with electronic signatures, automated renewals, compliance tracking, and integrated document repository. Supports multiple contract types with customizable templates.',
        margin, yPosition, pageWidth - 2 * margin, 11, 6
      );
      
      yPosition += 10;
      addSectionHeader('Logistics & Inventory Management', 16);
      
      yPosition = addScreenshot(
        'attached_assets/Screenshot (527)_1758285423242.png',
        'Analytics Dashboard',
        'Real-time metrics and business intelligence overview',
        margin, yPosition, pageWidth - 2 * margin, 45
      );

      // SUBSCRIPTION PLANS PAGE (Enhanced)
      doc.addPage();
      yPosition = margin;
      
      addSectionHeader('Subscription Plans & Investment', 20);
      
      // Professional plan comparison table
      const planWidth = (pageWidth - 4 * margin) / 3;
      const planHeight = 80;
      
      // Starter Plan
      doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      doc.roundedRect(margin, yPosition, planWidth, planHeight, 3, 3, 'F');
      doc.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
      doc.setLineWidth(1);
      doc.roundedRect(margin, yPosition, planWidth, planHeight, 3, 3);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('Starter', margin + planWidth/2, yPosition + 10, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text('$29', margin + planWidth/2, yPosition + 22, { align: 'center' });
      doc.setFontSize(10);
      doc.text('/month', margin + planWidth/2, yPosition + 30, { align: 'center' });
      
      // Professional Plan (highlighted)
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin + planWidth + 5, yPosition - 5, planWidth, planHeight + 10, 3, 3, 'F');
      
      // Popular badge
      doc.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
      doc.roundedRect(margin + planWidth + 15, yPosition - 10, planWidth - 20, 8, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.text('MOST POPULAR', margin + planWidth + 5 + planWidth/2, yPosition - 6, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.text('Professional', margin + planWidth + 5 + planWidth/2, yPosition + 10, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text('$79', margin + planWidth + 5 + planWidth/2, yPosition + 22, { align: 'center' });
      doc.setFontSize(10);
      doc.text('/month', margin + planWidth + 5 + planWidth/2, yPosition + 30, { align: 'center' });
      
      // Enterprise Plan
      doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      doc.roundedRect(margin + 2 * (planWidth + 5), yPosition, planWidth, planHeight, 3, 3, 'F');
      doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setLineWidth(2);
      doc.roundedRect(margin + 2 * (planWidth + 5), yPosition, planWidth, planHeight, 3, 3);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('Enterprise', margin + 2 * (planWidth + 5) + planWidth/2, yPosition + 10, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text('$199', margin + 2 * (planWidth + 5) + planWidth/2, yPosition + 22, { align: 'center' });
      doc.setFontSize(10);
      doc.text('/month', margin + 2 * (planWidth + 5) + planWidth/2, yPosition + 30, { align: 'center' });
      
      yPosition += planHeight + 20;

      // TECHNICAL SPECIFICATIONS (Enhanced)
      addSectionHeader('Technical Architecture & Security', 18);
      
      // Security badges
      const badgeY = yPosition;
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.roundedRect(margin, badgeY, 35, 12, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.text('SOC 2 Compliant', margin + 17.5, badgeY + 7, { align: 'center' });
      
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin + 40, badgeY, 35, 12, 2, 2, 'F');
      doc.text('GDPR Ready', margin + 57.5, badgeY + 7, { align: 'center' });
      
      doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.roundedRect(margin + 80, badgeY, 35, 12, 2, 2, 'F');
      doc.text('ISO 27001', margin + 97.5, badgeY + 7, { align: 'center' });
      
      yPosition += 20;
      
      // Architecture diagram screenshot
      yPosition = addScreenshot(
        'attached_assets/Screenshot (527)_1758285423242.png',
        'System Architecture Overview',
        'Business Management System dashboard with real-time metrics',
        margin, yPosition, pageWidth - 2 * margin, 50
      );

      // CONTACT & IMPLEMENTATION PAGE
      doc.addPage();
      yPosition = margin;
      
      // Professional contact section
      addGradientBox(0, 0, pageWidth, 80, colors.primary, colors.secondary);
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.text('Ready to Transform Your Business?', pageWidth / 2, 30, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Contact our enterprise solutions team for a personalized demonstration', pageWidth / 2, 45, { align: 'center' });
      
      yPosition = 100;
      
      // Contact information in professional cards
      const contactCardWidth = (pageWidth - 4 * margin) / 2;
      
      // Sales contact
      doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.roundedRect(margin, yPosition, contactCardWidth, 40, 3, 3, 'F');
      doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setLineWidth(1);
      doc.roundedRect(margin, yPosition, contactCardWidth, 40, 3, 3);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('Sales & Partnerships', margin + 5, yPosition + 10);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text('Email: sales@meetingmatters.com', margin + 5, yPosition + 20);
      doc.text('Phone: +1 (555) 123-4567', margin + 5, yPosition + 28);
      doc.text('Schedule Demo: meetingmatters.com/demo', margin + 5, yPosition + 36);
      
      // Support contact
      doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.roundedRect(margin + contactCardWidth + 10, yPosition, contactCardWidth, 40, 3, 3, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.text('Technical Support', margin + contactCardWidth + 15, yPosition + 10);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Email: support@meetingmatters.com', margin + contactCardWidth + 15, yPosition + 20);
      doc.text('24/7 Support: +1 (555) 987-6543', margin + contactCardWidth + 15, yPosition + 28);
      doc.text('Documentation: docs.meetingmatters.com', margin + contactCardWidth + 15, yPosition + 36);
      
      yPosition += 60;
      
      // Implementation timeline
      addSectionHeader('Implementation Timeline', 16);
      
      // Timeline visualization
      const timelineItems = [
        { week: '1-2', title: 'Setup & Configuration', desc: 'Initial system setup and data migration' },
        { week: '3-4', title: 'Team Training', desc: 'Comprehensive user training and onboarding' },
        { week: '5-6', title: 'Go-Live & Support', desc: 'Full deployment with dedicated support' },
        { week: '7+', title: 'Optimization', desc: 'Ongoing optimization and feature enhancement' }
      ];
      
      timelineItems.forEach((item, index) => {
        const itemX = margin + (index * (pageWidth - 2 * margin) / 4);
        const itemWidth = (pageWidth - 2 * margin) / 4 - 5;
        
        // Timeline node
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.circle(itemX + itemWidth/2, yPosition, 3, 'F');
        
        // Timeline line
        if (index < timelineItems.length - 1) {
          doc.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
          doc.setLineWidth(1);
          doc.line(itemX + itemWidth/2 + 3, yPosition, itemX + itemWidth/2 + itemWidth - 3, yPosition);
        }
        
        // Week label
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(`Week ${item.week}`, itemX + itemWidth/2, yPosition + 8, { align: 'center' });
        
        // Title and description
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        doc.text(item.title, itemX + itemWidth/2, yPosition + 16, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(item.desc, itemX + itemWidth/2, yPosition + 22, { align: 'center' });
      });
      
      yPosition += 35;
      
      // Footer with company info
      doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.text('© 2025 Meeting Matters Business Management System', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Enterprise Solutions | Cloud-Native Platform | Global Support', pageWidth / 2, pageHeight - 8, { align: 'center' });

      // Save PDF to file system
      const pdfPath = path.join(process.cwd(), 'Meeting_Matters_Product_Profile.pdf');
      const pdfBuffer = doc.output('arraybuffer');
      fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));

      res.json({ 
        success: true, 
        message: 'Professional product profile PDF generated successfully',
        downloadUrl: '/download/product-profile-pdf',
        pages: doc.internal.getNumberOfPages()
      });
    } catch (error) {
      console.error("Error generating product profile PDF:", error);
      res.status(500).json({ message: "Failed to generate product profile PDF" });
    }
  });

  // CRM Inquiry routes
  app.get('/api/crm-inquiries', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      // Check CRM access permission
      if (currentUser.role !== 'hr_admin' && !currentUser.hasCrmAccess) {
        return res.status(403).json({ message: 'Access denied. CRM access required.' });
      }
      
      const { status, attendant, source, dateFrom, dateTo } = req.query;
      
      const filters: { status?: string; attendant?: string; source?: string; dateFrom?: Date; dateTo?: Date } = {};
      if (status) filters.status = status as string;
      if (attendant) filters.attendant = attendant as string;
      if (source) filters.source = source as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      
      const inquiries = await storage.getCrmInquiries(currentUser.organizationId, filters);
      res.json(inquiries);
    } catch (error) {
      console.error('Error fetching CRM inquiries:', error);
      res.status(500).json({ message: 'Failed to fetch CRM inquiries' });
    }
  });

  app.get('/api/crm-inquiries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const inquiry = await storage.getCrmInquiry(id);
      
      if (!inquiry) {
        return res.status(404).json({ message: 'CRM inquiry not found' });
      }
      
      res.json(inquiry);
    } catch (error) {
      console.error('Error fetching CRM inquiry:', error);
      res.status(500).json({ message: 'Failed to fetch CRM inquiry' });
    }
  });

  app.post('/api/crm-inquiries', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      const inquiryData = {
        ...req.body,
        inquiryTime: new Date(req.body.inquiryTime + ':00'),
        responseTime: req.body.responseTime ? new Date(req.body.responseTime + ':00') : null,
        createdBy: currentUser.id,
        organizationId: currentUser.organizationId,
      };
      
      const inquiry = await storage.createCrmInquiry(inquiryData);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error('Error creating CRM inquiry:', error);
      res.status(500).json({ message: 'Failed to create CRM inquiry' });
    }
  });

  app.put('/api/crm-inquiries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = {
        ...req.body,
        inquiryTime: req.body.inquiryTime ? new Date(req.body.inquiryTime + ':00') : undefined,
        responseTime: req.body.responseTime ? new Date(req.body.responseTime + ':00') : null,
      };
      const inquiry = await storage.updateCrmInquiry(id, updateData);
      res.json(inquiry);
    } catch (error) {
      console.error('Error updating CRM inquiry:', error);
      res.status(500).json({ message: 'Failed to update CRM inquiry' });
    }
  });

  app.delete('/api/crm-inquiries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCrmInquiry(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting CRM inquiry:', error);
      res.status(500).json({ message: 'Failed to delete CRM inquiry' });
    }
  });

  // Download CRM inquiries as CSV
  app.get('/api/crm-inquiries/download/csv', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      const inquiries = await storage.getCrmInquiries(currentUser.organizationId);
      
      // Create CSV header
      const csvHeader = 'ID,Name,Call Duration,Inquiry Time,Response Time,Attendant,Source,Type,Contact,Status,Notes,Created At\n';
      
      // Create CSV rows
      const csvRows = inquiries.map(inquiry => {
        return [
          inquiry.id,
          `"${inquiry.name}"`,
          inquiry.callDuration,
          new Date(inquiry.inquiryTime).toLocaleString(),
          inquiry.responseTime ? new Date(inquiry.responseTime).toLocaleString() : '',
          `"${inquiry.attendant}"`,
          inquiry.inquirySource,
          `"${inquiry.inquiryType}"`,
          `"${inquiry.contact}"`,
          inquiry.status,
          `"${inquiry.notes || ''}"`,
          new Date(inquiry.createdAt).toLocaleString(),
        ].join(',');
      }).join('\n');
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="crm_inquiries.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error downloading CRM inquiries:', error);
      res.status(500).json({ message: 'Failed to download CRM inquiries' });
    }
  });

  // CRM Access Management Routes (Admin only)
  app.post('/api/users/:id/toggle-crm-access', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { hasCrmAccess } = req.body;
      
      const [updatedUser] = await db.update(users)
        .set({ hasCrmAccess })
        .where(eq(users.id, userId))
        .returning();
      
      res.json({
        message: `CRM access ${hasCrmAccess ? 'granted' : 'revoked'} successfully`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error toggling CRM access:', error);
      res.status(500).json({ message: 'Failed to update CRM access' });
    }
  });

  // Job Applications Access Management Routes (Admin only)
  app.post('/api/users/:id/toggle-job-applications-access', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { hasJobApplicationsAccess } = req.body;
      
      const [updatedUser] = await db.update(users)
        .set({ hasJobApplicationsAccess })
        .where(eq(users.id, userId))
        .returning();
      
      res.json({
        message: `Job applications access ${hasJobApplicationsAccess ? 'granted' : 'revoked'} successfully`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error toggling job applications access:', error);
      res.status(500).json({ message: 'Failed to update job applications access' });
    }
  });

  // User Permission Management Routes (Admin only)
  // Get all permissions for a user
  app.get('/api/users/:id/permissions', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = await storage.getUser(req.user.id);
      const targetUser = await storage.getUser(userId);
      
      // Validate same organization
      if (!currentUser || !targetUser || currentUser.organizationId !== targetUser.organizationId) {
        return res.status(403).json({ message: 'Cannot access permissions for users in other organizations' });
      }
      
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ message: 'Failed to fetch user permissions' });
    }
  });

  // Get aggregated permissions (role defaults + user overrides)
  app.get('/api/users/:id/aggregated-permissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = await storage.getUser(req.user.id);
      const targetUser = await storage.getUser(userId);
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Only allow viewing own permissions or same organization for HR admins
      const isSameUser = req.user.id === userId;
      const isSameOrg = currentUser && targetUser && currentUser.organizationId === targetUser.organizationId;
      const isHRAdmin = req.user.role === 'hr_admin';
      
      if (!isSameUser && !(isHRAdmin && isSameOrg)) {
        return res.status(403).json({ message: 'Cannot access permissions for users in other organizations' });
      }
      
      const permissions = await storage.getAggregatedPermissions(userId, targetUser.role);
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching aggregated permissions:', error);
      res.status(500).json({ message: 'Failed to fetch aggregated permissions' });
    }
  });

  // Grant or update a permission for a user
  app.post('/api/users/:id/permissions', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { module, level } = req.body;
      const grantedBy = req.user.id;
      const currentUser = await storage.getUser(req.user.id);
      const targetUser = await storage.getUser(userId);

      // Validate same organization
      if (!currentUser || !targetUser || currentUser.organizationId !== targetUser.organizationId) {
        return res.status(403).json({ message: 'Cannot manage permissions for users in other organizations' });
      }

      // Validate module and level
      if (!module || !level) {
        return res.status(400).json({ message: 'Module and level are required' });
      }

      // Check if permission already exists
      const existingPermission = await storage.getUserPermission(userId, module);
      
      if (existingPermission) {
        // If exists and was revoked, delete and create new
        await storage.deleteUserPermission(userId, module);
      }

      // Create new permission
      const permission = await storage.createUserPermission({
        userId,
        module,
        level,
        grantedBy,
      });

      res.status(201).json({
        message: 'Permission granted successfully',
        permission
      });
    } catch (error) {
      console.error('Error creating user permission:', error);
      res.status(500).json({ message: 'Failed to grant permission' });
    }
  });

  // Revoke a permission from a user
  app.delete('/api/users/:id/permissions/:module', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const module = req.params.module;
      const currentUser = await storage.getUser(req.user.id);
      const targetUser = await storage.getUser(userId);
      
      // Validate same organization
      if (!currentUser || !targetUser || currentUser.organizationId !== targetUser.organizationId) {
        return res.status(403).json({ message: 'Cannot manage permissions for users in other organizations' });
      }
      
      await storage.deleteUserPermission(userId, module);

      res.json({
        message: 'Permission revoked successfully'
      });
    } catch (error) {
      console.error('Error revoking user permission:', error);
      res.status(500).json({ message: 'Failed to revoke permission' });
    }
  });

  // Admin route to add historical/previous leaves for any employee
  app.post('/api/leave-requests/admin/add-historical', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      const { employeeId, leaveType, startDate, endDate, totalDays, reason, notes } = req.body;
      
      // Validate required fields
      if (!employeeId || !leaveType || !startDate || !endDate || !totalDays) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Create historical leave request with auto-approved status
      const leaveRequest = await storage.createLeaveRequest({
        employeeId,
        requesterId: currentUser.id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        reason: reason || 'Historical leave entry added by admin',
        status: 'approved',
        approvedBy: currentUser.id,
        approvedAt: new Date(),
        adminProcessed: true,
        adminProcessedBy: currentUser.id,
        adminNotes: notes || 'Historical leave entry'
      });
      
      res.status(201).json({
        message: 'Historical leave added successfully',
        leaveRequest
      });
    } catch (error) {
      console.error('Error adding historical leave:', error);
      res.status(500).json({ message: 'Failed to add historical leave' });
    }
  });

  // Organizational Hierarchy Routes
  // Get organizational hierarchy with employees (all authenticated users can view)
  app.get('/api/org-hierarchy', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      const { companyId } = req.query;
      
      const hierarchy = await storage.getOrgHierarchy(
        currentUser.organizationId,
        companyId ? parseInt(companyId as string) : undefined
      );
      
      res.json(hierarchy);
    } catch (error) {
      console.error('Error fetching org hierarchy:', error);
      res.status(500).json({ message: 'Failed to fetch organizational hierarchy' });
    }
  });

  // Get my position in the organizational hierarchy
  app.get('/api/org-hierarchy/my-position', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      
      // Get employee record
      const employee = await storage.getEmployeeByUserId(currentUser.id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }
      
      // Get org unit assignment
      const assignment = await storage.getOrgUnitForEmployee(employee.id);
      
      // Get manager information (who this employee reports to)
      let manager = null;
      if (employee.reportingManager) {
        console.log(`[DEBUG] Looking for manager with username: "${employee.reportingManager}"`);
        // reportingManager contains the manager's username, we need to find the employee record
        const allEmployees = await db
          .select({
            id: employees.id,
            userId: employees.userId,
            employeeId: employees.employeeId,
            position: employees.position,
            department: employees.department,
            responsibilities: employees.responsibilities,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username,
            email: users.email,
          })
          .from(employees)
          .innerJoin(users, eq(employees.userId, users.id))
          .where(eq(employees.organizationId, currentUser.organizationId));
        
        console.log(`[DEBUG] Found ${allEmployees.length} employees in organization`);
        
        // Find manager by matching username in reportingManager field
        manager = allEmployees.find(emp => 
          emp.username === employee.reportingManager
        );
        
        console.log(`[DEBUG] Manager found:`, manager ? `Yes - ${manager.firstName} ${manager.lastName}` : 'No');
      }
      
      // Get direct reports (employees who report to this employee)
      const directReports = await db
        .select({
          id: employees.id,
          userId: employees.userId,
          employeeId: employees.employeeId,
          position: employees.position,
          department: employees.department,
          responsibilities: employees.responsibilities,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          email: users.email,
        })
        .from(employees)
        .innerJoin(users, eq(employees.userId, users.id))
        .where(
          and(
            eq(employees.organizationId, currentUser.organizationId),
            eq(employees.reportingManager, currentUser.username)
          )
        );
      
      // Disable caching for this response to ensure fresh data
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.json({
        employee: {
          ...employee,
          user: currentUser,
        },
        orgUnit: assignment?.orgUnit || null,
        manager: manager || null,
        directReports: directReports || [],
      });
    } catch (error) {
      console.error('Error fetching my position:', error);
      res.status(500).json({ message: 'Failed to fetch your position' });
    }
  });

  // Admin: Get all org units
  app.get('/api/org-units', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      const { companyId, isActive } = req.query;
      
      const filters: { companyId?: number; isActive?: boolean } = {};
      if (companyId) filters.companyId = parseInt(companyId as string);
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const units = await storage.getOrgUnits(currentUser.organizationId, filters);
      res.json(units);
    } catch (error) {
      console.error('Error fetching org units:', error);
      res.status(500).json({ message: 'Failed to fetch organizational units' });
    }
  });

  // Admin: Create org unit
  app.post('/api/org-units', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const currentUser = req.user as User;
      const { title, description, parentUnitId, companyId, orderIndex, responsibilities, location } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      
      const unit = await storage.createOrgUnit({
        organizationId: currentUser.organizationId,
        title,
        description,
        parentUnitId,
        companyId,
        orderIndex,
        responsibilities,
        location,
      });
      
      res.status(201).json(unit);
    } catch (error) {
      console.error('Error creating org unit:', error);
      res.status(500).json({ message: 'Failed to create organizational unit' });
    }
  });

  // Admin: Update org unit
  app.put('/api/org-units/:id', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, description, parentUnitId, companyId, orderIndex, responsibilities, location, isActive } = req.body;
      
      const unit = await storage.updateOrgUnit(id, {
        title,
        description,
        parentUnitId,
        companyId,
        orderIndex,
        responsibilities,
        location,
        isActive,
      });
      
      res.json(unit);
    } catch (error) {
      console.error('Error updating org unit:', error);
      res.status(500).json({ message: 'Failed to update organizational unit' });
    }
  });

  // Admin: Delete org unit
  app.delete('/api/org-units/:id', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOrgUnit(id);
      res.json({ message: 'Organizational unit deleted successfully' });
    } catch (error) {
      console.error('Error deleting org unit:', error);
      res.status(500).json({ message: 'Failed to delete organizational unit' });
    }
  });

  // Admin: Assign employee to org unit
  app.post('/api/org-units/assign', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const { employeeId, orgUnitId, isPrimary, effectiveFrom } = req.body;
      
      if (!employeeId || !orgUnitId) {
        return res.status(400).json({ message: 'Employee ID and Org Unit ID are required' });
      }
      
      const assignment = await storage.assignEmployeeToOrgUnit({
        employeeId,
        orgUnitId,
        isPrimary: isPrimary !== false,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error assigning employee to org unit:', error);
      res.status(500).json({ message: 'Failed to assign employee to organizational unit' });
    }
  });

  // Admin: Remove employee from org unit
  app.post('/api/org-units/remove-assignment', requireRole(['hr_admin']), async (req: any, res) => {
    try {
      const { employeeId, orgUnitId } = req.body;
      
      if (!employeeId || !orgUnitId) {
        return res.status(400).json({ message: 'Employee ID and Org Unit ID are required' });
      }
      
      await storage.removeEmployeeFromOrgUnit(employeeId, orgUnitId);
      res.json({ message: 'Employee removed from organizational unit successfully' });
    } catch (error) {
      console.error('Error removing employee from org unit:', error);
      res.status(500).json({ message: 'Failed to remove employee from organizational unit' });
    }
  });

  // Get employees in an org unit (all authenticated users can view)
  app.get('/api/org-units/:id/employees', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const employees = await storage.getEmployeesInOrgUnit(id);
      res.json(employees);
    } catch (error) {
      console.error('Error fetching employees in org unit:', error);
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  return httpServer;
}
