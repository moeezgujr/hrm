# Q361 SaaS Subscription Model Documentation

## Overview

Q361 by Qanzak Global has been developed as a comprehensive SaaS (Software as a Service) Business Management platform with a multi-tier subscription model designed to serve organizations of all sizes. The system features automated trial request processing, Stripe payment integration, and role-based access control.

## Subscription Tiers

### 1. Starter Plan
- **Price**: $29/month or $290/year (17% savings)
- **Target Audience**: Small businesses with 1-10 employees
- **Features**:
  - Basic employee management
  - Simple onboarding workflows
  - Task management
  - Basic reporting
  - Email support

### 2. Professional Plan
- **Price**: $79/month or $790/year (17% savings)
- **Target Audience**: Growing companies with 11-50 employees
- **Features**:
  - Everything in Starter
  - Advanced psychometric testing
  - Department management
  - Recognition programs
  - Analytics dashboard
  - Priority support
  - Custom onboarding workflows

### 3. Enterprise Plan
- **Price**: $199/month or $1990/year (17% savings)
- **Target Audience**: Large organizations with 50+ employees
- **Features**:
  - Everything in Professional
  - Advanced analytics and reporting
  - Multi-department isolation
  - Custom integrations
  - Dedicated account manager
  - Advanced security features
  - White-label options

## Trial Request System

### How It Works

1. **Trial Request Submission**
   - Prospects visit `/subscribe` to submit trial requests
   - No payment required upfront
   - Comprehensive information collection before any financial commitment

2. **Information Collection**
   - Company name and details
   - Contact person information
   - Team size and organizational needs
   - Preferred subscription plan
   - Billing cycle preference (monthly/yearly)

3. **Admin Review Process**
   - All trial requests require HR admin approval
   - Admins review requests at `/admin/trial-requests`
   - Ability to approve with notes or reject with reasons
   - Email notifications sent automatically

4. **Trial Activation**
   - Upon approval, 14-day free trial is activated
   - Customer receives email with access credentials
   - Full platform access during trial period
   - Automatic conversion to paid subscription after trial

### Benefits of This Model

- **Quality Control**: Admin review ensures legitimate business prospects
- **Personalized Onboarding**: Admins can tailor trial experience based on company needs
- **Better Conversion**: Human touch improves trial-to-paid conversion rates
- **Fraud Prevention**: Reduces fake signups and abuse

## Payment Processing

### Stripe Integration
- Secure payment processing through Stripe
- Support for monthly and yearly billing cycles
- Automatic subscription management
- Failed payment handling
- Subscription upgrades/downgrades

### Billing Cycles
- **Monthly**: Full flexibility, higher monthly cost
- **Yearly**: 17% discount, annual commitment

## Email Notification System

### Automated Emails
- Trial request confirmation to prospects
- New trial request alerts to admins
- Trial approval notifications with access details
- Trial rejection notifications with reasons
- Payment confirmations and receipts

### Email Service
- Professional email integration via Qanzak Global
- HTML templates with Q361 branding
- Reliable delivery through enterprise infrastructure

## User Roles and Access Control

### For Customer Organizations
- **HR Admin**: Full access to all features
- **Branch Manager**: Department-level management
- **Team Lead**: Team and task management
- **Employee**: Personal dashboard and tasks
- **Logistics Manager**: Inventory and logistics

### For Q361 (Platform Provider)
- **System Admin**: Platform-wide management
- **Support Team**: Customer assistance
- **Sales Team**: Trial request review and conversion

## Technical Architecture

### Database Schema
```sql
-- Subscription Plans
subscription_plans (
  id, name, plan_id, price_monthly, price_yearly, 
  features, max_employees, created_at
)

-- Trial Requests
trial_requests (
  id, name, email, company, phone, job_title,
  team_size, plan_id, billing_cycle, status,
  notes, rejection_reason, created_at, approved_at
)

-- Customer Subscriptions
customer_subscriptions (
  id, customer_id, plan_id, stripe_subscription_id,
  status, current_period_start, current_period_end,
  trial_start, trial_end
)
```

