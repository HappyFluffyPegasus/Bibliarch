# Bibliarch Setup Guide

This guide will help you set up Bibliarch locally and fix any issues you encounter.

## Quick Setup

### 1. Environment Setup
Make sure you have your `.env.local` file with the following variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key  # Optional for MVP
```

### 2. Database Setup
**CRITICAL**: You must run the database setup script in your Supabase dashboard before using the app.

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `database-setup.sql` 
4. Run it in the SQL Editor
5. Verify that the tables were created successfully

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

## Troubleshooting Common Issues

### "Jest worker encountered 2 child process exceptions"

This error typically occurs because of one of these issues:

#### Solution 1: Database Not Set Up
- **Symptom**: Error when creating new projects or accessing existing ones
- **Fix**: Run the `database-setup.sql` script in your Supabase dashboard (see step 2 above)

#### Solution 2: Environment Variables Missing
- **Symptom**: Can't connect to database
- **Fix**: Check your `.env.local` file has all required variables

#### Solution 3: Konva Build Issues
- **Symptom**: Build errors or worker exceptions during canvas loading
- **Fix**: The app is already configured to use HTML canvas fallback to avoid this issue

#### Solution 4: Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### "Unable to access pre-existing projects"

This usually means:

1. **Database tables don't exist**: Run `database-setup.sql`
2. **User not authenticated**: Check if you can log in
3. **Database permissions**: Verify Row Level Security policies are working

### Testing the Fix

1. **Create Account**: Go to `/login` and create a new account
2. **Create Project**: Try creating a new story with any template
3. **Add Nodes**: Test adding different node types (text, character, etc.)
4. **Navigation**: Try double-clicking folder nodes to navigate
5. **Save/Load**: Verify your changes are saved when you refresh

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linting
```

## Architecture Notes

- **Canvas**: Uses HTML/DOM-based canvas (HTMLCanvas.tsx) to avoid Jest worker issues with Konva
- **Database**: PostgreSQL with Supabase for auth and data storage
- **Templates**: Pre-built story structures to help users get started
- **Real-time**: Auto-save functionality to prevent data loss

## Getting Help

If you're still experiencing issues:

1. Check the browser console for error messages
2. Verify your Supabase connection in the Network tab
3. Make sure all required environment variables are set
4. Try creating a completely new Supabase project if database issues persist

The application should work smoothly once the database is properly set up!