
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
// const Transaction = require('../models/Transaction');
// const WithdrawRequest = require('../models/WithdrawRequest');
const Transaction = require("../models/Transection")
const Withdraw = require("../models/widhdrawRequest");
const Deposit = require('../models/Deposit');
router.get('/balance', auth, async (req, res) => {
    const u = await User.findById(req.user);
    res.json({ balance: u.walletBalance });
});

router.get('/profile', auth, async (req, res) => {
    const u = await User.findById(req.user);
    u.password = undefined;
    res.json({ user: u, balance: u.walletBalance });
});


// Mock deposit (use real gateway in prod)
// router.post("/deposit", auth, async (req, res) => {
//     try {
//         const { amount, paymentMethod, utr } = req.body;
//         if (!amount || !paymentMethod || !utr) {
//             res.status(201).json({ message: "all field menedetory", deposit });
//         }
//         if (amount < 100) {
//             res.status(201).json({ message: "Minimum 100  res deposite", deposit });
//         }
//         // Check if UTR already exists
//         const existingUTR = await Deposit.findOne({ utr });
//         if (existingUTR) return res.status(400).json({ message: "UTR already used" });

//         const deposit = new Deposit({
//             user: req.user,
//             amount,
//             paymentMethod,
//             utr,
//         });

//         await deposit.save();
//         res.status(201).json({ message: "Deposit submitted successfully", deposit });
//     } catch (err) {
//         res.status(500).json({ message: "Server error", error: err.message });
//     }
// });

/* router.post('/deposit', auth, async (req, res) => {
    const { amount } = req.body;
    const u = await User.findById(req.user);
    u.walletBalance += Number(amount);
    await u.save();
    await Transaction.create({ userId: u._id, amount, type: 'deposit' });
    res.json({ ok: true, balance: u.walletBalance });
}); */

// router.post("/withdraw", auth, async (req, res) => {
//     try {
//         const { amount, paymentMethod, accountNumber, ifsc } = req.body;
//         const user = await User.findById(req.user);
//         /* if (amount < 110) {
//             return res.status(400).json({ message: "minimun withdraw 110  balance" });
//         } */
//         if (amount > user.walletBalance)
//             return res.status(400).json({ message: "Insufficient wallet balance" });

//         const withdraw = new Withdraw({
//             user: user._id,
//             amount,
//             paymentMethod,
//             accountNumber,
//             ifsc,
//         });

//         await withdraw.save();
//        return res.status(201).json({ message: "Withdraw request submitted", withdraw,ok:true, balance: user.walletBalance-amount });
//     } catch (err) {
//         res.status(500).json({ message: "Server error", error: err.message });
//     }
// });


router.get("/", async (req, res) => {
    const withdraws = await Withdraw.find().sort({ createdAt: -1 });
    res.json(withdraws);
});

//?// 🏧 Withdraw Route

router.post("/withdraw", auth, async (req, res) => {
    try {
        const { amount, paymentMethod, accountNumber, ifsc } = req.body;
        const user = await User.findById(req.user);

        if (!user) return res.status(404).json({ message: "User not found" });

        if (amount <= 0)
            return res.status(400).json({ message: "Invalid withdraw amount" });

        if (amount > user.walletBalance)
            return res.status(400).json({ message: "Insufficient wallet balance" });

        const walletBefore = user.walletBalance;
        const walletAfter = walletBefore - amount;

        // 💰 Wallet se amount turant minus karein (freeze logic)
        user.walletBalance = walletAfter;
        await user.save();

        // 🧾 Withdraw request create
        const withdraw = new Withdraw({
            user: user._id,
            amount,
            paymentMethod,
            accountNumber,
            ifsc,
            status: "pending",
        });
        await withdraw.save();

        // 💹 Transaction record create
        await Transaction.create({
            userId: user._id,
            type: "withdraw",
            amount,
            status: "pending",
            withdrawId: withdraw._id,
            walletBefore,
            walletAfter,
            meta: {
                paymentMethod,
                remark: "Withdraw request submitted",
            },
        });
        console.log(withdraw);
        res.status(201).json({
            ok: true,
            message: "Withdraw request submitted successfully",
            withdraw,
            balance: walletAfter,
        });
    } catch (err) {
        console.error("Withdraw Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
// 💰 Deposit Route
router.post("/deposit", auth, async (req, res) => {
    console.log("run deposite");
    try {
        const { amount, paymentMethod, utr } = req.body;

        if (!amount || !paymentMethod || !utr)
            return res.status(400).json({ message: "All fields are mandatory" });

        if (amount < 100)
            return res.status(400).json({ message: "Minimum 100 Rs required for deposit" });

        // Check if UTR already exists
        const existingUTR = await Deposit.findOne({ utr });
        if (existingUTR)
            return res.status(400).json({ message: "UTR already used" });

        const user = await User.findById(req.user);
        if (!user) return res.status(404).json({ message: "User not found" });

        const walletBefore = user.walletBalance;
        const walletAfter = walletBefore; // balance not added until admin approval

        // Create deposit request
        const deposit = new Deposit({
            user: req.user,
            amount,
            paymentMethod,
            utr,
            status: "pending",
        });
        await deposit.save();

        // Create transaction entry
        const transaction = await Transaction.create({
            userId: user._id,
            type: "deposit",
            amount,
            status: "pending",
            depositId: deposit._id,
            walletBefore,
            walletAfter,
            meta: {
                paymentMethod,
                utr,
                remark: "Deposit request submitted",
            },
        });

        res.status(201).json({
            message: "Deposit submitted successfully",
            deposit,
            transaction,
        });
    } catch (err) {
        console.error("Deposit Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
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