const { jsPDF } = require('jspdf');
const fs = require('fs');

// Create new PDF document
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Set up fonts and styling
const pageWidth = 210;
const pageHeight = 297;
const margin = 20;
const contentWidth = pageWidth - (margin * 2);

let currentY = margin;

// Helper functions
function addTitle(text, fontSize = 16, color = [0, 0, 0]) {
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(text, margin, currentY);
  currentY += fontSize * 0.6;
}

function addSubtitle(text, fontSize = 12, color = [0, 0, 0]) {
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(text, margin, currentY);
  currentY += fontSize * 0.6;
}

function addText(text, fontSize = 10, color = [0, 0, 0], indent = 0) {
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont('helvetica', 'normal');
  
  const lines = doc.splitTextToSize(text, contentWidth - indent);
  for (let line of lines) {
    checkPageBreak();
    doc.text(line, margin + indent, currentY);
    currentY += fontSize * 0.5;
  }
}

function addBulletPoint(text, fontSize = 10, color = [0, 0, 0]) {
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont('helvetica', 'normal');
  
  const bulletIndent = 5;
  const textIndent = 10;
  
  checkPageBreak();
  doc.text('•', margin + bulletIndent, currentY);
  
  const lines = doc.splitTextToSize(text, contentWidth - textIndent);
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) checkPageBreak();
    doc.text(lines[i], margin + textIndent, currentY);
    currentY += fontSize * 0.5;
  }
}

function checkPageBreak() {
  if (currentY > pageHeight - margin) {
    doc.addPage();
    currentY = margin;
  }
}

function addSpacing(height = 5) {
  currentY += height;
}

// Start building the PDF content
addTitle('Meeting Matters SaaS', 20, [34, 139, 34]);
addTitle('Subscription Model Documentation', 16, [34, 139, 34]);
addSpacing(10);

addText('Generated: ' + new Date().toLocaleDateString(), 9, [100, 100, 100]);
addSpacing(10);

// Overview Section
addTitle('Overview', 14, [0, 0, 0]);
addText('Meeting Matters has been transformed into a comprehensive SaaS (Software as a Service) HR management platform with a multi-tier subscription model designed to serve organizations of all sizes. The system features automated trial request processing, Stripe payment integration, and role-based access control.');
addSpacing(8);

