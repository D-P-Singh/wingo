const mongoose = require('mongoose');
const WithdrawRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    upi: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });
module.exports = mongoose.model('WithdrawRequest', WithdrawRequestSchema);


/* const mongoose = require('mongoose');

const WithdrawRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    upi: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WithdrawRequest', WithdrawRequestSchema);
 */