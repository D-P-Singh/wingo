// routes/otpRoutes.js
const express = require("express");
const router = express.Router();
const otpStore = new Map();

router.post("/send", (req, res) => {
    const { type, value } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore.set(value, otp);
    console.log(`OTP for ${type}: ${otp}`);
    res.json({ success: true, message: `${type} OTP sent` });
});

router.post("/verify", (req, res) => {
    const { type, value, otp } = req.body;
    const validOtp = otpStore.get(value);
    if (validOtp && Number(otp) === validOtp) {
        otpStore.delete(value);
        res.json({ success: true });
    } else res.json({ success: false });
});

module.exports = router;
