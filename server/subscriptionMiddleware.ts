import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Define features available for each subscription plan
export const PLAN_FEATURES = {
  starter: [
    'employees',
    'basic_tasks',
    'announcements',
    'basic_profile',
    'basic_onboarding'
  ],
  professional: [
    'employees',
    'basic_tasks',
    'announcements', 
    'basic_profile',
    'basic_onboarding',
    'departments',
    'advanced_tasks',
    'project_management',
    'logistics_basic',
    'recognition',
    'analytics_basic'
  ],
  enterprise: [
    'employees',
    'basic_tasks',
    'announcements',
    'basic_profile', 
    'basic_onboarding',
    'departments',
    'advanced_tasks',
    'project_management',
    'logistics_advanced',
    'recognition',
    'analytics_advanced',
    'psychometric_tests',
    'advanced_onboarding',
    'content_creators',
    'social_media_hub',
    'advanced_reporting',
    'api_access'
  ]
};

// Trial users get Professional plan features during trial
export const TRIAL_FEATURES = PLAN_FEATURES.professional;

export interface AuthenticatedRequest extends Request {
  user?: any; // Use any to avoid conflicts with existing auth system
}

// Middleware to check if user has access to a specific feature
export const requireFeature = (feature: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user is on trial
      const isOnTrial = user.trialEndDate && new Date() < new Date(user.trialEndDate);
      
      let allowedFeatures: string[] = [];
      
      // Admin users and existing original users get full access
      if (user.username === 'admin' || user.organizationId === 'default_meeting_matters_org') {
        allowedFeatures = PLAN_FEATURES.enterprise;
      } else if (isOnTrial) {
        // Trial users get Professional plan features
        allowedFeatures = TRIAL_FEATURES;
      } else if (user.subscriptionPlan && user.subscriptionStatus === 'active') {
        // Active subscription users get their plan features
        allowedFeatures = PLAN_FEATURES[user.subscriptionPlan as keyof typeof PLAN_FEATURES] || [];
      } else {
        // For new users without subscription, give starter access only
        allowedFeatures = PLAN_FEATURES.starter;
      }

      if (!allowedFeatures.includes(feature)) {
        return res.status(403).json({ 
          message: `Feature '${feature}' not available in your current plan`,
          currentPlan: isOnTrial ? 'trial' : user.subscriptionPlan || 'none',
          requiredPlan: getRequiredPlan(feature)
        });
      }

      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Helper function to determine minimum plan required for a feature
function getRequiredPlan(feature: string): string {
  for (const [plan, features] of Object.entries(PLAN_FEATURES)) {
    if (features.includes(feature)) {
      return plan;
    }
  }
  return 'enterprise';
}

// Middleware to get user's current plan and features
export const getUserPlanInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await storage.getUser(req.user.id);
    if (user) {
      const isOnTrial = user.trialEndDate && new Date() < new Date(user.trialEndDate);
      
      let allowedFeatures: string[] = [];
      let currentPlan = 'none';
      
      // Admin users and existing original users get full access
      if (user.username === 'admin' || user.organizationId === 'default_meeting_matters_org') {
        allowedFeatures = PLAN_FEATURES.enterprise;
        currentPlan = 'enterprise';
      } else if (isOnTrial) {
        allowedFeatures = TRIAL_FEATURES;
        currentPlan = 'trial';
      } else if (user.subscriptionPlan && user.subscriptionStatus === 'active') {
        allowedFeatures = PLAN_FEATURES[user.subscriptionPlan as keyof typeof PLAN_FEATURES] || [];
        currentPlan = user.subscriptionPlan;
      } else {
        // For new users without subscription, give starter access only
        allowedFeatures = PLAN_FEATURES.starter;
        currentPlan = 'starter';
      }

      // Add plan info to request for easy access
      (req as any).userPlan = {
        plan: currentPlan,
        features: allowedFeatures,
        isOnTrial
      };
    }

    next();
  } catch (error) {
    console.error('User plan info error:', error);
    next();
  }
};