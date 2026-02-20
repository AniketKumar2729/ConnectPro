import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import countries from '../../utils/countries.js';
import useLoginStore from '../../store/useLoginStore.js';
import useUserStore from '../../store/useUserStore.js';
import { avatars } from '../../utils/FormatTime.js';
import { useForm } from 'react-hook-form';
import useThemeStore from '../../store/themeStore.js';
import { motion } from "framer-motion";
import { RiWechatChannelsLine } from "react-icons/ri";
import { MdArrowBackIos } from "react-icons/md";
import { IoMdAddCircleOutline } from "react-icons/io";
import { RiUser3Fill } from "react-icons/ri";
import { sendOTP, updateUserProfile, verifyOTP } from '../../services/user.service.js';
import { toast } from 'react-toastify';

//validation schema
const loginValidSchema = yup.object().shape({
  phoneNumber: yup
    .string()
    .nullable()
    .notRequired()
    .matches(/^\d+$/, "Phone number must contain only digits")
    .transform((value, originalValue) => (originalValue.trim() === "" ? null : value)),
  email: yup
    .string()
    .nullable()
    .notRequired()
    .email("Please enter a valid email")
    .transform((value, originalValue) => (originalValue.trim() === "" ? null : value)),
}).test(
  "at-least-one",
  "Either email or phone number is required",
  function (value) {
    return !!(value.phoneNumber || value.email);
  }
);

const otpValidSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "OTP must be 6 digits")
    .required("OTP is required"),
});

const profileValidSchema = yup.object().shape({
  username: yup.string().required("Username is required"),
  agreed: yup
    .bool()
    .oneOf([true], "You must agree to the terms and conditions"),
});


