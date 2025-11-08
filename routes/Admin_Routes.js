
const express = require("express");
const Deposit = require("../models/Deposit");
const verifyAdmin = require("../middleware/verifyAdmin");
const router = express.Router();
router.get("/deposits", verifyAdmin, async (req, res) => {
    try {
        const deposits = await Deposit.find().populate("user", "name email").sort({ createdAt: -1 });
        res.json(deposits);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// --------- Approve/Reject Deposit (Admin) ----------
router.put("/deposit/:id/status", verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body; // approved / rejected
        const deposit = await Deposit.findById(req.params.id);
        if (!deposit) return res.status(404).json({ message: "Deposit not found" });

        deposit.status = status;
        deposit.approvedBy = req.admin.id;
        deposit.approvedAt = new Date();

        await deposit.save();

        // If approved, credit the user's wallet
        if (status === "approved") {
            const user = await User.findById(deposit.user);
            user.wallet = (user.wallet || 0) + deposit.amount;
            await user.save();
        }

        res.json({ message: `Deposit ${status}`, deposit });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
// Approve withdraw
router.put("/:id/approve", verifyAdmin, async (req, res) => {
    const withdraw = await Withdraw.findByIdAndUpdate(
        req.params.id,
        { status: "approved", updatedAt: new Date() },
        { new: true }
    );
    res.json(withdraw);
});

// Reject withdraw
router.put("/:id/reject", verifyAdmin, async (req, res) => {
    const withdraw = await Withdraw.findByIdAndUpdate(
        req.params.id,
        { status: "rejected", updatedAt: new Date() },
        { new: true }
    );
    res.json(withdraw);

});


module.exports = router;