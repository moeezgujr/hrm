const fs = require('fs');
const jsPDF = require('jspdf').jsPDF;

// Create new PDF document
const doc = new jsPDF();

// Set font and styling
doc.setFontSize(20);
doc.setFont('helvetica', 'bold');

// Title
doc.text('Business Management System', 105, 20, { align: 'center' });
doc.setFontSize(16);
doc.text('User Manual for Muqaddas Saeed', 105, 30, { align: 'center' });

// Reset font
doc.setFontSize(12);
doc.setFont('helvetica', 'normal');

let yPos = 50;

// Helper function to add text with automatic page breaks
function addText(text, fontSize = 12, fontStyle = 'normal', isBold = false) {
  if (yPos > 270) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', isBold ? 'bold' : fontStyle);
  
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 15, yPos);
  yPos += lines.length * (fontSize * 0.6) + 5;
}

// Helper function to add section header
function addSection(title) {
  yPos += 10;
  addText(title, 14, 'bold', true);
  yPos += 5;
}

// Helper function to add subsection
function addSubsection(title) {
  yPos += 5;
  addText(title, 12, 'bold', true);
  yPos += 2;
}

// Welcome section
addSection('Welcome to Meeting Matters Business Management System');
addText('This manual will guide you through using the Business Management System as a Customer Relationship Manager at Meeting Matters Clinic.');

// Login Credentials
addSection('🔐 Your Login Credentials');
addText('IMPORTANT: Keep these credentials secure and do not share them with anyone', 11, 'bold', true);
addText('');
addText('• Username: Muqaddas_1049');
addText('• Employee ID: EMP410420 (Alternative login method)');
addText('• Password: password123');
addText('• Position: Customer Relationship Manager');
addText('• Department: Customer Relations');

// First Time Login
addSubsection('First Time Login Process');
addText('1. Navigate to the login page');
addText('2. Choose your login method:');
addText('   - Option A: Enter your Username (Muqaddas_1049) and Password');
addText('   - Option B: Enter your Employee ID (EMP410420) and Password');
addText('3. Click "Sign In"');
addText('4. Complete Contract Signing (First time only):');
addText('   - A contract signing modal will appear automatically');
addText('   - Review your employment contract carefully');
addText('   - Provide your digital signature to complete the process');
addText('   - Once signed, you will gain full access to the system');

// System Overview
addSection('📋 System Overview');
addText('The Business Management System helps you manage your daily work activities, including:');
addText('• Task Management: View and complete assigned tasks');
addText('• Project Collaboration: Work with team members on projects');
addText('• Document Management: Access and upload important documents');
addText('• Communications: Stay updated with announcements and notifications');
addText('• Profile Management: Keep your personal information up to date');

// Dashboard Navigation
addSection('🏠 Dashboard Navigation');
addSubsection('Main Menu (Left Sidebar)');
addText('• Dashboard: Your main workspace and overview');
addText('• Tasks: View and manage your assigned tasks');
addText('• Projects: Access projects you are involved in');
addText('• Documents: Upload and access important files');
addText('• Profile: Update your personal information');
addText('• Announcements: Read company updates and news');

addSubsection('Top Navigation Bar');
addText('• Notifications: Bell icon showing new alerts');
addText('• User Menu: Your profile and logout option');

// Task Management
addSection('✅ Task Management');
addSubsection('Viewing Your Tasks');
addText('1. Click "Tasks" in the left sidebar');
addText('2. You will see a list of tasks assigned to you');
addText('3. Each task shows:');
addText('   - Task title and description');
addText('   - Due date and priority level');
addText('   - Current status (Pending, In Progress, Completed)');
addText('   - Project association (if applicable)');

addSubsection('Working with Tasks');
addText('1. To start a task: Click on the task and change status to "In Progress"');
addText('2. To complete a task: Mark it as "Completed" when finished');
addText('3. To add comments: Use the comment section to communicate with your team');
addText('4. To view details: Click on any task to see full information');

addSubsection('Task Priorities');
addText('• High: Red indicator - Complete immediately');
addText('• Medium: Yellow indicator - Complete within deadline');
addText('• Low: Green indicator - Complete when time allows');

// Project Management
addSection('📂 Project Management');
addSubsection('Accessing Projects');
addText('1. Click "Projects" in the left sidebar');
addText('2. View all projects you are assigned to');
addText('3. Click on any project to see:');
addText('   - Project description and goals');
addText('   - Team members involved');
addText('   - Related tasks and deadlines');
addText('   - Project timeline and progress');

addSubsection('Your Role in Projects');
addText('As a Customer Relationship Manager, you may be involved in:');
addText('• Customer service improvement projects');
addText('• Client communication initiatives');
addText('• Customer satisfaction surveys');
addText('• Relationship building campaigns');

// Document Management
addSection('📁 Document Management');
addSubsection('Uploading Documents');
addText('1. Go to "Documents" section');
addText('2. Click "Upload Document"');
addText('3. Select your file and add a description');
addText('4. Choose the appropriate category');
addText('5. Click "Upload" to save');

addSubsection('Document Types You May Need');
addText('• Customer feedback reports');
addText('• Communication templates');
addText('• Training certificates');
addText('• Meeting notes');
addText('• Project documentation');

addSubsection('Accessing Documents');
addText('• All your uploaded documents appear in the Documents section');
addText('• Use search to find specific files quickly');
addText('• Download documents by clicking on them');

