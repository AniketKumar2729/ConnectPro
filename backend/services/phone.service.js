//twilloservice.js
import twillo from 'twilio';

//Twillo Creaditials  from env
const accountSid=process.env.TwilioAccountSid;
const authToken=process.env.TwilioAuthToken;
const serviceSid=process.env.TwilioServiceId;

if (!accountSid || !authToken || !serviceSid) {
  throw new Error('Twilio environment variables are missing');
}
const client=twillo(accountSid,authToken);

//send otp to phone number

export const sendOtpToPhoneNumber=async(phoneNumber)=>{
    try {
        console.log(`sending otp to ${phoneNumber}`);
        if(!phoneNumber) 
            throw new Error('Phone number is required');
        const response= await client
      .verify
      .services(serviceSid)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms'
      });
        console.log('this is my otp response ',response);
        return response;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to send otp');
    }
}


export const verifyOtp=async(phoneNumber,otp)=>{
    try {
        const response=await client.verify.services(serviceSid).verificationChecks.create({
            to:phoneNumber,
            code:otp
        })
        console.log('this is my otp response ',response);
        return response;
    } catch (error) {
        console.error(error);
        throw new Error('OTP Verification failed');
    }
}