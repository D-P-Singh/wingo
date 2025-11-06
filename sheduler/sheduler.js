const { periodIndex, ensureRound, drawResultFor } = require('../helpers/rounds');

let currentIdx = null;

module.exports = (io) => {
    async function scheduler() {
        const now = Date.now();
        const idx = periodIndex(now);

        if (currentIdx === null) { currentIdx = idx; await ensureRound(idx); }
        if (idx !== currentIdx) { currentIdx = idx; await ensureRound(idx); io.emit('new_round', { roundNumber: idx, startTime: idx * 30000, endTime: (idx + 1) * 30000 }); }

        const prev = idx - 1;
        if (prev >= 0) await drawResultFor(prev, io);
    }
    setInterval(scheduler, 1000);
};
