# Database Seeding Guide

## Overview
The `seed-database.js` script populates your HRM database with comprehensive demo data for testing and development.

## What Gets Seeded

### 1. **Companies** (2)
- Qanzak Global (Technology company)
- Meeting Matters Clinic (Healthcare company)

### 2. **Departments** (5)
- Human Resources
- Information Technology
- Sales & Marketing
- Operations
- Social Media & Content

### 3. **Users** (8 with different roles)
- **HR Admin**: admin
- **Branch Manager**: sarah.johnson (HR Manager)
- **Department Head**: mike.chen (IT Manager)
- **Employees**:
  - john.doe (Software Developer)
  - jane.smith (Marketing Specialist)
  - alex.rivera (Operations Coordinator)
  - emily.wilson (Social Media Manager)
  - david.brown (Content Creator)

### 4. **Employee Records** (3)
- Detailed employee information for john.doe, jane.smith, and alex.rivera

### 5. **Projects** (3)
- Website Redesign
- Marketing Campaign Q2
- Internal Process Automation

### 6. **Project Members & Tasks**
- Team assignments across projects
- 5 project-specific tasks with various statuses

### 7. **General Tasks** (3)
- HR and IT administrative tasks

### 8. **Announcements** (3)
- System welcome, holiday schedule, benefits program

### 9. **Employee Recognitions** (3)
- Employee of the month, team player, innovation awards

### 10. **Logistics Items** (4)
- Office equipment and supplies with stock levels

### 11. **Onboarding Checklists** (4)
- New hire onboarding tasks

### 12. **Documents** (3)
- Company policies, training materials, reports

### 13. **Psychometric Tests**
- 16PF personality assessment with 5 sample questions

## How to Run

### Local Development (Windows PowerShell)
```powershell
# Set your database URL
$env:DATABASE_URL = "postgresql://myuser1:your_password@localhost:5432/hrm"

# Run the seed script
node seed-database.js
```

### On Server (Linux/Ubuntu)
```bash
# Set your database URL
export DATABASE_URL="postgresql://hrm_user:12345555@localhost:5432/hrm_db"

# Run the seed script
node seed-database.js
```

### Alternative with npx tsx
```bash
npx tsx seed-database.js
```

## Prerequisites

1. **Database must exist** - Ensure your PostgreSQL database is created
2. **Schema must be migrated** - Run `npm run db:push` first to create tables
3. **Empty tables recommended** - For best results, seed into fresh tables

## Complete Setup Flow

### Fresh Database Setup
```bash
# 1. Reset database (optional - if you want clean slate)
psql -U your_user -d your_db -f reset-database.sql

# 2. Create schema
npm run db:push

# 3. Seed data
node seed-database.js

# 4. Start application
npm run dev
```

## Login Credentials

All users have the same password for testing: **password123**

| Username | Role | Email |
|----------|------|-------|
| admin | HR Admin | admin@qanzakglobal.com |
| sarah.johnson | Branch Manager | sarah.johnson@qanzakglobal.com |
| mike.chen | Department Head | mike.chen@qanzakglobal.com |
| john.doe | Employee | john.doe@qanzakglobal.com |
| jane.smith | Employee | jane.smith@qanzakglobal.com |
| alex.rivera | Employee | alex.rivera@qanzakglobal.com |
| emily.wilson | Social Media Manager | emily.wilson@qanzakglobal.com |
| david.brown | Content Creator | david.brown@qanzakglobal.com |

⚠️ **Security Note**: Change these passwords immediately in production!

## Customization

Edit `seed-database.js` to:
- Add more users, projects, or departments
- Modify company information
- Adjust task descriptions and dates
- Add custom data for your specific needs

## Troubleshooting

### Error: "DATABASE_URL must be set"
- Ensure the `DATABASE_URL` environment variable is set before running

### Error: "relation does not exist"
- Run `npm run db:push` to create the database schema first

### Error: "duplicate key value violates unique constraint"
- The database already has data. Either:
  - Clear existing data first, or
  - Modify the seed script to check for existing records

### Error: "column does not exist"
- Your schema might be outdated. Run:
  ```bash
  npm run db:push
  ```

## Re-seeding

To re-seed the database:

```bash
# Option 1: Drop and recreate tables
psql -U your_user -d your_db -f reset-database.sql
npm run db:push
node seed-database.js

# Option 2: Manually delete data from tables
# Then run: node seed-database.js
```

## Support

For issues or questions:
1. Check the error message carefully
2. Verify DATABASE_URL is correct
3. Ensure all dependencies are installed (`npm install`)
4. Check that PostgreSQL is running
