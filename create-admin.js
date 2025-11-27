import { db } from './server/db.js';
import { users } from './shared/schema.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await db.insert(users).values({
      username: 'admin',
      email: 'admin@meetingmatters.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'hr_admin',
      status: 'active',
      accountEnabled: true,
      hasCrmAccess: true,
      hasJobApplicationsAccess: true,
      organizationId: 'default_meeting_matters_org',
    }).returning();
    
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email:', adminUser[0].email);
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
