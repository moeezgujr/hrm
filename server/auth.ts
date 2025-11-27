import "dotenv/config";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { HRNotifications } from './hr-notifications';
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "session",
  });

  // Determine if we're in a secure deployed environment
  // const isDeployment = !!(process.env.REPL_SLUG && process.env.REPL_SLUG !== 'workspace');
  const isSecureEnvironment = process.env.NODE_ENV === 'production'; // || isDeployment;
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isSecureEnvironment, // Enable secure for production or deployed environments
      maxAge: sessionTtl,
      sameSite: isSecureEnvironment ? 'lax' : 'lax', // Use 'lax' for better compatibility
      domain: undefined, // Remove domain restriction for easier deployment
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'username' }, async (identifier, password, done) => {
      try {
        // Support both email and username login
        let user;
        if (identifier.includes('@')) {
          user = await storage.getUserByEmail(identifier);
        } else {
          user = await storage.getUserByUsername(identifier);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        
        // Check if account is enabled (for employees who need to complete onboarding)
        if (user.role === 'employee' && user.accountEnabled === false) {
          return done(null, false, { message: 'Account disabled. Please complete your onboarding first.' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName, position, phoneNumber } = req.body;
      
      // Check for existing user with same username or email
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Check for existing registration request
      const existingRequest = await storage.getRegistrationRequestByEmail(email);
      if (existingRequest) {
        return res.status(400).json({ message: "Registration request already exists for this email" });
      }

      const hashedPassword = await hashPassword(password);
      
      // Create registration request instead of user
      const registrationRequest = await storage.createRegistrationRequest({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        position,
        phoneNumber,
        requestedRole: 'employee',
        requestedDepartment: null,
      });

      // Send HR notification about new registration
      HRNotifications.userRegistered({
        firstName,
        lastName,
        email,
        username,
        requestedRole: 'employee',
        requestedDepartment: 'Not specified',
        position: position || 'Not specified'
      });

      // Return success message without logging in
      res.status(201).json({
        message: "Registration request submitted successfully. Your account will be activated after HR approval.",
        requestId: registrationRequest.id,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), async (req, res) => {
    const user = req.user as SelectUser;
    
    // Check if user status allows login
    if (user.status === 'pending_approval') {
      return res.status(403).json({ 
        message: "Account pending approval. Please wait for HR to activate your account." 
      });
    }
    
    if (user.status === 'onboarding') {
      // Allow login but indicate onboarding is required
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        requiresOnboarding: true
      });
    }
    
    try {
      // Get aggregated permissions for the user
      const permissions = await storage.getAggregatedPermissions(user.id, user.role);
      
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        hasCrmAccess: user.hasCrmAccess,
        hasJobApplicationsAccess: user.hasJobApplicationsAccess,
        permissions, // Include aggregated permissions
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      // Return user without permissions if there's an error
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        hasCrmAccess: user.hasCrmAccess,
        hasJobApplicationsAccess: user.hasJobApplicationsAccess,
        permissions: {}, // Empty permissions on error
      });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    
    try {
      // Get aggregated permissions for the user
      const permissions = await storage.getAggregatedPermissions(user.id, user.role);
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        hasCrmAccess: user.hasCrmAccess,
        hasJobApplicationsAccess: user.hasJobApplicationsAccess,
        permissions, // Include aggregated permissions
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      // Return user without permissions if there's an error
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        hasCrmAccess: user.hasCrmAccess,
        hasJobApplicationsAccess: user.hasJobApplicationsAccess,
        permissions: {}, // Empty permissions on error
      });
    }
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Log authentication failure for debugging
  console.log('Authentication failed for:', req.path, 'Session ID:', req.sessionID, 'User:', req.user);
  
  // Always return JSON for API routes
  res.status(401).json({ message: "Authentication required" });
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    return next();
  };
}

// Module-level permission checking middleware
export function requirePermission(module: string, requiredLevel: 'view' | 'manage' = 'view') {
  return async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Get aggregated permissions (role defaults + user overrides)
      const permissions = await storage.getAggregatedPermissions(req.user.id, req.user.role);
      const userLevel = permissions[module];

      // Check if user has access to the module
      if (!userLevel) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied to ${module} module`
        });
      }

      // If manage is required, ensure user has manage level (not just view)
      if (requiredLevel === 'manage' && userLevel !== 'manage') {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Manage permission required for ${module} module`
        });
      }

      // Attach permissions to request for downstream use
      req.userPermissions = permissions;
      return next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}