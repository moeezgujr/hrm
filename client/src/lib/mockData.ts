// Mock data for standalone deployment
export const DEMO_MODE = false;

export const mockUsers = [
  {
    id: "demo_hr_admin",
    email: "hr.admin@themeetingmatters.com",
    firstName: "Sarah",
    lastName: "Wilson",
    profileImageUrl: null,
    role: "hr_admin",
    status: "active",
    department: "Human Resources",
    position: "HR Administrator",
    managerId: null,
    startDate: "2024-01-15",
    createdAt: "2024-01-15T09:00:00.000Z",
    updatedAt: "2025-01-01T09:00:00.000Z"
  }
];

export const mockEmployees = [
  {
    id: 1,
    userId: "demo_hr_admin",
    employeeId: "EMP001",
    phoneNumber: "555-123-4567",
    address: "123 Main St, Business District, City 12345",
    emergencyContact: {
      name: "John Wilson",
      phone: "555-987-6543",
      relationship: "spouse"
    },
    onboardingStatus: "completed",
    onboardingProgress: 100,
    createdAt: "2024-01-15T09:00:00.000Z",
    updatedAt: "2025-01-01T09:00:00.000Z",
    user: mockUsers[0]
  },
  {
    id: 2,
    userId: "demo_employee_1",
    employeeId: "EMP002",
    phoneNumber: "555-234-5678",
    address: "456 Oak Ave, Residential Area, City 12345",
    emergencyContact: {
      name: "Jane Smith",
      phone: "555-876-5432",
      relationship: "sister"
    },
    onboardingStatus: "in_progress",
    onboardingProgress: 75,
    createdAt: "2024-02-01T09:00:00.000Z",
    updatedAt: "2025-01-10T09:00:00.000Z",
    user: {
      id: "demo_employee_1",
      email: "john.smith@themeetingmatters.com",
      firstName: "John",
      lastName: "Smith",
      profileImageUrl: null,
      role: "employee",
      status: "active",
      department: "Marketing",
      position: "Marketing Coordinator",
      managerId: "demo_hr_admin",
      startDate: "2024-02-01",
      createdAt: "2024-02-01T09:00:00.000Z",
      updatedAt: "2025-01-01T09:00:00.000Z"
    }
  },
  {
    id: 3,
    userId: "demo_employee_2",
    employeeId: "EMP003",
    phoneNumber: "555-345-6789",
    address: "789 Pine Rd, Tech Quarter, City 12345",
    emergencyContact: {
      name: "Mike Johnson",
      phone: "555-765-4321",
      relationship: "brother"
    },
    onboardingStatus: "pending",
    onboardingProgress: 25,
    createdAt: "2024-02-15T09:00:00.000Z",
    updatedAt: "2025-01-15T09:00:00.000Z",
    user: {
      id: "demo_employee_2",
      email: "sarah.johnson@themeetingmatters.com",
      firstName: "Sarah",
      lastName: "Johnson",
      profileImageUrl: null,
      role: "employee",
      status: "active",
      department: "IT",
      position: "Software Developer",
      managerId: "demo_hr_admin",
      startDate: "2024-02-15",
      createdAt: "2024-02-15T09:00:00.000Z",
      updatedAt: "2025-01-01T09:00:00.000Z"
    }
  }
];

export const mockTasks = [
  {
    id: 1,
    title: "Complete Employee Handbook Review",
    description: "Review and update the employee handbook for 2025 compliance requirements",
    status: "completed",
    priority: "high",
    assignedTo: 2,
    assignedBy: 1,
    dueDate: "2025-01-10",
    completedAt: "2025-01-08T14:30:00.000Z",
    createdAt: "2024-12-15T09:00:00.000Z",
    assignee: mockEmployees[1].user,
    assigner: mockEmployees[0].user
  },
  {
    id: 2,
    title: "Q1 Performance Review Preparation",
    description: "Prepare performance review documents and schedules for Q1 2025",
    status: "in_progress",
    priority: "medium",
    assignedTo: 3,
    assignedBy: 1,
    dueDate: "2025-02-01",
    completedAt: null,
    createdAt: "2025-01-01T09:00:00.000Z",
    assignee: mockEmployees[2].user,
    assigner: mockEmployees[0].user
  },
  {
    id: 3,
    title: "Office Safety Training Setup",
    description: "Coordinate with facilities to set up quarterly safety training sessions",
    status: "pending",
    priority: "medium",
    assignedTo: 2,
    assignedBy: 1,
    dueDate: "2025-01-25",
    completedAt: null,
    createdAt: "2025-01-10T09:00:00.000Z",
    assignee: mockEmployees[1].user,
    assigner: mockEmployees[0].user
  }
];

