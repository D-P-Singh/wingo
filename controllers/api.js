// lightweight API handlers
const Round = require('../models/Round');
const Bet = require('../models/Bet');

exports.getServerTime = async (req, res) => {
    const now = Date.now();
    // respond with server epoch ms
    res.json({ serverTime: now });
};

const user = await User.findById(userId);
if (user.walletBalance < stake) return res.json({ msg: "Low balance" });

await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -stake } });
await Transaction.create({ userId, type: "BET", amount: stake });
