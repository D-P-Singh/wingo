

const mongoose = require('mongoose');
const RoundSchema = new mongoose.Schema({
    roundNumber: { type: Number, required: true, unique: true },
    startTime: Number,
    endTime: Number,
    result: { type: Number, default: null }
}, { timestamps: true });
module.exports = mongoose.model('Round', RoundSchema);


/* const mongoose = require('mongoose');

const RoundSchema = new mongoose.Schema({
    roundNumber: { type: Number, required: true, unique: true },
    startTime: { type: Number, required: true }, // ms since epoch
    endTime: { type: Number, required: true },   // ms
    result: { type: Number, default: null },     // 0-9
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Round', RoundSchema); */
