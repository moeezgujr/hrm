# Windows-Compatible Scripts for Local Development

Replace the "scripts" section in your local package.json with these cross-platform compatible scripts:

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "cross-env NODE_ENV=production vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "cross-env NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push",
    "dev:windows": "cross-env NODE_ENV=development PORT=5000 tsx server/index.ts",
    "build:windows": "cross-env NODE_ENV=production vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

## Setup Instructions for Windows:

1. **Install Node.js** (if not already installed):
   - Download from https://nodejs.org/
   - Use version 18 or higher

2. **Clone/Download the project** to your local machine

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Install cross-env** (for Windows compatibility):
   ```bash
   npm install cross-env
   ```

5. **Setup environment variables**:
   - Copy `.env.example` to `.env`
   - Update the variables with your local values:
     ```env
     DATABASE_URL=your_postgresql_connection_string
     SESSION_SECRET=your_session_secret_key
     PORT=5000
     NODE_ENV=development
     ```

6. **Setup PostgreSQL Database**:
   - Install PostgreSQL locally or use a cloud service like Neon
   - Update DATABASE_URL in your .env file
   - Run database migrations: `npm run db:push`

7. **Run the application**:
   ```bash
   npm run dev
   # or for explicit Windows compatibility:
   npm run dev:windows
   ```

## Key Changes Made:

- ✅ Added `cross-env` dependency for Windows environment variable compatibility
- ✅ Updated all scripts to use `cross-env` prefix
- ✅ Added specific Windows-focused scripts (`dev:windows`, `build:windows`)
- ✅ Maintained all existing functionality

## Notes:

- The app will run on `http://localhost:5000`
- Make sure your PostgreSQL database is running
- Authentication uses Replit Auth by default - you may need to modify this for local development
- All dependencies are already optimized and cleaned up (81 packages total)

## Troubleshooting:

- If you get permission errors, try running your terminal as administrator
- If port 5000 is busy, change the PORT in your .env file
- For database connection issues, verify your DATABASE_URL format