export const mockAnnouncements = [
  {
    id: 1,
    title: "New Employee Wellness Program Launch",
    content: "We're excited to announce the launch of our comprehensive employee wellness program starting February 1st. This program includes mental health resources, fitness memberships, and flexible work arrangements.",
    priority: "high",
    targetRoles: ["employee", "hr_admin", "branch_manager", "team_lead"],
    createdBy: 1,
    isActive: true,
    createdAt: "2025-01-15T09:00:00.000Z",
    author: mockEmployees[0].user
  },
  {
    id: 2,
    title: "Office Holiday Schedule Update",
    content: "Please note the updated holiday schedule for 2025. All national holidays will be observed with paid time off. The office will be closed December 24th-26th and December 31st-January 1st.",
    priority: "medium",
    targetRoles: ["employee", "hr_admin", "branch_manager", "team_lead"],
    createdBy: 1,
    isActive: true,
    createdAt: "2025-01-10T10:00:00.000Z",
    author: mockEmployees[0].user
  }
];

export const mockOnboardingChecklists = [
  {
    id: 1,
    employeeId: 2,
    itemTitle: "Complete I-9 Form",
    description: "Fill out and submit I-9 employment eligibility verification form",
    isCompleted: true,
    dueDate: "2024-02-01",
    completedAt: "2024-01-30T14:00:00.000Z",
    order: 1,
    requiresDocument: true,
    documentType: "I-9 Form",
    documentUrl: "/documents/i9-john-smith.pdf",
    documentName: "I-9-John-Smith.pdf",
    isDocumentVerified: true,
    verifiedBy: 1,
    verifiedAt: "2024-01-31T09:00:00.000Z",
    verificationNotes: "All documentation verified and compliant"
  },
  {
    id: 2,
    employeeId: 2,
    itemTitle: "Attend Welcome Orientation",
    description: "Participate in new employee welcome orientation session",
    isCompleted: true,
    dueDate: "2024-02-02",
    completedAt: "2024-02-02T10:00:00.000Z",
    order: 2,
    requiresDocument: false
  },
  {
    id: 3,
    employeeId: 2,
    itemTitle: "IT Equipment Setup",
    description: "Receive and configure laptop, phone, and necessary software access",
    isCompleted: false,
    dueDate: "2024-02-05",
    completedAt: null,
    order: 3,
    requiresDocument: false
  }
];

export const mockDashboardStats = {
  totalEmployees: 3,
  activeOnboarding: 2,
  pendingTasks: 2,
  completedTasks: 1,
  totalAnnouncements: 2,
  activeRecognitions: 1
};

export const mockActivities = [
  {
    id: 1,
    type: "task_completed",
    description: "John Smith completed 'Employee Handbook Review'",
    timestamp: "2025-01-08T14:30:00.000Z",
    user: mockEmployees[1].user
  },
  {
    id: 2,
    type: "onboarding_progress",
    description: "Sarah Johnson updated onboarding progress to 25%",
    timestamp: "2025-01-15T11:20:00.000Z",
    user: mockEmployees[2].user
  },
  {
    id: 3,
    type: "announcement_created",
    description: "New wellness program announcement published",
    timestamp: "2025-01-15T09:00:00.000Z",
    user: mockEmployees[0].user
  }
];

// Authentication mock
export const mockAuthUser = mockUsers[0];

