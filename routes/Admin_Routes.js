
const express = require("express");
const Deposit = require("../models/Deposit");
const verifyAdmin = require("../middleware/verifyAdmin");
const User = require("../models/User");
const { getDeposits } = require("../controllers/Admin_con");
const Transection = require("../models/Transection");
const Withdraw = require("../models/widhdrawRequest");
const router = express.Router();
// --------- All Users (Admin) ----------
router.get("/users", async (req, res) => {
    try {

        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
        return;
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});  
 
// PUT /admin/users/block-ip-device
router.put('/users/block-ip-device', async (req, res) => {
    const { ids, value } = req.body;
    // blockType: 'ip' | 'device'
    // value: IP or Device ID to block

    if (!ids  || !value) return res.status(400).json({ error: 'Missing parameters' });
 
    try {
        await User.updateMany(
            { _id: { $in: ids } },
            blockType === 'ip' ? { $addToSet: { blockedIPs: value } } : { $addToSet: { blockedDevices: value } }
        );

        res.json({ success: true, message: `${blockType} blocked for selected users` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to block' });
    }
});



// GET /admin/withdraws
// Query params: page, limit, search (user name), status (pending/approved/rejected)
router.get("/withdraws", async (req, res) => {
    try {
        let { page = 1, limit = 10, search, status } = req.query;
        page = Number(page);
        limit = Number(limit);

        // Build filter object
        const filter = {};
        if (status && ["pending", "approved", "rejected"].includes(status)) {
            filter.status = status;
        }

        // Search by user name
        let userIds = null;
        if (search) {
            const users = await User.find({
                name: { $regex: search, $options: "i" },
            }).select("_id");
            userIds = users.map(u => u._id);
            filter.user = { $in: userIds };
        }

        const total = await Withdraw.countDocuments(filter);

        const withdraws = await Withdraw.find(filter)
            .populate("user", "name email phone") // show user details
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ total, data: withdraws });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
// 🧾 Get all deposits
router.get("/deposits", async (req, res) => {
    try {
        const deposits = await Deposit.find()
            .populate("user", "name email phone")
            .sort({ createdAt: -1 });
        res.json(deposits);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Approve/Reject Deposit (Admin)
router.put("/deposit/:id/status", verifyAdmin, async (req, res) => {
    try {
        
        const { status, remark } = req.body; // status: approved / rejected, remark: string
        const deposit = await Deposit.findById(req.params.id);
        if (deposit.status !== "pending") {
            return res.status(400).json({ message: `Deposit already ${deposit.status}` });
        }

        if (!deposit) return res.status(404).json({ message: "Deposit not found" });

        deposit.status = status;
        deposit.remark = remark || "";
        deposit.updatedAt = new Date();
        await deposit.save();

        const user = await User.findById(deposit.user);

        // 🟢 If approved → add money to wallet and record transaction
        if (status === "approved") {
            const walletBefore = user.walletBalance || 0;
            const walletAfter = walletBefore + deposit.amount;

            user.walletBalance = walletAfter;

            await Promise.all([
                user.save(),
                Transaction.create({
                    userId: user._id,
                    type: "deposit",
                    amount: deposit.amount,
                    status: "success",
                    depositId: deposit._id,
                    walletBefore,
                    walletAfter,
                    meta: { utr: deposit.utr, paymentMethod: deposit.paymentMethod, remark },
                }),
            ]);
        }


        // 🔴 If rejected → just add a failed transaction record
        if (status === "rejected") {
            await Transaction.create({
                userId: deposit.user,
                type: "deposit",
                amount: deposit.amount,
                status: "failed",
                depositId: deposit._id,
                meta: { remark },
            });
        }

        res.json({ message: `Deposit ${status}`, deposit });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Approve Withdraw (Admin)
router.put("/withdraw/:id/approve", async (req, res) => {
    try {
        const { remark } = req.body;
        const withdraw = await Withdraw.findById(req.params.id);
        if (!withdraw) return res.status(404).json({ message: "Withdraw not found" });

        // Prevent duplicate approval
        if (withdraw.status !== "pending") {
            return res.status(400).json({ message: `Withdraw already ${withdraw.status}` });
        }

        withdraw.status = "approved";
        withdraw.remark = remark || "";
        withdraw.approvedAt = new Date();
        await withdraw.save();

        const user = await User.findById(withdraw.user);
        const walletBefore = user.walletBalance || 0;
        const walletAfter = walletBefore; // wallet already deducted at request time

        await Transection.create({
            userId: withdraw.user,
            type: "withdraw",
            amount: withdraw.amount,
            status: "success",
            withdrawId: withdraw._id,
            walletBefore,
            walletAfter,
            meta: { paymentMethod: withdraw.paymentMethod, remark },
        });

        res.json({ message: "Withdraw approved successfully", withdraw });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
 

// ❌ Reject Withdraw (Admin)
router.put("/withdraw/:id/reject", async (req, res) => {
    console.log("reject withdraw",req.params.id, req.body);
    try { 
        const { remark } = req.body;
        const withdraw = await Withdraw.findById(req.params.id);
        if (!withdraw) return res.status(404).json({ message: "Withdraw not found" });

        // Prevent double action
        if (withdraw.status !== "pending") {
            return res.status(400).json({ message: `Withdraw already ${withdraw.status}` });
        }

        withdraw.status = "rejected";
        withdraw.remark = remark || "";
        withdraw.updatedAt = new Date();
        await withdraw.save();
 
        // 🪙 Refund user balance
        const user = await User.findById(withdraw.user);
        const walletBefore = user.walletBalance || 0;
        const walletAfter = walletBefore + withdraw.amount;
        user.walletBalance = walletAfter;
        await user.save();

        await Transection.create({
            userId: withdraw.user,
            type: "refund",
            amount: withdraw.amount,
            status: "success",
            withdrawId: withdraw._id,
            walletBefore,
            walletAfter,
            meta: { remark, paymentMethod: withdraw.paymentMethod },
        });

        res.json({ message: "Withdraw rejected & amount refunded", withdraw });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


// GET all transactions (admin)
router.get("/transactions", async (req, res) => {
    try {
        const { type, search } = req.query;
        const query = {};

        if (type) query.type = type;
        if (search) {
            query.$or = [
                { "meta.remark": new RegExp(search, "i") },
                { "meta.utr": new RegExp(search, "i") },
                { "meta.roundNumber": new RegExp(search, "i") },
            ];
        }

        const transactions = await Transection.find(query)
            .populate("userId", "name phone")
            .sort({ createdAt: -1 });

        res.json({ transactions });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

 router.get("/deposits", getDeposits)
// router.get("/deposits", async (req, res) => {
//     try {
//         const deposits = await Deposit.find().populate("user", "name email").sort({ createdAt: -1 });
//         res.json(deposits);
//         return;
//     } catch (err) {
//         res.status(500).json({ message: "Server error", error: err.message });
//     }
// });
// // --------- Approve/Reject Deposit (Admin) ----------
// router.put("/deposit/:id/status",  async (req, res) => {
//     try {
//         const { status } = req.body; // approved / rejected
//         console.log("status update", req.params.id, status);
//         const deposit = await Deposit.findById({_id:req.params.id});
//         if (!deposit) return res.status(404).json({ message: "Deposit not found" });

//         deposit.status = status;
//        // deposit.approvedBy = req.admin.id;
//        // deposit.approvedAt = new Date();

//         await deposit.save();

//         // If approved, credit the user's wallet
//         if (status === "approved") {
           
//             const user = await User.findById(deposit.user);
//             user.walletBalance = (user.walletBalance || 0) + deposit.amount;
//             await user.save();
//         }

//         res.json({ message: `Deposit ${status}`, deposit });
//     } catch (err) {
//         res.status(500).json({ message: "Server error", error: err.message });
//     }
// });

// // Approve withdraw
// router.put("/:id/approve", verifyAdmin, async (req, res) => {
//     const withdraw = await Withdraw.findByIdAndUpdate(
//         req.params.id,
//         { status: "approved", updatedAt: new Date() },
//         { new: true }
//     );
//     res.json(withdraw);
// });

// // Reject withdraw
// router.put("/:id/reject", verifyAdmin, async (req, res) => {
//     const withdraw = await Withdraw.findByIdAndUpdate(
//         req.params.id,
//         { status: "rejected", updatedAt: new Date() },
//         { new: true }
//     );
//     res.json(withdraw);

// });


module.exports = router;