const Login = () => {
  const { step, userPhoneData, setStep, setUserPhoneData, resetLoginState } = useLoginStore();
  // const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, SetOtp] = useState(["", "", "", "", "", ""]);
  // const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[1]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();

  const { register: loginRegister, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm({ resolver: yupResolver(loginValidSchema) })
  const { handleSubmit: handleOtpSubmit, formState: { errors: otpErrors }, setValue: setOtpvalue } = useForm({ resolver: yupResolver(otpValidSchema) })
  const { register: profileRegister, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, watch } = useForm({ resolver: yupResolver(profileValidSchema) })

  const ProgressBar = () => (
    <progress className="progress progress-primary w-full h-3 sm:h-4 md:h-5" value={step} max="3">Aniket</progress>
  )

  const handleCountryChange = (e) => {
    const country = countries.find((c) => c.dialCode === e.target.value);
    setSelectedCountry(country);
  };

  // const handlePhoneNumberChange = (e) => {
  //   // Allow only numbers and limit to 10 digits
  //   const value = e.target.value.replace(/\D/g, "").slice(0, 10);
  //   setPhoneNumber(value);
  // };

  const onLoginSubmit = async (data) => {
    try {
      setLoading(true);
      const { phoneNumber, email } = data;
      if (email) {
        const response = await sendOTP(null, null, email);
        if (response?.status === 'success') {
          toast.info("OTP send successfully to your email");
          setUserPhoneData({ email });
          setStep(2);
        }
      }
      else if (phoneNumber) {
        console.log("country Code entered " + selectedCountry.dialCode);
        console.log("Phone number entered " + phoneNumber);
        const response = await sendOTP(phoneNumber, selectedCountry.dialCode, null);
        if (response?.status === 'success') {
          toast.info("OTP send successfully to your phone number");
          setUserPhoneData({ phoneNumber, countryCode: selectedCountry.dialCode });
          setStep(2);
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to send OTP");
    }
    finally {
      setLoading(false);
    }
  }

  const onOtpSubmit = async () => {
    try {
      setLoading(true);
      if (!userPhoneData) {
        throw new Error("Phone Number or email required");
      }
      const otpString = otp.join("");
      let response;
      if (userPhoneData?.email) {
        response = await verifyOTP(null, null, userPhoneData.email, otpString);
      } else {
        response = await verifyOTP(userPhoneData.phoneNumber, userPhoneData.countryCode, null, otpString);
      }
      if (response.status === 'success') {
        toast.success("OTP verify successfully");
        const user = response.data?.user;
        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome Back to Connect Pro");
          navigate('/');
          resetLoginState();
        } else {
          setStep(3);
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to verify OTP");
    }
    finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file))
    }
  }

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("agreed", data.agreed);
      if (profilePictureFile) {
        formData.append('media', profilePictureFile);
      } else {
        formData.append("profilePicture", selectedAvatar);
      }
      await updateUserProfile(formData);
      toast.success("Welcome Back to Connected Pro!");
      navigate('/');
      resetLoginState();
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to update user profile");
    }
    finally {
      setLoading(false);
    }
  }

  const handleOtpChange = (index, value) => {
    const newOtp = [ ...otp ];
    newOtp[index] = value;
    SetOtp(newOtp);
    setOtpvalue("otp", newOtp.join(""));
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  }

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    SetOtp(["", "", "", "", "", ""]);
    setError("");
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 ${theme === "dark"
        ? "bg-gradient-to-br from-zinc-900 via-zinc-800 to-black"
        : "bg-gradient-to-br from-green-500 via-emerald-500 to-blue-500"
        }`}
    >
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md rounded-2xl p-8 space-y-6 shadow-2xl border ${theme === "dark"
          ? "bg-linear-to-br from-zinc-800/80 to-zinc-900/80 border-zinc-700 backdrop-blur-md"
          : "bg-white/20 border-white/30 backdrop-blur-md"
          }`}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center shadow-xl"
        >
          <RiWechatChannelsLine className="w-12 h-12 text-white" />
        </motion.div>

        {/* Heading */}
        <h2
          className={`text-center text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
            }`}
        >
          Login to Connect Pro
        </h2>

        {/* Progress Bar */}
        <ProgressBar />

        {error && <p className='text-red-500 text-center mb-4'>{error}</p>}

        {/* Step 1 - Phone Input */}
        {step === 1 && (
          <>
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} >
              <p className={`text-center ${theme === 'dark' ? "text-gray-100" : "text-black font-semibold"} mb-4`}>Enter your Phone Number to receive an OTP</p>

              {/* phone number */}
              <div className="flex w-full overflow-hidden rounded-xl border border-gray-300 dark:border-zinc-600 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200">
                <select
                  className="w-24 bg-white/30 dark:bg-zinc-700/60 px-2 text-sm outline-none"
                  value={selectedCountry.dialCode}
                  onChange={handleCountryChange}
                >
                  {countries.map((country) => (
                    <option
                      key={`${country.dialCode}-${country.alpha2}`}
                      value={country.dialCode}
                    >
                      {country.alpha2} {country.dialCode}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  {...loginRegister("phoneNumber")}
                  placeholder="Enter phone number"
                  className={`flex-1 px-4 py-3 text-sm outline-none ${loginErrors.phoneNumber ? "border-red-500" : ""}`}
                />
              </div>
              {loginErrors.phoneNumber && <p className='text-red-500 mb-4'>{loginErrors.phoneNumber.message}</p>}

              <div className="flex w-full flex-col">
                <div className="divider">Or</div>
              </div>

              {/* email input box */}

              <fieldset className="fieldset mb-2">
                <legend className="fieldset-legend">Email</legend>
                <input type="text" {...loginRegister("email")} className={`input w-full  bg-transparent ${theme === 'dark' ? 'text-white' : 'bg-black'}`} placeholder="Enter your email (Optional)" />
              </fieldset>
              {loginErrors.email && <p className='text-red-500 mb-4'>{loginErrors.email.message}</p>}

              <button className='btn btn-dash w-full' type='submit' >{loading ? <span className="loading loading-spinner"></span> : "Send OTP"}</button>
            </form>
          </>
        )}

        {/* otp verification */}
        {step === 2 && (
          <>
            <form onSubmit={handleOtpSubmit(onOtpSubmit)} className='space-y-4'>
              <div className="text-center space-y-2">
                <h2
                  className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                >
                  Verify OTP
                </h2>
                <p
                  className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Please enter the 6-digit OTP sent to{" "}
                  {userPhoneData?.phoneNumber
                    ? `+${userPhoneData.countryCode}-${userPhoneData.phoneNumber}`
                    : userPhoneData?.email || "your registered contact"}
                </p>
              </div>

              <div className="flex justify-between gap-3 pt-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className={`w-12 h-14 text-center text-lg font-semibold rounded-xl border transition-all duration-200 outline-none
          ${theme === "dark"
                        ? "bg-zinc-700/60 border-zinc-600 text-white focus:ring-2 focus:ring-blue-500"
                        : "bg-white/40 border-white/50 text-gray-900 focus:ring-2 focus:ring-blue-500"
                      }`}
                  />
                ))}


              </div>
              {otpErrors.otp && (<>
                <p className='text-red-500 text-sm'>{otpErrors.otp.message}</p>
              </>)}
              {loading ? <button className="btn btn-square w-full" onClick={() => setLoading((prev) => !prev)}>
                <span className="loading loading-spinner"></span>
              </button> : <button type="submit" className="btn btn-dash w-full mt-6 py-3 rounded-xl font-semibold  text-white shadow-lg hover:scale-[1.02] transition-transform duration-200" onClick={() => setLoading((prev) => !prev)}>Verify Otp</button>}
              <button
                type="button"
                onClick={handleBack}
                className={`w-full mt-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200
  ${theme === "dark"
                    ? "bg-zinc-700/50 text-gray-300 hover:bg-zinc-600/60 border border-zinc-600"
                    : "bg-white/30 text-gray-800 hover:bg-white/50 border border-white/40"
                  } backdrop-blur-md`}
              >
                <MdArrowBackIos className="text-xs" />
                Wrong Number ? Go Back
              </button>
            </form>
          </>
        )}

        {step == 3 && (<>
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-6 w-full"
          >
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">

              {/* Main Avatar */}
              <div className="relative group">
                <img
                  src={profilePicture || selectedAvatar}
                  alt="profile"
                  className="w-24 h-24 rounded-full object-cover shadow-xl border-4 border-white/30"
                />

                <label
                  htmlFor="profile-picture"
                  className="absolute bottom-0 right-0 bg-linear-to-br from-blue-500 to-indigo-600 
                   text-white rounded-full p-2 cursor-pointer 
                   shadow-lg hover:scale-110 transition-all duration-200"
                >
                  <IoMdAddCircleOutline className="w-4 h-4" />
                </label>

                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <p className="text-sm text-gray-300">
                Choose an avatar
              </p>

              {/* Avatar Row */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {avatars.map((avatar, index) => {
                  const isSelected = selectedAvatar === avatar;

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`avatar cursor-pointer transition-all duration-200 
              ${isSelected
                          ? "scale-95 "
                          : "hover:scale-110 opacity-80 hover:opacity-100"
                        }`}
                    >
                      <div className="w-16 rounded-full">
                        <img src={avatar} alt={`avatar-${index}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Username Field */}
            <div className='relative'>
              <RiUser3Fill className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
              <input type="text" placeholder='Username' {...profileRegister("username", "Username is required!")} className={`w-full pl-10 pr-3 border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black"} rounded-md focus:outline-none text-lg `} />
              {profileErrors.username && (<p className='text-red-500 text-sm mt-1'>{profileErrors.username.message}</p>)}
            </div>


            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <input
                  {...profileRegister("agreed")}
                  type="checkbox"
                  className="checkbox checkbox-info"
                  id="terms"
                />
                <label
                  htmlFor="terms"
                  className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                >
                  I agree to the{" "}
                  <a href="#" className="underline hover:text-blue-500">
                    Terms & Conditions
                  </a>
                </label>
              </div>

              {profileErrors.agreed && (
                <p className="text-red-500 text-xs ml-6">
                  {profileErrors.agreed.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!watch("agreed") || loading}
              className="btn btn-dash w-full py-3 rounded-xl font-semibold text-white shadow-lg hover:scale-[1.02] transition-transform duration-200"
            >
              Create Profile
            </button>
          </form>

        </>)}
      </motion.div>
    </div>
  )
}

export default Login
