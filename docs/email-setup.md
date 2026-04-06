# Email Setup for GeoLokal

This document explains how to configure email functionality for viewer account creation notifications.

## Overview

When an LGU user creates a viewer account, the system automatically sends an email to the viewer containing:
- Username and email
- Password (if provided during creation)
- Creator details
- Link to the viewer portal

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# SMTP Server Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# SMTP Authentication
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
SMTP_FROM_EMAIL=noreply@geolokal.com

# Application URL (used in email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Email Provider Setup

#### Gmail (Recommended for Development)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

#### Other SMTP Providers

Configure the following variables based on your provider:

| Provider | SMTP_HOST | SMTP_PORT | SMTP_SECURE |
|----------|-----------|-----------|-------------|
| Outlook | smtp-mail.outlook.com | 587 | false |
| Yahoo | smtp.mail.yahoo.com | 587 | false |
| SendGrid | smtp.sendgrid.net | 587 | false |

### 3. Testing Email Configuration

You can test the email configuration by:

1. Creating a test viewer account through the API
2. Checking the server logs for email status
3. Verifying the email is received

## Email Template

The email template includes:
- Professional HTML design with GeoLokal branding
- Account credentials display
- Security notice about password protection
- Direct link to viewer portal
- Contact information for support

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SMTP credentials in environment variables
   - Verify firewall allows SMTP traffic
   - Check server logs for error messages

2. **Authentication failed**
   - Ensure app password is used (not regular password) for Gmail
   - Verify 2-factor authentication is enabled
   - Check SMTP user email is correct

3. **Email going to spam**
   - Set up SPF/DKIM records for your domain
   - Use a professional email address as sender
   - Avoid using generic SMTP providers in production

### Debug Mode

Enable debug logging by checking the server console for:
- "Email sent successfully" messages
- "Failed to send email" warnings
- Detailed error messages

## Security Considerations

- Store SMTP credentials securely in environment variables
- Use app passwords instead of main account passwords
- Consider using transactional email services for production
- Monitor email sending logs for unusual activity

## Production Recommendations

For production deployment, consider using:
- SendGrid
- Mailgun
- AWS SES
- Postmark

These services provide better deliverability, analytics, and scalability compared to standard SMTP.
