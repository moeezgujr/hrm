import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

export default function GenerateSubscriptionPDF() {
  const generatePDF = () => {
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
    const addTitle = (text: string, fontSize = 16, color = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, currentY);
      currentY += fontSize * 0.6;
    };

    const addSubtitle = (text: string, fontSize = 12, color = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, currentY);
      currentY += fontSize * 0.6;
    };

    const addText = (text: string, fontSize = 10, color = [0, 0, 0], indent = 0) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', 'normal');
      
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      for (let line of lines) {
        checkPageBreak();
        doc.text(line, margin + indent, currentY);
        currentY += fontSize * 0.5;
      }
    };

    const addBulletPoint = (text: string, fontSize = 10, color = [0, 0, 0]) => {
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
    };

    const checkPageBreak = () => {
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
    };

    const addSpacing = (height = 5) => {
      currentY += height;
    };

    // Start building the PDF content
    addTitle('Meeting Matters SaaS', 20, [34, 139, 34]);
    addTitle('Subscription Model Documentation', 16, [34, 139, 34]);
    addSpacing(10);

    addText('Generated: ' + new Date().toLocaleDateString(), 9, [100, 100, 100]);
    addSpacing(10);

    // Overview Section
    addTitle('Overview', 14, [0, 0, 0]);
    addText('Meeting Matters has been transformed into a comprehensive SaaS (Software as a Service) business management platform with a multi-tier subscription model designed to serve organizations of all sizes. The system features automated trial request processing, Stripe payment integration, and role-based access control.');
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

    // Save the PDF
    doc.save('Meeting_Matters_Subscription_Model.pdf');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">PDF Documentation Generator</h1>
        <p className="text-gray-600">Generate a PDF version of the subscription model documentation</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Subscription Model Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Document Contents:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Complete subscription tier overview (Starter, Professional, Enterprise)</li>
              <li>• Trial request system workflow and benefits</li>
              <li>• Payment processing and billing information</li>
              <li>• Email notification system details</li>
              <li>• User roles and access control</li>
              <li>• Customer journey and conversion process</li>
              <li>• Revenue model and success metrics</li>
              <li>• Contact information and support details</li>
            </ul>
          </div>

          <div className="text-center">
            <Button onClick={generatePDF} className="flex items-center gap-2 mx-auto">
              <Download className="w-4 h-4" />
              Download PDF Documentation
            </Button>
          </div>

          <div className="text-sm text-gray-600 text-center">
            The PDF will be automatically downloaded to your device when you click the button above.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}