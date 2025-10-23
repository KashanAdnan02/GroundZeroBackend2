const nodemailer = require("nodemailer");
const twilio = require("twilio");

const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const { generateVerificationCode } = require("../utils");

const sendEmailVerification = async (email, code, name) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify?code=${code}&type=email`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Ground Zero - Verify Your Account",
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
    `,
  };

  await emailTransporter.sendMail(mailOptions);
};
const sendEmailForAccountCreation = async (
  email,
  password,
  phone,
  name,
  role
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Ground Zero - Account Created",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); overflow: hidden; border: 1px solid #e5e5e5;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #000000; padding: 50px 30px; text-align: center; position: relative;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.5px;">
                      Welcome to Ground Zero
                    </h1>
                    <div style="width: 60px; height: 3px; background-color: #ffffff; margin: 20px auto 0;"></div>
                  </td>
                </tr>
                
                <!-- Main content -->
                <tr>
                  <td style="padding: 50px 40px;">
                    <p style="margin: 0 0 24px; color: #1a1a1a; font-size: 17px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                      Hi <strong style="color: #000000;">${name}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 32px; color: #4a4a4a; font-size: 15px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                      Your account has been created by an admin for the <strong style="color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">${role}</strong> role. You're all set to access your dashboard!
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="margin: 36px 0;">
                      <tr>
                        <td align="center">
                          <a href="${process.env.FRONTEND_URL}/login?${
      email ? "email" : "phone"
    }=${email ? email : phone}&password=${password}" 
                             style="display: inline-block; padding: 18px 48px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.3px; transition: all 0.3s; border: 2px solid #000000;">
                            Access Your Account
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Info box -->
                    <div style="background-color: #f8f8f8; border-left: 4px solid #000000; padding: 20px 24px; margin: 36px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                        <strong style="color: #000000;">Security Note:</strong> If you didn't request this account, please ignore this email or contact our support team immediately.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #000000; padding: 40px 30px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #ffffff; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 1px;">
                      GROUND ZERO
                    </p>
                    <p style="margin: 0; color: #a0a0a0; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.5px;">
                      Sports Booking Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await emailTransporter.sendMail(mailOptions);
};

const sendSMSVerification = async (phone, code, name) => {
  const message = `Hi ${name}, your Ground Zero verification code is: ${code}. This code expires in 15 minutes. If you didn't request this, please ignore.`;

  await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: phone,
  });
};

module.exports = {
  generateVerificationCode,
  sendEmailVerification,
  sendEmailForAccountCreation,
  sendSMSVerification,
};
