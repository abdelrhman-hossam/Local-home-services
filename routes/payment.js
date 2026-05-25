// ====================================
// مسارات الدفع - Payment Routes
// ====================================
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect, authorize } = require("../middleware/auth");

// ====================================
// ✅ FIX API5 - Broken Function Level Authorization
// @desc    تحديث حالة الدفع - للأدمن فقط
// @route   PUT /api/payment/confirm/:orderId
// @access  Private - Admin Only
// ====================================
router.put("/confirm/:orderId", protect, authorize("admin"), async (req, res) => {
    try {
        // ✅ استخراج الحقول المسموح بها فقط - لا نقبل أي حقل تاني
        const { paymentStatus, transactionId } = req.body;

        // التحقق من أن الـ paymentStatus قيمة معروفة
        const allowedStatuses = ["مدفوع", "غير مدفوع", "مسترد"];
        if (paymentStatus && !allowedStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: "حالة الدفع غير صالحة"
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            {
                paymentStatus: paymentStatus || "مدفوع",
                transactionId: transactionId || `TXN-${Date.now()}`
            },
            { new: true, runValidators: true }
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
        res.status(500).json({
            success: false,
            message: "خطأ في تحديث حالة الدفع",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
});

module.exports = router;

