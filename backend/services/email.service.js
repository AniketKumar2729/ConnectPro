import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service:'gmail',
  auth: {
    user: process.env.Email_User,
    pass: process.env.Email_Pass,
  },
});

transporter.verify((error,success)=>{
    if(error)
        console.error("Gmail services connection failed");
    console.log('Gmail config successfull');
});

export const sendOtpEmail=async(email,otp)=>{
      const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 Connect Pro Verification</h2>
      
      <p>Hi there,</p>
      
      <p>Your one-time password (OTP) to verify your Connect Pro  account is:</p>
      
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>

      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>

      <p>If you didn’t request this OTP, please ignore this email.</p>

      <p style="margin-top: 20px;">Thanks & Regards,<br/>Connect Pro Security Team</p>

      <hr style="margin: 30px 0;" />

      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;
  await transporter.sendMail({
    from:`Connect Pro Team`,
    to:email,
    subject:'Your Connect Pro Verification Code',
    html
  })
}