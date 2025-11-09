const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { email,name, password,phone } = req.body;
    if (!email, !name || !password, !phone) return res.status(400).json({ msg: 'Missing' });
    const exists = await User.findOne({ $or:[{email:email.toLowerCase()},{phone:phone.toLowerCase()}]});

    if (exists) return res.status(400).json({ msg: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email ,name,phone, password: hash });
    res.json({ ok: true, userId: user._id });
});

router.post('/login', async (req,res,next)=>{
    // During login or any request
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim();

    const deviceId = req.headers['user-agent'];
 // or some device fingerprint

    const user = await User.findOne({ phone: req.body.phone });
    user.device = deviceId;
        user.ip = ip;
        user.lastLogin = new Date();
        user.save();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check IP/device block
    if (user.blockedIPs.includes(ip)) return res.status(403).json({ error: 'IP blocked' });
    if (user.blockedDevices.includes(deviceId)) return res.status(403).json({ error: 'Device blocked' });
next();

}, async (req, res) => {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: 'Invalid' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Invalid password' });

    user.ip = req.ip;
    user.device = req.headers['user-agent'];
   // console.log("kk",req.ip, req.headers['user-agent']);

    await user.save();
    const token = jwt.sign({ id: user._id }, "dev");
    res.json({ ok: true, token, userId: user._id, wallet: user.walletBalance });

    const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //
        httpOnly: false,
    }
    // user info
    res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        massage: "user login successfully"
    })
});
const blacklistedTokens = new Set();

router.post("/logout", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) blacklistedTokens.add(token);

    res.clearCookie("authToken", {
       /*  httpOnly: true,
        secure: true,          // set true in production (HTTPS)
        sameSite: "none", */      // for cross-domain frontend
    });
    return res.json({ message: "Logged out successfully" });
});



module.exports.blacklistedTokens = blacklistedTokens;

module.exports = router;


/* const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const exists = await User.findOne({ username });
    if (exists) return res.json({ msg: "User exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ username, password: hash });
    res.json({ msg: "Registered", user });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, userId: user._id, wallet: user.wallet });
});

module.exports = router;
 */