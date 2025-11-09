const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Bet = require('../models/Bet');
const User = require('../models/User');
const Transaction = require('../models/Transection');
const Round = require('../models/Round');

// router.post('/', auth, async (req, res) => {
//     try {
//         const { roundNumber, type, value, stake } = req.body;
//         const userId = req.user;
//         const user = await User.findById(userId);
//         if (user.walletBalance < stake) return res.status(400).json({ msg: 'Low balance' });
//         user.walletBalance -= Number(stake);
//         await user.save();
//         await Transaction.create({ userId, amount: stake, type: 'bet' });
//         const bet = await Bet.create({ user: userId, roundNumber, type, value, stake });
//         res.json({ ok: true, bet, balance: user.walletBalance });
//     } catch (e) {
//         res.status(500).json({ ok: false, error: e.message });
//     }
// });

router.post("/", auth, async (req, res) => {
    try {
        const { roundNumber, type, value, stake } = req.body;
        const userId = req.user;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "User not found" });

        if (user.walletBalance < stake)
            return res.status(400).json({ msg: "Low balance" });

        const walletBefore = user.walletBalance;
        const walletAfter = walletBefore - Number(stake);

        // 💰 Wallet balance se bet amount minus
        user.walletBalance = walletAfter;
        await user.save();

        // 🎮 Bet create karein
        const bet = await Bet.create({
            user: userId,
            roundNumber,
            type,
            value,
            stake,
            status: "success", // optional: depends on your model
        }); 
console.log(objects(bet));
        // 🧾 Transaction record create karein
        await Transaction.create({
            userId,
            amount: stake,
            type: "bet",
            status: "success",
            betId: bet._id,
            gameType: "wingo", // or dynamic if you have multiple games
            roundNumber,
            walletBefore,
            walletAfter,
            meta: {
                pickedColor: type === "color" ? value : undefined,
                pickedNumber: type === "number" ? value : undefined,
                remark: "User placed a bet",
            },
        });

        res.json({
            ok: true,
            message: "Bet placed successfully",
            bet,
            balance: walletAfter,
        });
    } catch (e) {
        console.error("Bet Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});
router.get('/transection', auth, async (req, res) => {
    try {
        const userId = req.user;
        const data = await Bet.find({ user: userId }).limit(20).sort({ createdAt: -1 })
    ;
        return res.json({ ok: true, transactions:data })

    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const limit = Math.min(200, parseInt(req.query.limit || '10'));
        const docs = await Round.find().sort({ createdAt: -1 }).limit(10).lean();
        // send oldest->newest for easier rendering
        //console.log(docs);
        return res.json(docs);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get("/latest", async (req, res) => {
    try {
        const data = await Round.find({ result: { $ne: null } })
            .sort({ roundNumber: -1 })
            .limit(10)
            .select("roundNumber result -_id");

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});



module.exports = router;
