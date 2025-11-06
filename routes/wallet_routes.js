
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
// const Transaction = require('../models/Transaction');
// const WithdrawRequest = require('../models/WithdrawRequest');
 const Transaction = require("../models/Transection")
 const WithdrawRequest = require("../models/widhdrawRequest")
router.get('/balance', auth, async (req, res) => {
    const u = await User.findById(req.user);
    res.json({ balance: u.walletBalance });
});

router.get('/profile', auth, async (req, res) => {
    const u = await User.findById(req.user);
    u.password = undefined;
    res.json({user :u, balance:u.walletBalance});
});


// Mock deposit (use real gateway in prod)
router.post('/deposit', auth, async (req, res) => {
    const { amount } = req.body;
    const u = await User.findById(req.user);
    u.walletBalance += Number(amount);
    await u.save();
    await Transaction.create({ userId: u._id, amount, type: 'deposit' });
    res.json({ ok: true, balance: u.walletBalance });
});

router.post('/withdraw', auth, async (req, res) => {
    const { amount, upi } = req.body;
    const u = await User.findById(req.user);
    if (u.walletBalance < amount) return res.status(400).json({ msg: 'Insufficient' });
    u.walletBalance -= Number(amount);
    await u.save();
    await WithdrawRequest.create({ userId: u._id, amount, upi });
    await Transaction.create({ userId: u._id, amount, type: 'withdraw', status: 'pending' });
    res.json({ ok: true, balance: u.walletBalance });
});

module.exports = router;

/* const router = require("express").Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");

// check balance
router.get("/balance", auth, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ wallet: user.wallet });
});

// deposit add money
router.post("/deposit", auth, async (req, res) => {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);
    user.wallet += Number(amount);
    await user.save();

    await Transaction.create({ userId: req.user.id, amount, type: "deposit" });

    res.json({ msg: "Added", wallet: user.wallet });
});

module.exports = router;
 */