import { InsertOnboardingChecklist } from "@shared/schema";

// Standard onboarding checklist templates with interactive modal components
export const defaultOnboardingTemplate: Omit<InsertOnboardingChecklist, 'employeeId' | 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Day 1 - Welcome & Introduction
  {
    itemTitle: "Welcome & Company Introduction",
    description: "Comprehensive welcome session covering company history, mission, values, and organizational structure. Interactive presentation with handbook materials.",
    order: 1,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "Complete Personal Profile",
    description: "Fill out comprehensive personal details, emergency contacts, preferences, and employment information through the interactive employee portal.",
    order: 2,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "Equipment Setup & Registration",
    description: "Interactive equipment checklist including laptop, phone, access cards, and peripherals. Complete setup verification with IT support.",
    order: 3,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    requiresDocument: true,
    documentType: "image",
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "System Access & Account Setup",
    description: "Interactive guide for setting up email accounts, system logins, and accessing company tools and platforms with step-by-step verification.",
    order: 4,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },

  // Banking & Financial Setup
  {
    itemTitle: "Banking Information Setup",
    description: "Secure entry of banking details for payroll setup. Complete direct deposit authorization and tax withholding preferences.",
    order: 5,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },

  // Documentation & Compliance
  {
    itemTitle: "Upload Employment Documents",
    description: "Interactive document upload system for ID, passport, work authorization, contracts, and tax forms with built-in validation.",
    order: 6,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    requiresDocument: true,
    documentType: "pdf",
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "Upload Identification Documents",
    description: "Secure upload system for copies of ID, passport, and any required work authorization documents with automatic validation.",
    order: 7,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    requiresDocument: true,
    documentType: "image",
    requiresPsychometricTest: false,
    isCompleted: false
  },

  // Interactive Training Modules
  {
    itemTitle: "Safety & Compliance Training",
    description: "Interactive safety training modules with real-time progress tracking, quizzes, and completion certificates.",
    order: 8,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "Company Policies Training",
    description: "Comprehensive policy training including HR policies, code of conduct, and regulatory compliance with interactive acknowledgments.",
    order: 9,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },

  // Comprehensive Psychometric Assessment Suite
  {
    itemTitle: "Take Personality Assessment",
    description: "Comprehensive personality evaluation using validated psychometric instruments to understand work style, team fit, and development opportunities.",
    order: 10,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    requiresDocument: false,
    requiresPsychometricTest: true,
    psychometricTestId: 27, // Personality Assessment
    isCompleted: false
  },
  {
    itemTitle: "Take Cognitive Skills Test",
    description: "Cognitive abilities assessment to evaluate problem-solving, logical reasoning, and analytical thinking capabilities.",
    order: 11,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    requiresDocument: false,
    requiresPsychometricTest: true,
    psychometricTestId: 28, // Cognitive Skills Test
    isCompleted: false
  },
  {
    itemTitle: "Communication Style Assessment",
    description: "Comprehensive communication skills evaluation covering written, verbal, and interpersonal communication abilities.",
    order: 12,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    requiresDocument: false,
    requiresPsychometricTest: true,
    psychometricTestId: 29, // Communication Style Assessment
    isCompleted: false
  },
  {
    itemTitle: "Technical Skills Evaluation",
    description: "Technical competency assessment tailored to role requirements, including job-specific skills and general technology proficiency.",
    order: 13,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    requiresDocument: false,
    requiresPsychometricTest: true,
    psychometricTestId: 30, // Technical Skills Evaluation
    isCompleted: false
  },
  {
    itemTitle: "Cultural Fit Assessment",
    description: "Values and cultural alignment assessment to ensure compatibility with company culture and team dynamics.",
    order: 14,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    requiresDocument: false,
    requiresPsychometricTest: true,
    psychometricTestId: 31, // Cultural Fit Assessment
    isCompleted: false
  },

  // Team Integration & Learning
  {
    itemTitle: "Team Introduction Meetings",
    description: "Structured introduction meetings with team members, stakeholders, and cross-functional partners with interactive scheduling system.",
    order: 15,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "Role Expectations & Goals Review",
    description: "Interactive session with manager covering detailed role expectations, performance metrics, and goal-setting with digital documentation.",
    order: 16,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "Department-Specific Orientation",
    description: "Comprehensive department orientation covering processes, tools, workflows, and team dynamics with interactive resources.",
    order: 17,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },

  // Hands-on Experience & Development
  {
    itemTitle: "Mentorship Program Enrollment",
    description: "Assignment to workplace mentor with structured program including regular check-ins and development planning.",
    order: 18,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "Job Shadowing Experience",
    description: "Structured job shadowing program with experienced team members including observation checklists and reflection activities.",
    order: 19,
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "First Project Assignment",
    description: "Completion of first supervised work assignment or project with milestone tracking and feedback integration.",
    order: 20,
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },

  // Progress Reviews & Feedback
  {
    itemTitle: "2-Week Progress Review",
    description: "Comprehensive check-in meeting with HR and supervisor including progress assessment, concern resolution, and adjustment planning.",
    order: 21,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "30-Day Comprehensive Review",
    description: "Formal performance review and career development planning session with manager and HR including goal adjustment and future planning.",
    order: 22,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "Onboarding Experience Feedback",
    description: "Interactive feedback system for onboarding experience evaluation including suggestions for process improvement.",
    order: 23,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },

  // Long-term Integration
  {
    itemTitle: "60-Day Development Review",
    description: "Comprehensive performance review focusing on skill development, career progression, and long-term integration success.",
    order: 24,
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  },
  {
    itemTitle: "Professional Development Planning",
    description: "Creation of comprehensive professional development plan including training opportunities, skill building, and career pathway mapping.",
    order: 25,
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    requiresDocument: false,
    requiresPsychometricTest: false,
    isCompleted: false
  }
];