### API Endpoints
- `GET /api/subscription-plans` - List available plans
- `POST /api/trial-requests` - Submit trial request
- `GET /api/trial-requests` - List trial requests (admin)
- `POST /api/trial-requests/:id/approve` - Approve trial
- `POST /api/trial-requests/:id/reject` - Reject trial
- `POST /api/create-subscription` - Create Stripe subscription
- `GET /api/my-subscription` - Get user's subscription

## Customer Journey

### 1. Discovery & Research
- Prospect visits marketing website
- Learns about Q361 features
- Compares subscription plans

### 2. Trial Request
- Fills out comprehensive trial request form
- Provides company and contact information
- Selects preferred plan and billing cycle

### 3. Admin Review
- HR admin receives email notification
- Reviews company details and requirements
- Makes approval/rejection decision with notes

### 4. Trial Activation
- Approved prospects receive welcome email
- Access credentials and onboarding instructions provided
- 14-day trial period begins

### 5. Trial Experience
- Full access to selected plan features
- Onboarding support and guidance
- Regular check-ins from customer success

### 6. Conversion to Paid
- Automatic subscription activation after trial
- Payment processing through Stripe
- Continued access to all features

## Revenue Model

### Subscription Revenue
- Predictable recurring revenue
- Multiple pricing tiers for different market segments
- Annual plans provide cash flow advantages

### Pricing Strategy
- Competitive pricing within HR tech market
- Value-based pricing aligned with ROI
- Scalable pricing that grows with customer success

## Success Metrics

### Key Performance Indicators (KPIs)
- Trial request conversion rate
- Trial-to-paid conversion rate
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Lifetime Value (CLV)
- Churn rate by plan type

### Operational Metrics
- Average trial approval time
- Customer acquisition cost
- Support ticket volume
- Feature adoption rates

## Security and Compliance

### Data Protection
- Encrypted data transmission (SSL/TLS)
- Secure password storage (bcrypt)
- Role-based access control
- Session management best practices

### Payment Security
- PCI DSS compliance through Stripe
- No sensitive payment data stored locally
- Secure payment processing workflows

## Administrative Features

### Trial Management Dashboard
- Real-time trial request monitoring
- Batch approval/rejection capabilities
- Customer communication tools
- Analytics and reporting

### Subscription Management
- Customer subscription overview
- Plan upgrade/downgrade tools
- Payment status monitoring
- Billing and invoicing

## Support and Documentation

### Customer Support
- Email support for all plans
- Priority support for Professional and Enterprise
- Knowledge base and documentation
- Video tutorials and training

### Implementation Support
- Dedicated onboarding for Enterprise customers
- Custom configuration assistance
- Data migration support
- Integration consulting

## Future Enhancements

### Planned Features
- Self-service trial activation option
- Advanced analytics dashboard
- API access for Enterprise customers
- Mobile application
- Third-party integrations (Slack, Microsoft Teams)

### Scalability Considerations
- Multi-region deployment
- Performance optimization
- Advanced caching strategies
- Load balancing and redundancy

## Getting Started

### For New Customers
1. Visit the subscription plans page
2. Submit a trial request with company details
3. Wait for admin approval (typically 24-48 hours)
4. Receive welcome email with access instructions
5. Complete onboarding and start using the platform

### For Administrators
1. Monitor trial requests in the admin dashboard
2. Review company information and requirements
3. Approve or reject requests with appropriate notes
4. Support customers during trial period
5. Track conversion metrics and optimize process

## Contact and Support

- **Email**: support@q361.qanzakglobal.com
- **Trial Requests**: Handled through admin dashboard
- **Technical Support**: Available during business hours
- **Account Management**: Dedicated support for Enterprise customers

---

*This documentation is maintained by the Q361 development team at Qanzak Global. Last updated: December 2025*