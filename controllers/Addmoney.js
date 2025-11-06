const User = require('./models/User');
const Transaction = require('./models/Transaction');

app.post("/api/wallet/deposit", async (req, res) => {
    try {
        const { userId, amount } = req.body;

        const user = await User.findById(userId);
        user.wallet += Number(amount);
        await user.save();

        await Transaction.create({
            userId,
            amount,
            type: "deposit"
        });

        res.json({ ok: true, balance: user.wallet });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});
