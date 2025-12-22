# StoryCanvas - Interactive Story Visualization Tool

A school project that helps writers visualize and organize their stories through an interactive canvas interface. Create character connections, plot points, and story elements in a visual format.

## Prerequisites

Before you begin, make sure you have these installed on your computer:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- A **Supabase** account (free) - [Sign up here](https://supabase.com/)
- A code editor like **VS Code** - [Download here](https://code.visualstudio.com/)

## Getting Started

### Step 1: Clone the Project

Open your terminal (Command Prompt on Windows, Terminal on Mac/Linux) and run:

```bash
git clone <your-repository-url>
cd stella/storycanvas
```

### Step 2: Install Dependencies

Install all the required packages by running:

```bash
npm install
```

This will take a minute or two to download everything the project needs.

### Step 3: Set Up Supabase Database

1. **Create a Supabase Project:**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Choose a name for your project (like "storycanvas")
   - Choose a strong password (save this somewhere safe!)
   - Select the region closest to you
   - Click "Create new project" and wait for it to set up (takes about 2 minutes)

2. **Configure Authentication Settings:**
   - In your Supabase dashboard, go to **Authentication** (icon looks like a shield)
   - Click on **Providers** → **Email**
   - Turn OFF these settings:
     - ✗ Confirm email
     - ✗ Secure email change
     - ✗ Secure password change
   - Click **Save**

3. **Set Up Your Database Tables:**
   - In your Supabase dashboard, click on **SQL Editor** (icon looks like brackets <>)
   - Click "New query"
   - Copy ALL the content from the file `supabase-schema.sql` in your project
   - Paste it into the SQL editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - You should see "Success. No rows returned" - that's good!

4. **Run Additional Setup:**
   - Still in the SQL Editor, click "New query" again
   - Copy and paste this code:
   ```sql
   ALTER TABLE auth.users 
   ALTER COLUMN email_confirmed_at 
   SET DEFAULT now();

   UPDATE auth.users 
   SET email_confirmed_at = now() 
   WHERE email_confirmed_at IS NULL;
   ```
   - Click "Run"

5. **Configure URL Settings:**
   - Go to **Authentication** → **URL Configuration**
   - In the "Redirect URLs" section, add:
     - `http://localhost:3000`
   - Click "Save"

### Step 4: Set Up Environment Variables

1. **Get your Supabase credentials:**
   - In your Supabase dashboard, click on **Settings** (gear icon)
   - Click on **API**
   - You'll see two important things here:
     - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
     - **anon public** key (a long string of random characters)

2. **Create your environment file:**
   - In your project folder (`stella/storycanvas`), create a new file called `.env.local`
   - Copy and paste this template into the file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```
   - Replace `your_project_url_here` with your Project URL
   - Replace `your_anon_key_here` with your anon public key
   - Save the file

   **Example of what it should look like:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 5: Run the Project

Now you're ready to start the development server:

```bash
npm run dev
```

Open your web browser and go to: [http://localhost:3000](http://localhost:3000)

You should see the StoryCanvas homepage!

## Creating Your First Account

1. Click on "Sign Up" on the homepage
2. Enter:
   - Any email (doesn't need to be real for testing, like `test@test.com`)
   - Any username
   - Any password (at least 6 characters)
3. Click "Sign Up"
4. You'll be automatically logged in and taken to the dashboard

## Common Issues and Solutions

### "Module not found" error
**Solution:** Make sure you ran `npm install` in the `storycanvas` folder, not the parent folder

### "Invalid API key" or Supabase errors
**Solution:** Double-check your `.env.local` file:
- Make sure there are no spaces around the `=` sign
- Make sure you copied the entire key (it's very long!)
- Make sure the file is named exactly `.env.local` (with the dot at the beginning)

### "Port 3000 is already in use"
**Solution:** Either:
- Close other programs using port 3000, or
- Run the project on a different port: `npm run dev -- -p 3001`

### Can't sign up or log in
**Solution:** Make sure you:
1. Disabled email confirmation in Supabase settings
2. Ran the SQL commands in Step 3.4
3. Added `http://localhost:3000` to redirect URLs

### Changes not showing up
**Solution:** Try these in order:
1. Refresh the page (Ctrl/Cmd + R)
2. Clear your browser cache
3. Stop the server (Ctrl + C) and restart with `npm run dev`

## Project Structure

Here's what the main folders contain:
- `src/app/` - The pages of your application
- `src/components/` - Reusable UI components
- `src/lib/` - Helper functions and database connections
- `public/` - Images and static files

## Making Changes

When you make changes to the code:
1. Save the file
2. The browser will automatically refresh with your changes
3. If something breaks, check the terminal for error messages

## Useful Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check for code issues
```

## Need Help?

If you're stuck:
1. Check the error message carefully - it usually tells you what's wrong
2. Make sure all the setup steps were completed
3. Try restarting the development server
4. Check that your Supabase project is running (green dot in dashboard)

## Next Steps

Once everything is running:
1. Explore the existing code to understand how it works
2. Try creating a story canvas and adding some elements
3. Look at the component files to see how the UI is built
4. Check the API routes to understand the backend logic

Good luck with your project! Remember, every developer started as a beginner. Take it one step at a time, and don't be afraid to experiment.