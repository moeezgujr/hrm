# Overview

**Q361** is a Complete Business Management System by Qanzak Global, designed to streamline the entire employee lifecycle, from onboarding and task management to CRM, logistics, recognition, and psychometric testing. It centralizes business operations with automated workflows, robust document management, inventory tracking, and collaborative project management. The system supports multi-company management, role-based access control, and offers both authenticated user interfaces and public portals for pre-access onboarding and psychometric assessments. It operates on a SaaS subscription model with tiered plans.

**Product**: Q361 - Complete Business Management System
**Company**: Qanzak Global
**URL**: hr.themeetingmatters.com

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript, Vite
- **UI**: shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS

## Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API**: RESTful API
- **Session Management**: Express sessions

## Data Storage
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM
- **Session Storage**: PostgreSQL
- **File Storage**: Replit object storage (public and private directories), Base64 encoding for specific uploads

## Authentication & Authorization
- **Provider**: Local authentication with session-based auth
- **Login Methods**: Username/password OR Employee ID/password
- **Access Control**: Role-based permissions with HR Personnel designation
  - **Base Roles**: HR Admin, Branch Manager, Team Lead, Employee, Logistics Manager
  - **HR Personnel System**: Special designation that grants comprehensive HR access (employee_management, contract_management, announcements, leave_management at manage level) while preserving existing permissions
  - **Permission Architecture**: HR Personnel permissions merge with role-based and user-specific permissions rather than replacing them
- **Security**: HTTP-only cookies, CSRF protection, bcrypt password hashing
- **Public Access**: Separate routes for onboarding portals and psychometric tests

## Key Features
- **Employee Lifecycle Management**: Comprehensive system covering onboarding, project management, and offboarding.
- **Multi-Company Management**: Distinguish and manage employees across multiple organizations.
- **SaaS Subscription Model**: Multi-tier plans with trial request workflow.
- **Project Management System**: CRUD operations for projects with hierarchical structure.
- **Email Notification System**: Automated notifications via Gmail integration using HTML templates.
- **Onboarding System**: Multi-step interactive process including psychometric assessments and a public pre-access portal.
- **Psychometric Testing**: Five professional test categories with advanced scoring.
- **Social Media Manager**: Centralized platform for connecting and managing social media accounts (Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube) with unified analytics dashboard, account status tracking, and performance metrics monitoring.
- **Q361 Studio**: A content creation and marketing management platform with:
    - **Studio Meetings & CEO Presentations**: Weekly presentation and planning system featuring a real-time dashboard with customizable sections (stored in DB) and a professional presentation view with continuity tracking that displays the previous meeting's completed work items for context and follow-up.
    - **Creative Briefs**: Workflow for creative projects with template-based system and status tracking.
    - **Asset Library**: Centralized media management with metadata tracking.
    - **Approval Workflows**: Multi-stage content review and approval processes.
    - **Studio Reports**: Analytics dashboard for marketing performance.
    - **Manual Analytics Entry System**: Track social media performance with manual data entry for platforms (Instagram, Facebook, Twitter, LinkedIn, TikTok, YouTube) including metrics like reach, impressions, engagement, likes, comments, shares, clicks, video views, saves, profile visits, and follower growth. Features full CRUD operations with campaign linking and status tracking.
    - **Previous Meeting Work Tracking**: CEO Presentation view displays "Last Meeting Work Done" section showing all completed work items from the chronologically previous meeting (filtered by organization, campaign, and project context) to provide continuity and context for the current meeting.
    - **Modern UI Design**: Gradient color schemes and sparkle icons for new features.
- **Comprehensive Reporting**: Enhanced daily and overall PDF reports.
- **Modern UI Design System**: Consistent design language with professional gradient headers, enhanced card components, engaging empty states, colorful avatar system, and responsive design.
- **Mobile-Responsive Design**: Fully optimized for all device sizes with:
    - **Mobile Sidebar Drawer**: Sheet-based slide-out navigation using MobileMenuContext for state management
    - **Hamburger Menu**: Toggle button in header (visible on mobile, hidden on desktop with md:hidden class)
    - **Responsive Layouts**: Flex-col to flex-row transitions at sm/md breakpoints
    - **Responsive Typography**: text-xl md:text-2xl scaling across all page headers
    - **Responsive Padding**: p-4 md:p-6 patterns for comfortable mobile viewing
    - **Touch-Friendly Controls**: Larger tap targets and proper spacing for mobile interaction
- **Organizational Hierarchy Visualization**: Interactive, multi-tenancy isolated tree-based visualization of reporting structures.
- **Reporting Manager Selection**: HR admins can assign reporting managers, displayed on employee profiles and the organizational hierarchy.
- **Job Application Form Persistence**: Auto-save functionality for the applicant portal.
- **Responsibility Document Attachments**: HR admins can attach PDF, audio, and video files (up to 50MB) to job responsibilities, stored securely in object storage.
- **Rich Text Editor for Policies**: TipTap-based rich text editor for creating formatted policy content (announcements) with bold, italic, underline, headings (H1-H3), bullet/numbered lists, text alignment, 8 color options, and undo/redo functionality.

# External Dependencies

- **Database Hosting**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth OIDC service
- **UI Components**: Radix UI
- **PDF Generation**: jsPDF
- **Date Handling**: date-fns
- **Form Validation**: Zod
- **Icons**: Lucide React
- **WebSocket Support**: ws library