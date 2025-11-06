
const mongoose = require('mongoose');
const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    type: { type: String, enum: ['deposit', 'bet', 'win', 'withdraw'] },
    status: { type: String, default: 'success' }
}, { timestamps: true });
module.exports = mongoose.model('Transaction', TransactionSchema);


/* const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['deposit', 'bet', 'win', 'withdraw'], required: true },
    status: { type: String, default: 'success' },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
 */