const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// @desc    تحديث حالة الدفع (محاكاة)
// @route   PUT /api/payment/confirm/:orderId
router.put("/confirm/:orderId", async (req, res) => {
    try {
        const { paymentStatus, transactionId } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            {
                paymentStatus: paymentStatus || "مدفوع",
                transactionId: transactionId || `TXN-${Date.now()}`
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: "الطلب غير موجود" });
        }

        res.json({
            success: true,
            message: "تم تحديث حالة الدفع بنجاح",
            data: order
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "خطأ في البريد", error: err.message });
    }
});

module.exports = router;
