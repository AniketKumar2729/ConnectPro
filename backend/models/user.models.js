import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, unique: true, sparse: true },
  conutryCode: { type: String, unique: false },
  username: { type: String },
  email: {
    type: String,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9_.-]*$/.test(v); // Allow alphanumeric, underscore, dot, and hyphen
      },
      message: (props) => `${props.value} is not a valid username!`,
    },
  },
  emailOtp: { type: String },
  emailOtpExpiry: { type: Date },
  profilePicture: { type: String },
  about: { type: String },
  lastSeen: { type: Date },
  isOnline: { type: Boolean },
  isVerified:{type:Boolean,default:false},
  agreed:{type:Boolean,default:false}
},{timestamps:true});

const User=mongoose.model('User',userSchema);
export default user;
