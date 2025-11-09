const Round = require('../models/Round');
const { pickNumber, numberToColor } = require('./utils');
const { evaluateBetsFor } = require('./bets');

const ROUND_MS = (parseInt(process.env.ROUND_SECONDS, 10) || 30) * 1000;

function periodIndex(ms) { return Math.floor(ms / ROUND_MS); }

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

async function drawResultFor(prev, io) {
    if (prev < 0) return;
    const rnd = await Round.findOne({ roundNumber: prev });
    if (!rnd || rnd.result !== null) return;

    const picked = pickNumber();
    const updatedRound = await Round.findOneAndUpdate(
        { roundNumber: prev, result: null },
        { $set: { result: picked, resultSource: 'system', resultAt: Date.now() } },
        { new: true }
    );

    if (!updatedRound) return;
   /*  await evaluateBetsFor(prev, picked);
 */
    await evaluateBetsFor(prev, picked, io);

    io.emit('round_result', { roundNumber: prev, result: picked, time: Date.now(), source: 'system' });
    io.emit('new_result', { result: picked, color: numberToColor(picked), roundNumber: prev });
}

module.exports = { periodIndex, ensureRound, drawResultFor, ROUND_MS };
