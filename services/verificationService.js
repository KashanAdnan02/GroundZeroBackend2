const nodemailer = require('nodemailer');
const twilio = require('twilio');

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const { generateVerificationCode } = require('../utils');

const sendEmailVerification = async (email, code, name) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify?code=${code}&type=email`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Ground Zero - Verify Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Ground Zero!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for creating an account with Ground Zero. To activate your account, please verify your email address.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Account</a>
        </div>
        <p>Or use this verification code: <strong>${code}</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't create this account, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">Ground Zero Sports Booking Platform</p>
      </div>
    `
  };

  await emailTransporter.sendMail(mailOptions);
};
const sendEmailForAccountCreation = async (email, password, phone, name, role) => {  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Ground Zero - Account Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Ground Zero!</h2>
        <p>Hi ${name},</p>
        <p>your account has been created by admin for ${role} role</p>
        <p>This is your account email : ${phone || email}</p>
        <p>and password: ${password}</p>
        <p>If you aren't create this account, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">Ground Zero Sports Booking Platform</p>
      </div>
    `
  };

  await emailTransporter.sendMail(mailOptions);
};

const sendSMSVerification = async (phone, code, name) => {
  const message = `Hi ${name}, your Ground Zero verification code is: ${code}. This code expires in 15 minutes. If you didn't request this, please ignore.`;
  
  await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: phone
  });
};

module.exports = {
  generateVerificationCode,
  sendEmailVerification,
  sendEmailForAccountCreation,
  sendSMSVerification
};