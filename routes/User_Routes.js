const express = require("express");
const router = express.Router();
const User = require('../models/User');
const auth = require("../middleware/auth");
const Transection = require("../models/Transection");

// Update user details
router.put("/update",auth, async (req, res) => {
    try { 
        const userId = req.user; // use middleware for JWT
        const updated = await User.findByIdAndUpdate(userId, req.body, { new: true });
        res.json({ success: true, user: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update failed", err });
    }
});
// router.get("/transection", auth, async (req, res) => {
//     try {
//         const userId = req.user; // from auth middleware
//         const { type, search, from, to, page = 1, limit = 12 } = req.query;

//         const filter = { userId };

//         // Type filter
//         if (type && type !== "all") filter.type = type;

//         // Search (transaction ID or custom)
//         if (search) {
//             filter._id = { $regex: search, $options: "i" };
//         }

//         // Date filter
//      /*    if (from || to) {
//             filter.createdAt = {};
//             if (from) filter.createdAt.$gte = new Date(from);
//             if (to) filter.createdAt.$lte = new Date(to);
//         } */

//         const skip = (page - 1) * limit;
//         const total = await Transection.countDocuments(filter);
//         const totalPages = Math.ceil(total / limit);

//         const history = await Transection.find(filter)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(parseInt(limit));

//         res.json({ history, totalPages });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server Error" });
//     }
// });

// Get wallet balance
// 📄 Get All Transactions of Logged-in User
router.get("/transactions", auth, async (req, res) => {
    try {
        const userId = req.user;
 
        // Fetch all user's transactions sorted by latest
        const transactions = await Transection.find({ userId })
            .populate("depositId", "utr paymentMethod status")
            .populate("withdrawId", "paymentMethod status")
            .populate("betId", "roundNumber type value stake")
            .sort({ createdAt: -1 });

        res.json({
            ok: true,
            count: transactions.length,
            transactions,
        });
    } catch (err) {
        res.status(500).json({
            ok: false,
            message: "Server error while fetching transactions",
            error: err.message,
        });
    }
});


router.get("/wallet/balance", async (req, res) => {
    // Example wallet model or user.wallet
    res.json({ balance: 2500 });
});

module.exports = router;



