import { db } from './server/db.js';
import { 
  users, 
  companies, 
  departments, 
  employees,
  projects,
  projectMembers,
  projectTasks,
  tasks,
  announcements,
  recognition,
  logisticsItems,
  onboardingChecklists,
  documents,
  psychometricTests,
  psychometricQuestions
} from './shared/schema.js';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Check if data already exists
    console.log('🔍 Checking for existing data...');
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('⚠️  Database already contains data!');
      console.log('   To re-seed, please run: psql -U your_user -d your_db -f reset-database.sql');
      console.log('   Then run: npm run db:push');
      console.log('   Then run this script again.\n');
      process.exit(0);
    }
    console.log('✅ Database is empty, proceeding with seeding...\n');

    // 1. Create Companies
    console.log('📊 Creating companies...');
    const [company1, company2] = await db.insert(companies).values([
      {
        name: 'Qanzak Global',
        description: 'Global technology and business solutions provider',
        industry: 'Technology',
        size: 'medium',
        website: 'https://qanzakglobal.com',
        email: 'info@qanzakglobal.com',
        phone: '+1-555-0100',
        address: '123 Tech Plaza, Silicon Valley, CA',
        city: 'San Jose',
        state: 'California',
        country: 'United States',
        postalCode: '95110',
        taxId: 'TAX-QG-2024',
        isActive: true
      },
      {
        name: 'Meeting Matters Clinic',
        description: 'Professional healthcare and wellness services',
        industry: 'Healthcare',
        size: 'small',
        website: 'https://meetingmatters.com',
        email: 'info@meetingmatters.com',
        phone: '+1-555-0200',
        address: '456 Health Avenue, Medical District',
        city: 'Los Angeles',
        state: 'California',
        country: 'United States',
        postalCode: '90001',
        taxId: 'TAX-MM-2024',
        isActive: true
      }
    ]).returning();
    console.log('✅ Companies created\n');

    // 2. Create Departments
    console.log('🏢 Creating departments...');
    const [hrDept, itDept, salesDept, opsDept, socialMediaDept] = await db.insert(departments).values([
      {
        code: 'HR',
        name: 'Human Resources',
        description: 'Employee management and development',
        managerId: null, // Will update after creating users
        budgetAllocated: '500000',
        location: 'Building A, Floor 2',
        isActive: true
      },
      {
        code: 'IT',
        name: 'Information Technology',
        description: 'Technology infrastructure and development',
        managerId: null,
        budgetAllocated: '1000000',
        location: 'Building A, Floor 3',
        isActive: true
      },
      {
        code: 'SALES',
        name: 'Sales & Marketing',
        description: 'Revenue generation and brand management',
        managerId: null,
        budgetAllocated: '750000',
        location: 'Building B, Floor 1',
        isActive: true
      },
      {
        code: 'OPS',
        name: 'Operations',
        description: 'Day-to-day business operations',
        managerId: null,
        budgetAllocated: '600000',
        location: 'Building A, Floor 1',
        isActive: true
      },
      {
        code: 'SMC',
        name: 'Social Media & Content',
        description: 'Social media management and content creation',
        managerId: null,
        budgetAllocated: '300000',
        location: 'Building B, Floor 2',
        isActive: true
      }
    ]).returning();
    console.log('✅ Departments created\n');

    // 3. Create Users with different roles
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [admin, hrManager, itManager, employee1, employee2, employee3, socialMediaManager, contentCreator] = await db.insert(users).values([
      {
        username: 'admin',
        email: 'admin@qanzakglobal.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'hr_admin',
        status: 'active',
        department: 'Human Resources',
        position: 'HR Administrator',
        companyId: company1.id,
        accountEnabled: true,
        hasCrmAccess: true,
        hasJobApplicationsAccess: true,
        isHRPersonnel: true,
        organizationId: 'qanzak_global',
        contractSigned: true,
        onboardingStatus: 'completed',
        onboardingProgress: 100
      },
      {
        username: 'sarah.johnson',
        email: 'sarah.johnson@qanzakglobal.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'branch_manager',
        status: 'active',
        department: 'Human Resources',
        position: 'HR Manager',
        companyId: company1.id,
        accountEnabled: true,
        hasCrmAccess: true,
        hasJobApplicationsAccess: true,
        isHRPersonnel: true,
        organizationId: 'qanzak_global',
        contractSigned: true,
        onboardingStatus: 'completed',
        onboardingProgress: 100
      },
      {
        username: 'mike.chen',
        email: 'mike.chen@qanzakglobal.com',
        password: hashedPassword,
        firstName: 'Mike',
        lastName: 'Chen',
        role: 'department_head',
        status: 'active',
        department: 'Information Technology',
        position: 'IT Manager',
        companyId: company1.id,
        accountEnabled: true,
        hasCrmAccess: false,
        hasJobApplicationsAccess: false,
        organizationId: 'qanzak_global',
        contractSigned: true,
        onboardingStatus: 'completed',
        onboardingProgress: 100
      },
      {
        username: 'john.doe',
        email: 'john.doe@qanzakglobal.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee',
        status: 'active',
        department: 'Information Technology',
        position: 'Software Developer',
        companyId: company1.id,
        managerId: null, // Will set after we have IDs
        accountEnabled: true,
        organizationId: 'qanzak_global',
        contractSigned: true,
        onboardingStatus: 'completed',
        onboardingProgress: 100
      },
      {
        username: 'jane.smith',
        email: 'jane.smith@qanzakglobal.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'employee',
        status: 'active',
        department: 'Sales & Marketing',
        position: 'Marketing Specialist',
        companyId: company1.id,
        accountEnabled: true,
        organizationId: 'qanzak_global',
        contractSigned: true,
        onboardingStatus: 'completed',
        onboardingProgress: 100
      },
      {
        username: 'alex.rivera',
        email: 'alex.rivera@qanzakglobal.com',
        password: hashedPassword,
        firstName: 'Alex',
        lastName: 'Rivera',
        role: 'employee',
        status: 'active',
        department: 'Operations',
        position: 'Operations Coordinator',
        companyId: company1.id,
        accountEnabled: true,
        organizationId: 'qanzak_global',
        contractSigned: true,
        onboardingStatus: 'completed',
        onboardingProgress: 100
      },
      {
        username: 'emily.wilson',
        email: 'emily.wilson@qanzakglobal.com',
        password: hashedPassword,
        firstName: 'Emily',
        lastName: 'Wilson',
        role: 'social_media_manager',
        status: 'active',
        department: 'Social Media & Content',
        position: 'Social Media Manager',
        companyId: company1.id,
        accountEnabled: true,
        organizationId: 'qanzak_global',
        contractSigned: true,
        onboardingStatus: 'completed',
        onboardingProgress: 100
      },
      {
        username: 'david.brown',
        email: 'david.brown@qanzakglobal.com',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Brown',
        role: 'content_creator',
        status: 'active',
        department: 'Social Media & Content',
        position: 'Content Creator',
        companyId: company1.id,
        accountEnabled: true,
        organizationId: 'qanzak_global',
        contractSigned: true,
        onboardingStatus: 'completed',
        onboardingProgress: 100
      }
    ]).returning();
    console.log('✅ Users created\n');

    // 4. Create Employee records
    console.log('👨‍💼 Creating employee records...');
    await db.insert(employees).values([
      {
        userId: employee1.id,
        organizationId: 'qanzak_global',
        companyId: company1.id,
        employeeId: 'EMP-001',
        phoneNumber: '+1-555-1001',
        personalEmail: 'john.doe.personal@gmail.com',
        position: 'Software Developer',
        department: 'Information Technology',
        startDate: '2024-01-15',
        employmentType: 'full_time',
        onboardingStatus: 'completed',
        onboardingProgress: 100
      },
      {
        userId: employee2.id,
        organizationId: 'qanzak_global',
        companyId: company1.id,
        employeeId: 'EMP-002',
        phoneNumber: '+1-555-1002',
        personalEmail: 'jane.smith.personal@gmail.com',
        position: 'Marketing Specialist',
        department: 'Sales & Marketing',
        startDate: '2024-02-01',
        employmentType: 'full_time',
        onboardingStatus: 'completed',
        onboardingProgress: 100
      },
      {
        userId: employee3.id,
        organizationId: 'qanzak_global',
        companyId: company1.id,
        employeeId: 'EMP-003',
        phoneNumber: '+1-555-1003',
        personalEmail: 'alex.rivera.personal@gmail.com',
        position: 'Operations Coordinator',
        department: 'Operations',
        startDate: '2024-03-10',
        employmentType: 'full_time',
        onboardingStatus: 'completed',
        onboardingProgress: 100
      }
    ]);
    console.log('✅ Employee records created\n');

    // 5. Create Projects
    console.log('📁 Creating projects...');
    const [project1, project2, project3] = await db.insert(projects).values([
      {
        name: 'Website Redesign',
        description: 'Complete overhaul of company website with modern design and features',
        projectManagerId: itManager.id,
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        budget: '50000',
        priority: 'high',
        clientName: 'Qanzak Global'
      },
      {
        name: 'Marketing Campaign Q2',
        description: 'Social media and digital marketing campaign for Q2 2024',
        projectManagerId: hrManager.id,
        status: 'active',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        budget: '30000',
        priority: 'medium',
        clientName: 'Qanzak Global'
      },
      {
        name: 'Internal Process Automation',
        description: 'Automate manual processes using custom tools',
        projectManagerId: itManager.id,
        status: 'planning',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-12-31'),
        budget: '75000',
        priority: 'medium',
        clientName: 'Internal'
      }
    ]).returning();
    console.log('✅ Projects created\n');

    // 6. Add Project Members
    console.log('👥 Adding project members...');
    await db.insert(projectMembers).values([
      { projectId: project1.id, userId: itManager.id, role: 'manager' },
      { projectId: project1.id, userId: employee1.id, role: 'developer' },
      { projectId: project2.id, userId: hrManager.id, role: 'manager' },
      { projectId: project2.id, userId: employee2.id, role: 'member' },
      { projectId: project3.id, userId: itManager.id, role: 'manager' },
      { projectId: project3.id, userId: employee1.id, role: 'developer' },
      { projectId: project3.id, userId: employee3.id, role: 'member' }
    ]);
    console.log('✅ Project members added\n');

    // 7. Create Project Tasks
    console.log('✅ Creating project tasks...');
    await db.insert(projectTasks).values([
      {
        projectId: project1.id,
        title: 'Design homepage mockup',
        description: 'Create modern homepage design in Figma',
        assignedTo: employee1.id,
        assignedBy: itManager.id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-02-15').toISOString(),
        completedAt: new Date('2024-02-10').toISOString()
      },
      {
        projectId: project1.id,
        title: 'Implement responsive navigation',
        description: 'Build mobile-friendly navigation component',
        assignedTo: employee1.id,
        assignedBy: itManager.id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2024-12-20').toISOString()
      },
      {
        projectId: project2.id,
        title: 'Create social media content calendar',
        description: 'Plan content for Q2 across all platforms',
        assignedTo: employee2.id,
        assignedBy: hrManager.id,
        status: 'completed',
        priority: 'medium',
        dueDate: new Date('2024-04-15').toISOString(),
        completedAt: new Date('2024-04-12').toISOString()
      },
      {
        projectId: project2.id,
        title: 'Design Instagram ad campaign',
        description: 'Create engaging ad designs for Instagram',
        assignedTo: employee2.id,
        assignedBy: hrManager.id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2024-12-25').toISOString()
      },
      {
        projectId: project3.id,
        title: 'Analyze current processes',
        description: 'Document and analyze existing manual processes',
        assignedTo: employee3.id,
        assignedBy: itManager.id,
        status: 'pending',
        priority: 'medium',
        dueDate: new Date('2024-12-30').toISOString()
      }
    ]);
    console.log('✅ Project tasks created\n');

    // 8. Create General Tasks
    console.log('📝 Creating general tasks...');
    await db.insert(tasks).values([
      {
        title: 'Update employee handbook',
        description: 'Review and update company policies',
        assignedTo: hrManager.id,
        assignedBy: admin.id,
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date('2024-12-31')
      },
      {
        title: 'Quarterly performance reviews',
        description: 'Conduct Q4 performance reviews for all employees',
        assignedTo: hrManager.id,
        assignedBy: admin.id,
        status: 'pending',
        priority: 'high',
        dueDate: new Date('2024-12-15')
      },
      {
        title: 'Server maintenance',
        description: 'Perform scheduled server updates and backups',
        assignedTo: employee1.id,
        assignedBy: itManager.id,
        status: 'pending',
        priority: 'high',
        dueDate: new Date('2024-12-10')
      }
    ]);
    console.log('✅ General tasks created\n');

    // 9. Create Announcements
    console.log('📢 Creating announcements...');
    await db.insert(announcements).values([
      {
        title: 'Welcome to Qanzak Global HRM System',
        content: 'We are excited to launch our new Human Resource Management system. This platform will streamline all HR processes and improve communication across the organization.',
        createdBy: admin.id,
        priority: 'high',
        expiryDate: new Date('2024-12-31'),
        isActive: true
      },
      {
        title: 'Holiday Schedule 2024',
        content: 'Please review the updated holiday schedule for 2024. The office will be closed on the following dates: December 24-26, December 31 - January 1.',
        createdBy: hrManager.id,
        priority: 'medium',
        expiryDate: new Date('2025-01-15'),
        isActive: true
      },
      {
        title: 'New Benefits Program',
        content: 'Starting next month, we are introducing an enhanced benefits program including additional health coverage and wellness initiatives.',
        createdBy: hrManager.id,
        priority: 'high',
        expiryDate: new Date('2025-01-31'),
        isActive: true
      }
    ]);
    console.log('✅ Announcements created\n');

    // 10. Create Recognitions
    console.log('🏆 Creating employee recognitions...');
    await db.insert(recognition).values([
      {
        title: 'Employee of the Month - January 2024',
        description: 'Outstanding performance in delivering the website redesign project ahead of schedule with exceptional quality.',
        type: 'employee_of_month',
        nomineeId: employee1.id.toString(),
        nominatedBy: itManager.id.toString(),
        isApproved: true,
        approvedBy: admin.id.toString()
      },
      {
        title: 'Team Player Award',
        description: 'Excellent collaboration and support to team members during the Q2 marketing campaign.',
        type: 'achievement',
        nomineeId: employee2.id.toString(),
        nominatedBy: hrManager.id.toString(),
        isApproved: true,
        approvedBy: admin.id.toString()
      },
      {
        title: 'Innovation Award',
        description: 'Proposed innovative solutions for process automation that will save significant time and resources.',
        type: 'achievement',
        nomineeId: employee3.id.toString(),
        nominatedBy: itManager.id.toString(),
        isApproved: false
      }
    ]);
    console.log('✅ Recognitions created\n');

    // 11. Create Logistics Items
    console.log('📦 Creating logistics items...');
    await db.insert(logisticsItems).values([
      {
        name: 'Laptop - Dell XPS 15',
        category: 'electronics',
        quantity: 5,
        unit: 'units',
        location: 'IT Storage Room',
        minStockLevel: 2,
        supplier: 'Dell Technologies',
        cost: '1499.99',
        status: 'in_stock'
      },
      {
        name: 'Office Chair - Ergonomic',
        category: 'furniture',
        quantity: 10,
        unit: 'units',
        location: 'Warehouse A',
        minStockLevel: 3,
        supplier: 'Office Depot',
        cost: '299.99',
        status: 'in_stock'
      },
      {
        name: 'Printer Paper - A4',
        category: 'supplies',
        quantity: 2,
        unit: 'boxes',
        location: 'Supply Closet',
        minStockLevel: 5,
        supplier: 'Staples',
        cost: '45.99',
        status: 'low_stock'
      },
      {
        name: 'Whiteboard Markers',
        category: 'supplies',
        quantity: 0,
        unit: 'packs',
        location: 'Supply Closet',
        minStockLevel: 3,
        supplier: 'Office Depot',
        cost: '12.99',
        status: 'out_of_stock'
      }
    ]);
    console.log('✅ Logistics items created\n');

    // 12. Create Onboarding Checklists
    console.log('📋 Creating onboarding checklists...');
    await db.insert(onboardingChecklists).values([
      {
        itemTitle: 'Complete New Hire Paperwork',
        description: 'Fill out and submit all required employment forms',
        employeeId: employee1.id,
        dueDate: new Date('2024-01-20'),
        isCompleted: true,
        completedAt: new Date('2024-01-18'),
        completedBy: employee1.id.toString(),
        order: 1
      },
      {
        itemTitle: 'IT Setup and Orientation',
        description: 'Get laptop, email, and system access configured',
        employeeId: employee1.id,
        dueDate: new Date('2024-01-22'),
        isCompleted: true,
        completedAt: new Date('2024-01-19'),
        completedBy: itManager.id.toString(),
        order: 2
      },
      {
        itemTitle: 'Department Introduction Meeting',
        description: 'Meet with team members and department head',
        employeeId: employee2.id,
        dueDate: new Date('2024-02-05'),
        isCompleted: true,
        completedAt: new Date('2024-02-03'),
        completedBy: employee2.id.toString(),
        order: 1
      },
      {
        itemTitle: 'Review Company Policies',
        description: 'Read and acknowledge company handbook and policies',
        employeeId: employee3.id,
        dueDate: new Date('2024-03-15'),
        isCompleted: false,
        order: 1
      }
    ]);
    console.log('✅ Onboarding checklists created\n');

    // 13. Create Documents
    console.log('📄 Creating documents...');
    await db.insert(documents).values([
      {
        filename: 'employee-handbook-2024.pdf',
        originalName: 'Employee Handbook 2024.pdf',
        mimeType: 'application/pdf',
        size: 2048576,
        uploadedBy: admin.id.toString(),
        relatedType: 'policy',
        isApproved: true,
        approvedBy: admin.id.toString()
      },
      {
        filename: 'it-security-guidelines.pdf',
        originalName: 'IT Security Guidelines.pdf',
        mimeType: 'application/pdf',
        size: 1536000,
        uploadedBy: itManager.id.toString(),
        relatedType: 'training',
        isApproved: true,
        approvedBy: admin.id.toString()
      },
      {
        filename: 'q3-financial-report.pdf',
        originalName: 'Quarterly Financial Report Q3 2024.pdf',
        mimeType: 'application/pdf',
        size: 3145728,
        uploadedBy: admin.id.toString(),
        relatedType: 'report',
        isApproved: false
      }
    ]);
    console.log('✅ Documents created\n');

    // 14. Create Psychometric Tests
    console.log('🧠 Creating psychometric tests...');
    const [test1] = await db.insert(psychometricTests).values([
      {
        testName: '16 Personality Factors (16PF)',
        testType: 'personality',
        description: 'Comprehensive personality assessment measuring 16 primary personality traits',
        instructions: 'Answer each question honestly based on your typical behavior and preferences. There are no right or wrong answers.',
        timeLimit: 45,
        totalQuestions: 50,
        isActive: true
      }
    ]).returning();
    console.log('✅ Psychometric test created\n');

    // 15. Create Psychometric Questions
    console.log('❓ Creating psychometric questions...');
    await db.insert(psychometricQuestions).values([
      {
        testId: test1.id,
        questionText: 'I enjoy being the center of attention at social gatherings.',
        questionType: 'scale',
        category: 'extraversion',
        order: 1,
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        testId: test1.id,
        questionText: 'I prefer to work on tasks that require careful attention to detail.',
        questionType: 'scale',
        category: 'conscientiousness',
        order: 2,
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        testId: test1.id,
        questionText: 'I often try new things and enjoy novel experiences.',
        questionType: 'scale',
        category: 'openness',
        order: 3,
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        testId: test1.id,
        questionText: 'I find it easy to empathize with others\' feelings.',
        questionType: 'scale',
        category: 'agreeableness',
        order: 4,
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      },
      {
        testId: test1.id,
        questionText: 'I often worry about things that might go wrong.',
        questionType: 'scale',
        category: 'neuroticism',
        order: 5,
        options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
      }
    ]);
    console.log('✅ Psychometric questions created\n');

    console.log('✅✅✅ DATABASE SEEDING COMPLETED! ✅✅✅\n');
    console.log('📊 Summary:');
    console.log('   - 2 Companies');
    console.log('   - 5 Departments');
    console.log('   - 8 Users (admin, managers, employees)');
    console.log('   - 3 Employee records');
    console.log('   - 3 Projects with members and tasks');
    console.log('   - 8 Tasks (5 project tasks + 3 general)');
    console.log('   - 3 Announcements');
    console.log('   - 3 Employee recognitions');
    console.log('   - 4 Logistics items');
    console.log('   - 4 Onboarding checklist items');
    console.log('   - 3 Documents');
    console.log('   - 1 Psychometric test with 5 questions');
    console.log('\n🔐 Login credentials:');
    console.log('   Username: admin | Password: password123');
    console.log('   Username: sarah.johnson | Password: password123');
    console.log('   Username: mike.chen | Password: password123');
    console.log('   Username: john.doe | Password: password123');
    console.log('   Username: jane.smith | Password: password123');
    console.log('   Username: alex.rivera | Password: password123');
    console.log('   Username: emily.wilson | Password: password123');
    console.log('   Username: david.brown | Password: password123');
    console.log('\n⚠️  Please change these passwords after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