// Role-specific additional checklist items
export const roleSpecificTemplates: Record<string, Omit<InsertOnboardingChecklist, 'employeeId' | 'id' | 'createdAt' | 'updatedAt'>[]> = {
  "employee": [
    // Basic employee items are covered in default template
  ],
  
  "team_lead": [
    {
      itemTitle: "Leadership Training Module",
      description: "Complete team leadership and management training specific to your role.",
      order: 17,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    },
    {
      itemTitle: "Review Team Performance Metrics",
      description: "Learn about team KPIs, performance tracking, and reporting requirements.",
      order: 18,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    }
  ],

  "branch_manager": [
    {
      itemTitle: "Management Training Program",
      description: "Complete comprehensive management training covering leadership, finance, and operations.",
      order: 17,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      requiresDocument: true,
      documentType: "pdf",
      requiresPsychometricTest: false,
      isCompleted: false
    },
    {
      itemTitle: "Budget & Financial Overview",
      description: "Review branch budget, financial responsibilities, and reporting requirements.",
      order: 18,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    },
    {
      itemTitle: "Meet Regional Leadership",
      description: "Introduction meetings with regional managers and executive team.",
      order: 19,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    }
  ],

  "hr_admin": [
    {
      itemTitle: "HR Systems Training",
      description: "Complete training on all HR systems, databases, and compliance requirements.",
      order: 17,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    },
    {
      itemTitle: "Legal Compliance Training",
      description: "Complete employment law, data privacy, and regulatory compliance training.",
      order: 18,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      requiresDocument: true,
      documentType: "pdf",
      requiresPsychometricTest: false,
      isCompleted: false
    }
  ],

  "logistics_manager": [
    {
      itemTitle: "Inventory Management Training",
      description: "Learn inventory systems, procurement processes, and vendor management.",
      order: 17,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    },
    {
      itemTitle: "Vendor Relations Overview",
      description: "Meet with key vendors and learn about existing supplier relationships.",
      order: 18,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    }
  ]
};

// Department-specific additional items
export const departmentSpecificTemplates: Record<string, Omit<InsertOnboardingChecklist, 'employeeId' | 'id' | 'createdAt' | 'updatedAt'>[]> = {
  "information_technology": [
    {
      itemTitle: "IT Security Training",
      description: "Complete cybersecurity training and obtain necessary security clearances.",
      order: 20,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      requiresDocument: true,
      documentType: "pdf",
      requiresPsychometricTest: false,
      isCompleted: false
    },
    {
      itemTitle: "Access Development Tools",
      description: "Set up development environment, version control, and deployment tools.",
      order: 21,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    }
  ],

  "finance_accounting": [
    {
      itemTitle: "Financial Systems Training",
      description: "Learn accounting software, financial reporting tools, and compliance procedures.",
      order: 20,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    }
  ],

  "sales_marketing": [
    {
      itemTitle: "CRM System Training",
      description: "Learn customer relationship management system and sales processes.",
      order: 20,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    },
    {
      itemTitle: "Product Knowledge Training",
      description: "Complete comprehensive training on all company products and services.",
      order: 21,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      requiresDocument: false,
      requiresPsychometricTest: false,
      isCompleted: false
    }
  ]
};

// Function to generate complete checklist for a user
export function generateChecklistForUser(
  role: string, 
  department?: string
): Omit<InsertOnboardingChecklist, 'employeeId' | 'id' | 'createdAt' | 'updatedAt'>[] {
  let checklist = [...defaultOnboardingTemplate];
  
  // Add role-specific items
  if (roleSpecificTemplates[role]) {
    checklist = checklist.concat(roleSpecificTemplates[role]);
  }
  
  // Add department-specific items
  if (department && departmentSpecificTemplates[department]) {
    checklist = checklist.concat(departmentSpecificTemplates[department]);
  }
  
  // Sort by order
  checklist.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  return checklist;
}