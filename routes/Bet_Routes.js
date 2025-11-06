const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Bet = require('../models/Bet');
const User = require('../models/User');
const Transaction = require('../models/Transection');
const Round = require('../models/Round');

router.post('/', auth, async (req, res) => {
    try {
        const { roundNumber, type, value, stake } = req.body;
        const userId = req.user;
        const user = await User.findById(userId);
        if (user.walletBalance < stake) return res.status(400).json({ msg: 'Low balance' });
        user.walletBalance -= Number(stake);
        await user.save();
        await Transaction.create({ userId, amount: stake, type: 'bet' });
        const bet = await Bet.create({ user: userId, roundNumber, type, value, stake });
        res.json({ ok: true, bet, balance: user.walletBalance });
    } catch (e) {
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