// Subscription Tiers
addTitle('Subscription Tiers', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('1. Starter Plan', 12, [34, 139, 34]);
addBulletPoint('Price: $29/month or $290/year (17% savings)');
addBulletPoint('Target Audience: Small businesses with 1-10 employees');
addText('Features:', 10, [0, 0, 0], 5);
addBulletPoint('Basic employee management');
addBulletPoint('Simple onboarding workflows');
addBulletPoint('Task management');
addBulletPoint('Basic reporting');
addBulletPoint('Email support');
addSpacing(5);

addSubtitle('2. Professional Plan', 12, [34, 139, 34]);
addBulletPoint('Price: $79/month or $790/year (17% savings)');
addBulletPoint('Target Audience: Growing companies with 11-50 employees');
addText('Features:', 10, [0, 0, 0], 5);
addBulletPoint('Everything in Starter');
addBulletPoint('Advanced psychometric testing');
addBulletPoint('Department management');
addBulletPoint('Recognition programs');
addBulletPoint('Analytics dashboard');
addBulletPoint('Priority support');
addBulletPoint('Custom onboarding workflows');
addSpacing(5);

addSubtitle('3. Enterprise Plan', 12, [34, 139, 34]);
addBulletPoint('Price: $199/month or $1990/year (17% savings)');
addBulletPoint('Target Audience: Large organizations with 50+ employees');
addText('Features:', 10, [0, 0, 0], 5);
addBulletPoint('Everything in Professional');
addBulletPoint('Advanced analytics and reporting');
addBulletPoint('Multi-department isolation');
addBulletPoint('Custom integrations');
addBulletPoint('Dedicated account manager');
addBulletPoint('Advanced security features');
addBulletPoint('White-label options');
addSpacing(8);

// Trial Request System
addTitle('Trial Request System', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('How It Works', 12, [34, 139, 34]);
addText('1. Trial Request Submission', 11, [0, 0, 0], 5);
addBulletPoint('Prospects visit /subscribe to submit trial requests');
addBulletPoint('No payment required upfront');
addBulletPoint('Comprehensive information collection before any financial commitment');
addSpacing(3);

addText('2. Information Collection', 11, [0, 0, 0], 5);
addBulletPoint('Company name and details');
addBulletPoint('Contact person information');
addBulletPoint('Team size and organizational needs');
addBulletPoint('Preferred subscription plan');
addBulletPoint('Billing cycle preference (monthly/yearly)');
addSpacing(3);

addText('3. Admin Review Process', 11, [0, 0, 0], 5);
addBulletPoint('All trial requests require HR admin approval');
addBulletPoint('Admins review requests at /admin/trial-requests');
addBulletPoint('Ability to approve with notes or reject with reasons');
addBulletPoint('Email notifications sent automatically');
addSpacing(3);

addText('4. Trial Activation', 11, [0, 0, 0], 5);
addBulletPoint('Upon approval, 14-day free trial is activated');
addBulletPoint('Customer receives email with access credentials');
addBulletPoint('Full platform access during trial period');
addBulletPoint('Automatic conversion to paid subscription after trial');
addSpacing(8);

// Benefits
addSubtitle('Benefits of This Model', 12, [34, 139, 34]);
addBulletPoint('Quality Control: Admin review ensures legitimate business prospects');
addBulletPoint('Personalized Onboarding: Admins can tailor trial experience based on company needs');
addBulletPoint('Better Conversion: Human touch improves trial-to-paid conversion rates');
addBulletPoint('Fraud Prevention: Reduces fake signups and abuse');
addSpacing(8);

// Payment Processing
addTitle('Payment Processing', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('Stripe Integration', 12, [34, 139, 34]);
addBulletPoint('Secure payment processing through Stripe');
addBulletPoint('Support for monthly and yearly billing cycles');
addBulletPoint('Automatic subscription management');
addBulletPoint('Failed payment handling');
addBulletPoint('Subscription upgrades/downgrades');
addSpacing(5);

addSubtitle('Billing Cycles', 12, [34, 139, 34]);
addBulletPoint('Monthly: Full flexibility, higher monthly cost');
addBulletPoint('Yearly: 17% discount, annual commitment');
addSpacing(8);

// Email Notification System
addTitle('Email Notification System', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('Automated Emails', 12, [34, 139, 34]);
addBulletPoint('Trial request confirmation to prospects');
addBulletPoint('New trial request alerts to admins');
addBulletPoint('Trial approval notifications with access details');
addBulletPoint('Trial rejection notifications with reasons');
addBulletPoint('Payment confirmations and receipts');
addSpacing(5);

addSubtitle('Email Service', 12, [34, 139, 34]);
addBulletPoint('Professional Gmail integration (meetingmatters786@gmail.com)');
addBulletPoint('HTML templates with company branding');
addBulletPoint('Reliable delivery through Google infrastructure');
addSpacing(8);

// User Roles
addTitle('User Roles and Access Control', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('For Customer Organizations', 12, [34, 139, 34]);
addBulletPoint('HR Admin: Full access to all features');
addBulletPoint('Branch Manager: Department-level management');
addBulletPoint('Team Lead: Team and task management');
addBulletPoint('Employee: Personal dashboard and tasks');
addBulletPoint('Logistics Manager: Inventory and logistics');
addSpacing(5);

addSubtitle('For Meeting Matters (Platform Provider)', 12, [34, 139, 34]);
addBulletPoint('System Admin: Platform-wide management');
addBulletPoint('Support Team: Customer assistance');
addBulletPoint('Sales Team: Trial request review and conversion');
addSpacing(8);

// Customer Journey
addTitle('Customer Journey', 14, [0, 0, 0]);
addSpacing(3);

addText('1. Discovery & Research', 11, [0, 0, 0], 5);
addBulletPoint('Prospect visits marketing website');
addBulletPoint('Learns about Meeting Matters features');
addBulletPoint('Compares subscription plans');
addSpacing(3);

addText('2. Trial Request', 11, [0, 0, 0], 5);
addBulletPoint('Fills out comprehensive trial request form');
addBulletPoint('Provides company and contact information');
addBulletPoint('Selects preferred plan and billing cycle');
addSpacing(3);

addText('3. Admin Review', 11, [0, 0, 0], 5);
addBulletPoint('HR admin receives email notification');
addBulletPoint('Reviews company details and requirements');
addBulletPoint('Makes approval/rejection decision with notes');
addSpacing(3);

addText('4. Trial Activation', 11, [0, 0, 0], 5);
addBulletPoint('Approved prospects receive welcome email');
addBulletPoint('Access credentials and onboarding instructions provided');
addBulletPoint('14-day trial period begins');
addSpacing(3);

addText('5. Trial Experience', 11, [0, 0, 0], 5);
addBulletPoint('Full access to selected plan features');
addBulletPoint('Onboarding support and guidance');
addBulletPoint('Regular check-ins from customer success');
addSpacing(3);

addText('6. Conversion to Paid', 11, [0, 0, 0], 5);
addBulletPoint('Automatic subscription activation after trial');
addBulletPoint('Payment processing through Stripe');
addBulletPoint('Continued access to all features');
addSpacing(8);

// Revenue Model
addTitle('Revenue Model', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('Subscription Revenue', 12, [34, 139, 34]);
addBulletPoint('Predictable recurring revenue');
addBulletPoint('Multiple pricing tiers for different market segments');
addBulletPoint('Annual plans provide cash flow advantages');
addSpacing(5);

addSubtitle('Pricing Strategy', 12, [34, 139, 34]);
addBulletPoint('Competitive pricing within HR tech market');
addBulletPoint('Value-based pricing aligned with ROI');
addBulletPoint('Scalable pricing that grows with customer success');
addSpacing(8);

// Success Metrics
addTitle('Success Metrics', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('Key Performance Indicators (KPIs)', 12, [34, 139, 34]);
addBulletPoint('Trial request conversion rate');
addBulletPoint('Trial-to-paid conversion rate');
addBulletPoint('Monthly Recurring Revenue (MRR)');
addBulletPoint('Annual Recurring Revenue (ARR)');
addBulletPoint('Customer Lifetime Value (CLV)');
addBulletPoint('Churn rate by plan type');
addSpacing(5);

addSubtitle('Operational Metrics', 12, [34, 139, 34]);
addBulletPoint('Average trial approval time');
addBulletPoint('Customer acquisition cost');
addBulletPoint('Support ticket volume');
addBulletPoint('Feature adoption rates');
addSpacing(8);

// Technical Architecture
addTitle('Technical Architecture', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('Database Schema', 12, [34, 139, 34]);
addText('Subscription Plans Table:', 10, [0, 0, 0], 5);
addBulletPoint('id, name, plan_id, price_monthly, price_yearly');
addBulletPoint('features, max_employees, created_at');
addSpacing(3);

addText('Trial Requests Table:', 10, [0, 0, 0], 5);
addBulletPoint('id, name, email, company, phone, job_title');
addBulletPoint('team_size, plan_id, billing_cycle, status');
addBulletPoint('notes, rejection_reason, created_at, approved_at');
addSpacing(3);

addText('Customer Subscriptions Table:', 10, [0, 0, 0], 5);
addBulletPoint('id, customer_id, plan_id, stripe_subscription_id');
addBulletPoint('status, current_period_start, current_period_end');
addBulletPoint('trial_start, trial_end');
addSpacing(5);

addSubtitle('API Endpoints', 12, [34, 139, 34]);
addBulletPoint('GET /api/subscription-plans - List available plans');
addBulletPoint('POST /api/trial-requests - Submit trial request');
addBulletPoint('GET /api/trial-requests - List trial requests (admin)');
addBulletPoint('POST /api/trial-requests/:id/approve - Approve trial');
addBulletPoint('POST /api/trial-requests/:id/reject - Reject trial');
addBulletPoint('POST /api/create-subscription - Create Stripe subscription');
addBulletPoint('GET /api/my-subscription - Get user subscription');
addSpacing(8);

// Security and Compliance
addTitle('Security and Compliance', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('Data Protection', 12, [34, 139, 34]);
addBulletPoint('Encrypted data transmission (SSL/TLS)');
addBulletPoint('Secure password storage (bcrypt)');
addBulletPoint('Role-based access control');
addBulletPoint('Session management best practices');
addSpacing(5);

addSubtitle('Payment Security', 12, [34, 139, 34]);
addBulletPoint('PCI DSS compliance through Stripe');
addBulletPoint('No sensitive payment data stored locally');
addBulletPoint('Secure payment processing workflows');
addSpacing(8);

// Administrative Features
addTitle('Administrative Features', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('Trial Management Dashboard', 12, [34, 139, 34]);
addBulletPoint('Real-time trial request monitoring');
addBulletPoint('Batch approval/rejection capabilities');
addBulletPoint('Customer communication tools');
addBulletPoint('Analytics and reporting');
addSpacing(5);

addSubtitle('Subscription Management', 12, [34, 139, 34]);
addBulletPoint('Customer subscription overview');
addBulletPoint('Plan upgrade/downgrade tools');
addBulletPoint('Payment status monitoring');
addBulletPoint('Billing and invoicing');
addSpacing(8);

// Support and Documentation
addTitle('Support and Documentation', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('Customer Support', 12, [34, 139, 34]);
addBulletPoint('Email support for all plans');
addBulletPoint('Priority support for Professional and Enterprise');
addBulletPoint('Knowledge base and documentation');
addBulletPoint('Video tutorials and training');
addSpacing(5);

addSubtitle('Implementation Support', 12, [34, 139, 34]);
addBulletPoint('Dedicated onboarding for Enterprise customers');
addBulletPoint('Custom configuration assistance');
addBulletPoint('Data migration support');
addBulletPoint('Integration consulting');
addSpacing(8);

// Future Enhancements
addTitle('Future Enhancements', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('Planned Features', 12, [34, 139, 34]);
addBulletPoint('Self-service trial activation option');
addBulletPoint('Advanced analytics dashboard');
addBulletPoint('API access for Enterprise customers');
addBulletPoint('Mobile application');
addBulletPoint('Third-party integrations (Slack, Microsoft Teams)');
addSpacing(5);

addSubtitle('Scalability Considerations', 12, [34, 139, 34]);
addBulletPoint('Multi-region deployment');
addBulletPoint('Performance optimization');
addBulletPoint('Advanced caching strategies');
addBulletPoint('Load balancing and redundancy');
addSpacing(8);

// Getting Started
addTitle('Getting Started', 14, [0, 0, 0]);
addSpacing(3);

addSubtitle('For New Customers', 12, [34, 139, 34]);
addBulletPoint('Visit the subscription plans page');
addBulletPoint('Submit a trial request with company details');
addBulletPoint('Wait for admin approval (typically 24-48 hours)');
addBulletPoint('Receive welcome email with access instructions');
addBulletPoint('Complete onboarding and start using the platform');
addSpacing(5);

addSubtitle('For Administrators', 12, [34, 139, 34]);
addBulletPoint('Monitor trial requests in the admin dashboard');
addBulletPoint('Review company information and requirements');
addBulletPoint('Approve or reject requests with appropriate notes');
addBulletPoint('Support customers during trial period');
addBulletPoint('Track conversion metrics and optimize process');
addSpacing(8);

// Contact Information
addTitle('Contact and Support', 14, [0, 0, 0]);
addSpacing(3);
addBulletPoint('Email: meetingmatters786@gmail.com');
addBulletPoint('Trial Requests: Handled through admin dashboard');
addBulletPoint('Technical Support: Available during business hours');
addBulletPoint('Account Management: Dedicated support for Enterprise customers');
addSpacing(10);

// Footer
addText('This documentation is maintained by the Meeting Matters development team.', 9, [100, 100, 100]);
addText('Last updated: August 2025', 9, [100, 100, 100]);

// Save the PDF to file system
const pdfBuffer = doc.output('arraybuffer');
fs.writeFileSync('Meeting_Matters_Subscription_Model.pdf', Buffer.from(pdfBuffer));
console.log('PDF generated successfully: Meeting_Matters_Subscription_Model.pdf');