// Profile Management
addSection('👤 Profile Management');
addSubsection('Updating Your Information');
addText('1. Click "Profile" in the left sidebar');
addText('2. Update your information as needed:');
addText('   - Contact details (phone, address)');
addText('   - Emergency contact information');
addText('   - Professional skills and qualifications');
addText('   - Profile photo');
addText('3. Click "Save Changes" when done');

addSubsection('Important Profile Sections');
addText('• Personal Information: Keep contact details current');
addText('• Professional Details: Update skills and experience');
addText('• Emergency Contact: Ensure this information is accurate');
addText('• Banking Information: Required for salary processing');

// Notifications
addSection('🔔 Notifications and Communication');
addSubsection('Checking Notifications');
addText('1. Click the bell icon in the top navigation');
addText('2. View recent notifications including:');
addText('   - New task assignments');
addText('   - Project updates');
addText('   - System announcements');
addText('   - Deadline reminders');

addSubsection('Reading Announcements');
addText('1. Go to "Announcements" section');
addText('2. Read company-wide updates');
addText('3. Important announcements are highlighted');
addText('4. Mark as read when reviewed');

// Role Responsibilities
addSection('💼 Your Role as Customer Relationship Manager');
addSubsection('Daily Responsibilities');
addText('• Customer Communication: Respond to customer inquiries promptly');
addText('• Relationship Building: Maintain positive relationships with clients');
addText('• Issue Resolution: Address customer concerns and complaints');
addText('• Documentation: Record customer interactions and feedback');
addText('• Reporting: Complete assigned reports and surveys');

addSubsection('Key Performance Areas');
addText('• Customer Satisfaction: Ensure clients are happy with services');
addText('• Response Time: Reply to customers within set timeframes');
addText('• Communication Quality: Maintain professional and helpful interactions');
addText('• Problem Solving: Resolve issues effectively and efficiently');

// Troubleshooting
addSection('🛠️ Troubleshooting Common Issues');
addSubsection('Login Problems');
addText('• Forgot Password: Contact your HR administrator for password reset');
addText('• Account Locked: Contact IT support if multiple login attempts fail');
addText('• Browser Issues: Try clearing browser cache or using a different browser');

addSubsection('Contract Signing Issues');
addText('• Modal Not Appearing: Refresh the page and try again');
addText('• Signature Not Saving: Ensure you have a stable internet connection');
addText('• Contract Questions: Contact HR Manager Shahzad Ahmad for clarification');

addSubsection('System Access Issues');
addText('• Limited Access: Make sure you have completed contract signing');
addText('• Missing Features: Verify your role permissions with HR');
addText('• Page Loading Slowly: Check your internet connection');

// Support Contacts
addSection('📞 Support and Contacts');
addSubsection('For Technical Issues');
addText('• Contact your IT support team');
addText('• Report system bugs or glitches immediately');

addSubsection('For HR Related Questions');
addText('• HR Manager: Shahzad Ahmad');
addText('• Email: hr@themeetingmatters.com');
addText('• Contact for: Employment questions, policy clarifications, benefits information');

addSubsection('For Work-Related Support');
addText('• Supervisor: Your direct manager');
addText('• Team Lead: Contact for project guidance and task clarification');

// Security
addSection('🔒 Security and Best Practices');
addSubsection('Password Security');
addText('• Never share your login credentials');
addText('• Use a strong, unique password');
addText('• Log out when leaving your workstation');
addText('• Report any suspicious activity immediately');

addSubsection('Data Protection');
addText('• Keep customer information confidential');
addText('• Only access information necessary for your role');
addText('• Follow company data protection policies');
addText('• Secure physical and digital documents');

addSubsection('Professional Conduct');
addText('• Maintain professional communication at all times');
addText('• Respect confidentiality of company and customer information');
addText('• Follow company policies and procedures');
addText('• Report any concerns to your supervisor');

// Quick Reference
addSection('📚 Quick Reference');
addSubsection('Essential Daily Actions');
addText('1. Log in to the system every morning');
addText('2. Check notifications for new updates');
addText('3. Review assigned tasks and prioritize your work');
addText('4. Update task status as you progress');
addText('5. Upload any required documents');
addText('6. Check announcements for company updates');
addText('7. Log out securely when finished');

addSubsection('Important Reminders');
addText('✓ Complete contract signing on first login');
addText('✓ Keep your profile information updated');
addText('✓ Respond to tasks within deadlines');
addText('✓ Maintain professional communication');
addText('✓ Secure your login credentials');

// Employment Details
addSection('📋 Employment Details Summary');
addText('• Position: Customer Relationship Manager');
addText('• Department: Customer Relations');
addText('• Salary: PKR 60,000 per month');
addText('• Working Hours: Monday-Friday, 9:00 AM - 6:00 PM');
addText('• Start Date: August 19, 2025');
addText('• Probation Period: 3 months');
addText('• Benefits: Health insurance, annual leave (15 days), sick leave (10 days), professional development');

// Footer
yPos += 20;
addText('Welcome to the team, Muqaddas! We look forward to working with you.', 12, 'bold', true);
yPos += 10;
addText('For any questions about this manual or the system, please contact your supervisor or HR department.');

yPos += 20;
addText('Document Created: August 18, 2025');
addText('Version: 1.0');
addText('Meeting Matters Clinic - Business Management System');

// Save the PDF
const pdfBuffer = doc.output('arraybuffer');
fs.writeFileSync('Muqaddas_User_Manual.pdf', Buffer.from(pdfBuffer));

console.log('PDF generated successfully: Muqaddas_User_Manual.pdf');