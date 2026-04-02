import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST() {
  try {
    const testData = {
      username: 'testviewer',
      email: 'test@example.com',
      password: 'TestPassword123!',
      createdBy: 'admin_lgu',
      viewerPortalLink: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };

    const emailSent = await emailService.sendViewerCreationEmail(testData);

    if (emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send test email' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const connectionTest = await emailService.testConnection();
    
    return NextResponse.json({ 
      success: connectionTest,
      message: connectionTest ? 'Email service connection successful' : 'Email service connection failed'
    });
  } catch (error: any) {
    console.error('Email connection test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
