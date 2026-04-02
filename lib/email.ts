import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface ViewerCreationEmailData {
  username: string;
  email: string;
  password: string;
  createdBy: string;
  viewerPortalLink: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    if (config.auth.user && config.auth.pass) {
      this.transporter = nodemailer.createTransport(config);
    } else {
      console.warn('Email configuration not found. Email functionality will be disabled.');
    }
  }

  private generateViewerCreationEmail(data: ViewerCreationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your GeoLokal Viewer Account</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .credential-box {
            background-color: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-item {
            margin: 10px 0;
            padding: 10px;
            background-color: #f1f3f4;
            border-radius: 4px;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to GeoLokal</h1>
          <p>Your Viewer Account Has Been Created</p>
        </div>
        
        <div class="content">
          <p>Hello <strong>${data.username}</strong>,</p>
          
          <p>A viewer account has been created for you by <strong>${data.createdBy}</strong> on the GeoLokal platform.</p>
          
          <p>GeoLokal is a comprehensive geographic information system that allows you to view and interact with various spatial data and maps.</p>
          
          <div class="credential-box">
            <h3>Your Account Credentials</h3>
            <div class="credential-item">
              <strong>Username:</strong> ${data.username}
            </div>
            <div class="credential-item">
              <strong>Email:</strong> ${data.email}
            </div>
            <div class="credential-item">
              <strong>Password:</strong> ${data.password}
            </div>
          </div>
          
          <p><strong>Important:</strong> Please keep your credentials secure and do not share them with others.</p>
          
          <a href="${data.viewerPortalLink}" class="btn">Access GeoLokal Viewer Portal</a>
          
          <p>If you have any questions or need assistance, please contact your system administrator.</p>
          
          <p>Best regards,<br>
          The GeoLokal Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2026 GeoLokal. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  async sendViewerCreationEmail(data: ViewerCreationEmailData): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL || 'noreply@geolokal.com',
        to: data.email,
        subject: `Your GeoLokal Viewer Account - ${data.username}`,
        html: this.generateViewerCreationEmail(data)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email server connection verified');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export type { ViewerCreationEmailData };
