import nodemailer from 'nodemailer';

// Lazy-initialize transporter to ensure .env is loaded
let transporter = null;

function getTransporter() {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log('Initializing email transporter with:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 5)}...` : 'undefined',
    });

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: false, // true for 465, false for other ports like 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
}

export const sendOtpEmail = async (email, otp) => {
  try {
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
            <p style="color: #666; margin-bottom: 20px;">Enter this OTP to reset your password. This OTP is valid for 10 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    console.log(`✓ OTP email sent to ${email}: ${info.response}`);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`✗ Error sending OTP email to ${email}: ${error.message}`);
    throw new Error('Failed to send OTP email');
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
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
    // eslint-disable-next-line no-console
    console.log(`✓ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`✗ Error sending welcome email to ${email}: ${error.message}`);
    // Don't throw here, as welcome email failure shouldn't block registration
    return false;
  }
};
