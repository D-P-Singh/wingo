const Deposit = require("../models/Deposit");


// ✅ Get all deposits (with optional search)
exports.getDeposits = async (req, res) => {
    try {
        const q = req.query.q || "";
        const regex = new RegExp(q, "i");

        const deposits = await Deposit.find({
            $or: [
                { userName: regex },
                { userId: regex },
                { utr: regex },
                { _id: regex }
            ]
        }).sort({ createdAt: -1 });

        res.json(deposits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

