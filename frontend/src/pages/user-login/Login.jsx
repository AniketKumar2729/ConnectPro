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
import { TiArrowSortedDown } from "react-icons/ti";

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
    return !!value.phoneNumber || !!value.email;
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, SetOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();

  const { register: loginRegister, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm({ resolver: yupResolver(loginValidSchema) })
  const { handleSubmit: handleOtpSubmit, formState: { errors: otpErrors }, setValue: setOtpvalue } = useForm({ resolver: yupResolver(otpValidSchema) })
  const { register: profileRegister, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, watch } = useForm({ resolver: yupResolver(profileValidSchema) })
  const ProgressBar = () => (
    <progress className="progress progress-accent w-full h-3 sm:h-4 md:h-5" value={step} max="3">Aniket</progress>
  )

   const handleCountryChange = (e) => {
    const country = countries.find((c) => c.dialCode === e.target.value);
    setSelectedCountry(country);
  };

  const handlePhoneNumberChange = (e) => {
    // Allow only numbers and limit to 10 digits
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(value);
  };

  return (
    <div
    className={`min-h-screen flex items-center justify-center px-4 ${
      theme === "dark"
        ? "bg-gradient-to-br from-zinc-900 via-zinc-800 to-black"
        : "bg-gradient-to-br from-green-500 via-emerald-500 to-blue-500"
    }`}
  >
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full max-w-md rounded-2xl p-8 space-y-6 shadow-2xl border ${
        theme === "dark"
          ? "bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border-zinc-700 backdrop-blur-md"
          : "bg-white/20 border-white/30 backdrop-blur-md"
      }`}
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center shadow-xl"
      >
        <RiWechatChannelsLine className="w-12 h-12 text-white" />
      </motion.div>

      {/* Heading */}
      <h2
        className={`text-center text-2xl font-bold ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        Login to Connect Pro
      </h2>

      {/* Progress Bar */}
      <ProgressBar />

      {/* Step 1 - Phone Input */}
      {step === 1 && (
        <div className="flex w-full overflow-hidden rounded-xl border border-gray-300 dark:border-zinc-600 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200">
          
          <select
            className="w-24 bg-white/30 dark:bg-zinc-700/60 px-2 text-sm outline-none"
            value={selectedCountry.dialCode}
            onChange={handleCountryChange}
          >
            {countries.map((country) => (
              <option key={country.dialCode} value={country.dialCode}>
                {country.alpha2} {country.dialCode}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="flex-1 px-4 py-3 bg-transparent outline-none text-sm placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
          />
        </div>
      )}
    </motion.div>
  </div>
  )
}

export default Login
