require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/Auth');
const walletRoutes = require('./routes/wallet_routes');
const betRoutes = require('./routes/Bet_Routes');
//const adminRoutes = require('./admin/routes/admin_routes');
const initSockets = require('./sockets/index');
const scheduler = require('./sheduler/sheduler');

const app = express();
app.use(helmet());
app.use(cors({ origin: 'https://sparkly-lokum-3febf3.netlify.app/', credentials: true }));
app.use(express.json());

// Rate limiter
app.use(rateLimit({ windowMs: 10 * 1000, max: 50 }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/bet', betRoutes);
//app.use('/admin', adminRoutes);

// Diagnostic endpoint
app.get('/api/time', (req, res) => res.json({ serverTime: Date.now() }));

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Init socket logic
initSockets(io);

// Start scheduler
scheduler(io);

// Connect to Mongo
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => server.listen(PORT, () => console.log('Server listening', PORT)))
    .catch(e => console.error('Mongo connect err', e));

module.exports = { app, server };



/* // secure-color-prediction-server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Models - adapt these schemas to match your project
const Round = require('./models/Round');
const Bet = require('./models/Bet');
const User = require('./models/User');
// NOTE: your file was named Transection earlier in snippets — keep same if your file is named that
const Transaction = require('./models/Transection');

const authRoutes = require('./routes/Auth');
const walletRoutes = require('./routes/wallet_routes');
const betRoutes = require('./routes/Bet_Routes');

const app = express();
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/bet', betRoutes);

const PORT = process.env.PORT || 5000;
const ROUND_MS = (parseInt(process.env.ROUND_SECONDS, 10) || 30) * 1000;
const BET_LOCK_MS = Math.min(5000, Math.floor(ROUND_MS * 0.15)); // lock betting in last N ms (default 5s or 15%)

const limiter = rateLimit({ windowMs: 10 * 1000, max: 50 });
app.use(limiter);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// --- helpers ---
function periodIndex(ms) { return Math.floor(ms / ROUND_MS); }

// pickNumber: you can plug a more robust RNG if required
function pickNumber() { return Math.floor(Math.random() * 10); }

// helper to compute colors/payouts
function numberToColor(n) {
    if (n === 0 || n === 5) return 'violet';
    return (n % 2 === 0) ? 'green' : 'red';
}
function numberToBigSmall(n) { return n >= 5 ? 'Big' : 'Small'; }

// Ensure a round row exists for index
async function ensureRound(idx) {
    const start = idx * ROUND_MS;
    const end = (idx + 1) * ROUND_MS;
    let r = await Round.findOne({ roundNumber: idx });
    if (!r) {
        r = new Round({ roundNumber: idx, startTime: start, endTime: end, result: null });
        await r.save();
    }
    return r;
}

// Evaluate and pay bets for a round (atomic-ish)
// We ensure Round.result is set (by admin or system) before calling this.
async function evaluateBetsFor(roundNumber, picked, resultSource = 'system') {
    // Fetch all bets for the round that haven't been paid yet
    const bets = await Bet.find({ roundNumber, paid: { $ne: true } });
    if (!bets || bets.length === 0) return;

    const color = numberToColor(picked);
    const bigSmall = numberToBigSmall(picked);

    // Iterate and attempt atomic update per bet to prevent double-paying
    for (const b of bets) {
        try {
            if (b.paid) continue; // skip already paid

            let payout = 0;
            if (b.type === 'number' && String(b.value) === String(picked)) payout = b.stake * 9; // example 9x
            else if (b.type === 'color' && b.value === color) {
                payout = (color === 'violet') ? b.stake * 5 : b.stake * 2;
            } else if (b.type === 'bigsmall' && b.value === bigSmall) payout = b.stake * 2;

            // Update bet with result, payout and mark paid in one query to avoid races
            const updated = await Bet.findOneAndUpdate(
                { _id: b._id, paid: { $ne: true } },
                { $set: { payout, won: payout > 0, result: picked, paid: true, resultSource } },
                { new: true }
            );

            if (!updated) continue; // someone else handled it

            if (payout > 0) {
                // credit user wallet atomically
                await User.findByIdAndUpdate(b.user, { $inc: { walletBalance: payout } });
                await Transaction.create({ userId: b.user, amount: payout, type: 'win', meta: { roundNumber } });

                // notify user (if connected)
                io.to(String(b.user)).emit('bet_result', { betId: b._id, roundNumber, payout, result: picked });
            } else {
                io.to(String(b.user)).emit('bet_result', { betId: b._id, roundNumber, payout: 0, result: picked });
            }
        } catch (e) {
            console.error('Error paying bet', b._id, e);
        }
    }
}

// Draw result for previous round in an atomic-safe way
async function drawResultFor(prev) {
    if (prev < 0) return;
    // Try to set result only if it's still null. If admin already set, skip.
    const rnd = await Round.findOne({ roundNumber: prev });
    if (!rnd) return;
    if (rnd.result !== null) return; // already set by admin or earlier

    const picked = pickNumber();

    // atomic set: only set result when it's null (prevents race with admin)
    const updatedRound = await Round.findOneAndUpdate(
        { roundNumber: prev, result: null },
        { $set: { result: picked, resultSource: 'system', resultAt: Date.now() } },
        { new: true }
    );

    if (!updatedRound) return; // lost race

    // evaluate bets for this round using the concrete picked value
    await evaluateBetsFor(prev, picked, 'system');

    // emit result (use the picked variable we just set)
    io.emit('round_result', { roundNumber: prev, result: picked, time: Date.now(), source: 'system' });

    // also emit compact new_result for ResultsBar subscribers
    io.emit('new_result', { result: picked, color: numberToColor(picked), roundNumber: prev });
}

// Scheduler: ensure rounds and trigger draw for prev round
let currentIdx = null;
async function scheduler() {
    const now = Date.now();
    const idx = periodIndex(now);
    if (currentIdx === null) { currentIdx = idx; await ensureRound(idx); }
    if (idx !== currentIdx) {
        currentIdx = idx;
        await ensureRound(idx);
        io.emit('new_round', { roundNumber: idx, startTime: idx * ROUND_MS, endTime: (idx + 1) * ROUND_MS });
    }
    const prev = idx - 1;
    if (prev >= 0) await drawResultFor(prev);
}
setInterval(scheduler, 1000);

// Socket middleware to validate JWT and attach userId
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow guest with reduced permissions
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.isAdmin = decoded.isAdmin || false;
        return next();
    } catch (err) {
        return next(); // allow but unauthenticated
    }
});

// On connection: join a room for userId so we can target messages
io.on('connection', (socket) => {
    console.log('client connected', socket.id, 'userId=', socket.userId);
    if (socket.userId) socket.join(String(socket.userId));

    const now = Date.now();
    const idx = periodIndex(now);
    ensureRound(idx).then(r => {
        socket.emit('init', { serverTime: now, roundNumber: idx, startTime: idx * ROUND_MS, endTime: (idx + 1) * ROUND_MS });
    });

    // Place bet: IMPORTANT - we do NOT trust client-provided user id
    socket.on('place_bet', async (payload) => {
        try {
            if (!socket.userId) return socket.emit('bet_placed', { ok: false, error: 'Authentication required' });

            const { roundNumber, type, value, stake } = payload;
            const rn = Number(roundNumber);
            const sStake = Number(stake);
            if (isNaN(sStake) || sStake <= 0) return socket.emit('bet_placed', { ok: false, error: 'Invalid stake' });

            const round = await Round.findOne({ roundNumber: rn });
            if (!round) return socket.emit('bet_placed', { ok: false, error: 'Round not found' });

            // prevent betting in last BET_LOCK_MS milliseconds
            const msLeft = (round.endTime - Date.now());
            if (msLeft <= BET_LOCK_MS) return socket.emit('bet_placed', { ok: false, error: 'Betting closed for this round' });

            // Atomic wallet decrement (ensures no negative balance)
            const user = await User.findOneAndUpdate(
                { _id: socket.userId, walletBalance: { $gte: sStake } },
                { $inc: { walletBalance: -sStake } },
                { new: true }
            );

            if (!user) return socket.emit('bet_placed', { ok: false, error: 'Insufficient balance' });

            // Create bet - mark paid:false by default
            const bet = await Bet.create({ user: user._id, roundNumber: rn, type, value, stake: sStake, paid: false, createdAt: Date.now() });

            // record transaction for bet
            await Transaction.create({ userId: user._id, amount: sStake, type: 'bet', meta: { roundNumber: rn, betId: bet._id } });

            socket.emit('bet_placed', { ok: true, bet, balance: user.walletBalance });
            io.emit('new_bet', { roundNumber: rn, type, value, stake: sStake });
        } catch (e) {
            console.error('place_bet err', e);
            socket.emit('bet_placed', { ok: false, error: e.message });
        }
    });

    // Allow clients to request latest rounds
    socket.on('get-latest', async (limit = 50) => {
        try {
            const rounds = await Round.find().sort({ createdAt: -1 }).limit(limit).lean();
            // respond with newest->oldest or oldest->newest based on your frontend expectation
            socket.emit('latest-bets', rounds); // front can reverse if needed
        } catch (err) {
            console.error(err);
        }
    });

    // clean disconnect
    socket.on('disconnect', () => {
        // console.log('client disconnected', socket.id);
    });
});

// Admin middleware for REST
function adminOnly(req, res, next) {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(auth, process.env.JWT_SECRET);
        if (!decoded.isAdmin) return res.status(403).json({ error: 'Forbidden' });
        req.user = decoded; return next();
    } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
}

// Admin endpoint: set result for a round (only if not already set).
app.post('/admin/set-result', adminOnly, async (req, res) => {
    try {
        const { roundNumber, result } = req.body;
        const rn = Number(roundNumber);
        if (isNaN(rn) || result === undefined) return res.status(400).json({ ok: false, error: 'Bad request' });

        // Set result only if result is null
        const updated = await Round.findOneAndUpdate(
            { roundNumber: rn, result: null },
            { $set: { result, resultSource: 'admin', resultAt: Date.now(), adminId: req.user.id } },
            { new: true }
        );

        if (!updated) return res.status(409).json({ ok: false, error: 'Result already set or round not found' });

        // evaluate bets for this round (use updated.result)
        await evaluateBetsFor(rn, updated.result, 'admin');

        io.emit("round_result", {
            roundNumber: rn,
            winningNumber: updated.result.number,   // jo number nikla
            winningColor: updated.result.color,     // jo color nikla
            winnerIds: updated.winnerIds || [],     // winners ki array
            rewardAmount: updated.rewardAmount || 0,
            time: Date.now(),
            source: "admin"
        });


        io.emit('new_result', { result: updated.result, color: numberToColor(updated.result), roundNumber: rn });

        return res.json({ ok: true, round: updated });
    } catch (e) {
        console.error('admin set result err', e);
        return res.status(500).json({ ok: false, error: e.message });
    }
});

// small diagnostic endpoint
app.get('/api/time', (req, res) => res.json({ serverTime: Date.now() }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => server.listen(PORT, () => console.log('Server listening', PORT)))
    .catch(e => console.error('Mongo connect err', e));

// Export server for tests
module.exports = { app, server };


 */
