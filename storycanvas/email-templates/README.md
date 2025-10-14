# NeighborNotes Email Templates

Beautiful blue-themed HTML email templates for Supabase authentication.

## Color Palette

These templates use the NeighborNotes blue color scheme:

### Light Mode Colors
- **Primary Blue**: `#0EA5E9` (sky-500) - Main buttons and links
- **Secondary Blue**: `#3B82F6` (blue-600) - Gradients and accents
- **Background**: `#E0F2FE` to `#DBEAFE` (sky-100 to blue-100) - Gradient background
- **Text Dark**: `#1e293b` (slate-800) - Headings
- **Text Medium**: `#475569` (slate-600) - Body text
- **Text Light**: `#64748b` (slate-500) - Secondary text

### Accent Colors
- **Info Box**: `#f0f9ff` background with `#0EA5E9` border (light blue)
- **Warning Box**: `#fef3c7` background with `#f59e0b` border (amber - for expiry notices)

## Templates Included

1. **confirm-signup.html** - Welcome email with account confirmation
2. **reset-password.html** - Password reset email
3. **magic-link.html** - Passwordless login link
4. **change-email.html** - Email change confirmation

## How to Use in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Email Templates**
3. Select the template you want to customize
4. Copy the HTML from the corresponding file
5. Paste it into the Supabase template editor
6. Save the template

## Template Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - The confirmation/action link
- `{{ .Token }}` - The raw token (rarely needed)
- `{{ .TokenHash }}` - Hashed token (rarely needed)
- `{{ .SiteURL }}` - Your site URL from Supabase settings
- `{{ .Email }}` - User's email address

## Features

✅ Responsive design (works on mobile and desktop)
✅ Blue gradient theme matching NeighborNotes
✅ Clear call-to-action buttons
✅ Security notices where appropriate
✅ Professional and friendly tone
✅ Inline CSS for email client compatibility

## Testing

After setting up the templates in Supabase:

1. Test signup flow → check confirm-signup email
2. Test password reset → check reset-password email
3. Check rendering in different email clients (Gmail, Outlook, etc.)

## Notes

- All CSS is inline for maximum email client compatibility
- Gradients may not work in some older email clients (will fall back to solid colors)
- Tables are used for layout (standard practice for HTML emails)
