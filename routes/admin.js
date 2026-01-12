// ====================================
// مسارات الإدارة - Admin Routes
// ====================================
const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Order = require("../models/Order");
const { protect, authorize } = require("../middleware/auth");

// تطبيق الحماية على جميع هذه المسارات (أدمن فقط)
router.use(protect);
router.use(authorize("admin"));

// --- إدارة الخدمات ---

// @desc    إضافة خدمة جديدة
// @route   POST /api/admin/services
router.post("/services", async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.status(201).json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// @desc    تعديل خدمة
// @route   PUT /api/admin/services/:id
router.put("/services/:id", async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// @desc    حذف خدمة
// @route   DELETE /api/admin/services/:id
router.delete("/services/:id", async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// --- إدارة الطلبات ---

// @desc    تحديث حالة الطلب
// @route   PUT /api/admin/orders/:id
router.put("/orders/:id", async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, {
            new: true
        });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// @desc    حذف طلب
// @route   DELETE /api/admin/orders/:id
router.delete("/orders/:id", async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;
