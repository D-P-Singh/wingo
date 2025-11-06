const mongoose = require('mongoose');
const BetSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roundNumber: Number,
    type: String, // 'number'|'color'|'bigsmall'
    value: String,
    stake: Number,
    payout: { type: Number, default: 0 },
    won: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Bet', BetSchema);


/* const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema({
    roundNumber: Number,
    user: String, // demo only; real app: user id
    type: String, // 'number'|'color'|'bigsmall'
    value: String, // e.g. '7' or 'red' or 'Big'
    stake: Number,
    payout: { type: Number, default: 0 },
    won: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bet', BetSchema);
 */