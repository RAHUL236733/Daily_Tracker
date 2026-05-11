import nodemailer from 'nodemailer';

// Lazy-initialize transporter to ensure .env is loaded
let transporter = null;
let initError = null;

function getTransporter() {
  if (transporter) return transporter;
  if (initError) throw initError;

  try {
    const emailHost = process.env.EMAIL_HOST?.trim();
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPassword = process.env.EMAIL_PASSWORD?.trim();

    // Validate required configuration
    if (!emailHost || !emailUser || !emailPassword) {
      const missingVars = [];
      if (!emailHost) missingVars.push('EMAIL_HOST');
      if (!emailUser) missingVars.push('EMAIL_USER');
      if (!emailPassword) missingVars.push('EMAIL_PASSWORD');

      const errorMsg = `Missing required email configuration: ${missingVars.join(', ')}`;
      console.error('✗ Email configuration error:', errorMsg);
      initError = new Error(errorMsg);
      throw initError;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Initializing email transporter with:', {
        host: emailHost,
        port: emailPort,
        user: emailUser.substring(0, 5) + '...',
        secure: emailPort === 465,
      });
    }

    transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for 587 and other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      logger: process.env.NODE_ENV !== 'production',
      debug: process.env.NODE_ENV !== 'production',
    });

    // Verify connection configuration
    transporter.verify((err, success) => {
      if (err) {
        console.error('✗ SMTP connection error:', err.message);
      } else if (success) {
        console.log('✓ Email transporter verified and ready');
      }
    });

    return transporter;
  } catch (error) {
    console.error('✗ Failed to initialize email transporter:', error.message);
    initError = error;
    throw error;
  }
}

export const sendOtpEmail = async (email, otp) => {
  try {
    if (!email || !otp) {
      throw new Error('Email and OTP are required');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Daily Habit Tracker - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #666; margin-bottom: 20px;">You requested a password reset for your Daily Habit Tracker account.</p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h3 style="color: #333; letter-spacing: 2px; font-size: 24px; margin: 0;">${otp}</h3>
            </div>
            <p style="color: #666; margin-bottom: 20px;">Enter this OTP to reset your password. This OTP is valid for 5 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail(mailOptions);

    console.log(`✓ OTP email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`✗ Error sending OTP email to ${email}:`, error.message);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    if (!email || !name) {
      throw new Error('Email and name are required');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Daily Habit Tracker',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to Daily Habit Tracker, ${name}!</h2>
            <p style="color: #666; margin-bottom: 20px;">Your account has been successfully created. Start tracking your habits and building better days!</p>
            <p style="color: #666;">Happy tracking!</p>
          </div>
        </div>
      `,
    };

    const emailTransporter = getTransporter();
    await emailTransporter.sendMail(mailOptions);

    console.log(`✓ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`✗ Error sending welcome email to ${email}:`, error.message);
    // Don't throw here, as welcome email failure shouldn't block registration
    return false;
  }
};
