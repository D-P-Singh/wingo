const User = require('../models/User');
const Bet = require('../models/Bet');
const Transaction = require('../models/Transection');
const { ensureRound, periodIndex } = require('../helpers/rounds');

const BET_LOCK_MS = 5000; // example
 
module.exports = (socket, io) => {
    const now = Date.now();
    const idx = periodIndex(now);

    ensureRound(idx).then(r => {
        socket.emit('init', { serverTime: now, roundNumber: idx, startTime: idx * 30000, endTime: (idx + 1) * 30000 });
    });

    socket.on('place_bet', async (payload) => {
        try {
            if (!socket.userId) return socket.emit('bet_placed', { ok: false, error: 'Authentication required' });

            const { roundNumber, type, value, stake } = payload;
            const sStake = Number(stake);
            if (!sStake || sStake <= 0) return socket.emit('bet_placed', { ok: false, error: 'Invalid stake' });

            const round = await ensureRound(roundNumber);
            if (!round) return socket.emit('bet_placed', { ok: false, error: 'Round not found' });

            if (round.endTime - Date.now() <= BET_LOCK_MS) return socket.emit('bet_placed', { ok: false, error: 'Betting closed' });

            const user = await User.findOneAndUpdate(
                { _id: socket.userId, walletBalance: { $gte: sStake } },
                { $inc: { walletBalance: -sStake } },
                { new: true }
            );

            if (!user) return socket.emit('bet_placed', { ok: false, error: 'Insufficient balance' });
            const bet = await Bet.create({
                user: user._id,
                roundNumber,
                type,
                value,
                stake: sStake,
                paid: false,
                createdAt: Date.now(),
            });

            // 💰 Wallet update
            const walletBefore = user.walletBalance;
            user.walletBalance -= Number(sStake);
            const walletAfter = user.walletBalance;
            await user.save();

            // 🧾 Transaction record
            await Transaction.create({
                userId: user._id,
                amount: sStake,
                type: "bet",
                status: "success",
                gameType: "wingo", // optional: change if multiple games
                roundNumber,
                betId: bet._id,
                walletBefore,
                walletAfter,
                meta: {
                    pickedColor: type === "color" ? value : undefined,
                    pickedNumber: type === "number" ? value : undefined,
                    remark: `User placed a bet on ${type}: ${value}`,
                },
            });

            // const bet = await Bet.create({ user: user._id, roundNumber, type, value, stake: sStake, paid: false, createdAt: Date.now() });
            // await Transaction.create({ userId: user._id, amount: sStake, type: 'bet', meta: { roundNumber, betId: bet._id } });

            socket.emit('bet_placed', { ok: true, bet, balance: user.walletBalance });
            io.emit('new_bet', { roundNumber, type, value, stake: sStake });
        } catch (e) {
            socket.emit('bet_placed', { ok: false, error: e.message });
        }
    });

    socket.on('get-latest', async (limit = 50) => {
        const Round = require('../models/Round');
        const rounds = await Round.find().sort({ createdAt: -1 }).limit(limit).lean();
        socket.emit('latest-bets', rounds);
    });
};
