const Bet = require('../models/Bet');
const User = require('../models/User');
const Transaction = require('../models/Transection');
const { numberToColor, numberToBigSmall } = require('./utils');

async function evaluateBetsFor(roundNumber, picked, resultSource = 'system') {
    const bets = await Bet.find({ roundNumber, paid: { $ne: true } });
    if (!bets || !bets.length) return;

    const color = numberToColor(picked);
    const bigSmall = numberToBigSmall(picked);

    for (const b of bets) {
        if (b.paid) continue;

        let payout = 0;
        if (b.type === 'number' && String(b.value) === String(picked)) payout = b.stake * 9;
        else if (b.type === 'color' && b.value === color)
            payout = color === 'violet' ? b.stake * 5 : b.stake * 2;
        else if (b.type === 'bigsmall' && b.value === bigSmall)
            payout = b.stake * 2;

        payout = payout - (payout * 1) / 100;


        const updated = await Bet.findOneAndUpdate(
            { _id: b._id, paid: { $ne: true } },
            { $set: { payout, won: payout > 0, result: picked, paid: true, resultSource } },
            { new: true }
        );

        if (!updated) continue;

        if (payout > 0) {
            const totalAmount = payout //+ b.stake; // include stake if needed
            await User.findByIdAndUpdate(b.user, { $inc: { walletBalance: totalAmount } });
            await Transaction.create({ userId: b.user, amount: totalAmount, type: 'win', meta: { roundNumber } });
        }
    }
}


module.exports = { evaluateBetsFor };