export const mockPsychometricTests = [
  {
    id: 1,
    testName: "Big Five Personality Assessment",
    testType: "personality",
    description: "Comprehensive personality assessment based on the Five-Factor Model",
    instructions: "Please answer each question honestly based on how you typically think, feel, and behave. There are no right or wrong answers.",
    timeLimit: 25,
    totalQuestions: 20,
    isActive: true,
    createdBy: 1,
    createdAt: "2024-12-01T09:00:00.000Z"
  },
  {
    id: 2,
    testName: "Cognitive Aptitude Assessment", 
    testType: "cognitive",
    description: "Evaluate problem-solving abilities and logical reasoning skills",
    instructions: "Read each question carefully and select the best answer. You have limited time for each question.",
    timeLimit: 20,
    totalQuestions: 15,
    isActive: true,
    createdBy: 1,
    createdAt: "2024-12-01T09:00:00.000Z"
  },
  {
    id: 3,
    testName: "Emotional Intelligence Assessment",
    testType: "emotional_intelligence", 
    description: "Assess your ability to understand and manage emotions",
    instructions: "Consider each scenario and choose the response that best reflects how you would typically react.",
    timeLimit: 30,
    totalQuestions: 25,
    isActive: true,
    createdBy: 1,
    createdAt: "2024-12-01T09:00:00.000Z"
  }
];

export const mockPsychometricQuestions = [
  // Big Five Personality Questions
  {
    id: 1,
    testId: 1,
    questionText: "I am the life of the party",
    questionType: "scale",
    options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    category: "extraversion",
    orderIndex: 1
  },
  {
    id: 2,
    testId: 1,
    questionText: "I feel comfortable around people",
    questionType: "scale", 
    options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    category: "extraversion",
    orderIndex: 2
  },
  {
    id: 3,
    testId: 1,
    questionText: "I start conversations",
    questionType: "scale",
    options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], 
    category: "extraversion",
    orderIndex: 3
  },
  {
    id: 4,
    testId: 1,
    questionText: "I have a vivid imagination",
    questionType: "scale",
    options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    category: "openness",
    orderIndex: 4
  },
  {
    id: 5,
    testId: 1,
    questionText: "I have excellent ideas",
    questionType: "scale",
    options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    category: "openness", 
    orderIndex: 5
  },

  // Cognitive Aptitude Questions
  {
    id: 6,
    testId: 2,
    questionText: "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?",
    questionType: "multiple_choice",
    options: ["5 minutes", "10 minutes", "100 minutes", "500 minutes"],
    category: "logical_reasoning",
    orderIndex: 1,
    correctAnswer: 0
  },
  {
    id: 7,
    testId: 2,
    questionText: "What comes next in this sequence: 2, 6, 12, 20, 30, ?",
    questionType: "multiple_choice", 
    options: ["40", "42", "44", "48"],
    category: "pattern_recognition",
    orderIndex: 2,
    correctAnswer: 1
  },
  {
    id: 8,
    testId: 2,
    questionText: "A ball and a bat cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?",
    questionType: "multiple_choice",
    options: ["$0.05", "$0.10", "$0.15", "$0.20"],
    category: "logical_reasoning", 
    orderIndex: 3,
    correctAnswer: 0
  },

  // Emotional Intelligence Questions
  {
    id: 9,
    testId: 3,
    questionText: "When I'm feeling stressed, I usually:",
    questionType: "multiple_choice",
    options: [
      "Take a few deep breaths and try to calm down",
      "Talk to someone about what's bothering me", 
      "Keep busy to distract myself",
      "Get frustrated and let others know"
    ],
    category: "self_management",
    orderIndex: 1
  },
  {
    id: 10,
    testId: 3,
    questionText: "I can easily tell when someone is feeling upset, even if they don't say anything",
    questionType: "scale",
    options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    category: "social_awareness",
    orderIndex: 2
  }
];

export const mockTestAttempts = [
  {
    id: 1,
    testId: 1,
    candidateName: "Alex Johnson",
    candidateEmail: "alex.johnson@example.com",
    status: "completed",
    startedAt: "2025-01-10T09:00:00.000Z",
    completedAt: "2025-01-10T09:23:00.000Z",
    percentageScore: 85,
    responses: {}
  },
  {
    id: 2,
    testId: 2,
    candidateName: "Maria Garcia",
    candidateEmail: "maria.garcia@example.com", 
    status: "in_progress",
    startedAt: "2025-01-15T14:30:00.000Z",
    completedAt: null,
    percentageScore: null,
    responses: {}
  },
  {
    id: 3,
    testId: 1,
    candidateName: "David Chen",
    candidateEmail: "david.chen@example.com",
    status: "completed",
    startedAt: "2025-01-12T11:15:00.000Z", 
    completedAt: "2025-01-12T11:38:00.000Z",
    percentageScore: 92,
    responses: {}
  }
];