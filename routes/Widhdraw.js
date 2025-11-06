const router = require("express").Router();
const User = require("../models/User");
const WithdrawRequest = require("../models/WithdrawRequest");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");

router.post("/", auth, async (req, res) => {
    const { amount, upi } = req.body;

    const user = await User.findById(req.user.id);
    if (user.wallet < amount) return res.json({ msg: "Low balance" });

    user.wallet -= amount;
    await user.save();

    await WithdrawRequest.create({ userId: user._id, amount, upi });

    await Transaction.create({ userId: user._id, amount, type: "withdraw" });

    res.json({ msg: "Withdraw request submitted" });
});

module.exports = router;
