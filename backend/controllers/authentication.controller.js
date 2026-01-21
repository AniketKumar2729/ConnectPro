import { uploadFileToCloudinary } from "../config/cloudinary.config.js";
import User from "../models/user.models.js";
import { sendOtpEmail } from "../services/email.service.js";
import { sendOtpToPhoneNumber, verifyOtp } from "../services/phone.service.js";
import { generateToken } from "../utils/generateToken.utils.js";
import { otpGenerate } from "../utils/otpGenerator.utils.js";
import { response } from "../utils/responseHandler.utils.js";

// send OTP
export const sendOTP = async (req, res) => {
  const { phoneNumber, countryCode, email } = req.body;
  const otp = otpGenerate();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  let user;
  try {
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        user = new User({ email });
      }
      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;
      await user.save();
      await sendOtpEmail(email, otp);
      return response(res, 200, "OTP send to your email", { email });
    }
    if (!phoneNumber || !countryCode)
      return response(res, 400, "Phone Number and Country Code required");
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    user = await User.findOne({ phoneNumber });
    if (!user) {
      user = await new User({ phoneNumber, countryCode });
    }
    await user.save();
    await sendOtpToPhoneNumber(fullPhoneNumber);
    return response(res, 200, "OTP send successfully", user);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// verification OTP

export const verifyOTP = async (req, res) => {
  const { phoneNumber, countryCode, email, otp } = req.body;
  try {
    let user;
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        return response(res, 404, "User not found");
      }
      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "Invalid or Expired OTP");
      }
      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    } else {
      if (!phoneNumber || !countryCode)
        return response(res, 400, "Phone Number and Country Code required");
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      user = await User.findOne({ phoneNumber });

      if (!user) {
        return response(res, 404, "User not found");
      }
      const result = await verifyOtp(fullPhoneNumber, otp);
      if (result.status !== "approved")
        return response(res, 400, "Invalid Otp");
      user.isVerified = true;
      await user.save();
    }
    const token = generateToken(user?._id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return response(res, 200, "OTP verified successfully", { token, user });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

//Profile update

export const updateProfile = async (req, res) => {
  const { username, agreed, about } = req.body;
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    const file = req.file;
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      console.log(uploadResult);
      user.profilePicture = uploadResult?.secure_url;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }
    if (username) user.username = username;
    if (agreed) user.agreed = agreed;
    if (about) user.about = about;
    await user.save();
    return response(res, 200, "user profile updated successfully", user);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
