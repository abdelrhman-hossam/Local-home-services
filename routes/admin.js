// ====================================
// مسارات الإدارة - Admin Routes
// ====================================
const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Order = require("../models/Order");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// ✅ تطبيق الحماية على جميع هذه المسارات (أدمن فقط)
router.use(protect);
router.use(authorize("admin"));

// ====================================
// --- إدارة الخدمات ---
// ====================================

// @desc    إضافة خدمة جديدة
// @route   POST /api/admin/services
// ✅ FIX API3 Mass Assignment: نحدد الحقول المسموح بها فقط
router.post("/services", async (req, res) => {
    try {
        const { name, description, price, category, imageUrl } = req.body;

        if (!name || !description || !price) {
            return res.status(400).json({
                success: false,
                message: "اسم الخدمة والوصف والسعر مطلوبون"
            });
        }

        // ✅ إنشاء الخدمة بالحقول المسموح بها فقط - لا نمرر req.body مباشرة
        const service = await Service.create({ name, description, price, category, imageUrl });
        res.status(201).json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: process.env.NODE_ENV === "development" ? err.message : "خطأ في إضافة الخدمة"
        });
    }
});

// @desc    تعديل خدمة
// @route   PUT /api/admin/services/:id
// ✅ FIX API3 Mass Assignment: تحديد الحقول المسموح بتعديلها فقط
router.put("/services/:id", async (req, res) => {
    try {
        const { name, description, price, category, imageUrl } = req.body;

        // ✅ بناء كائن التحديث بالحقول المسموح بها فقط
        const allowedUpdates = {};
        if (name !== undefined) allowedUpdates.name = name;
        if (description !== undefined) allowedUpdates.description = description;
        if (price !== undefined) allowedUpdates.price = price;
        if (category !== undefined) allowedUpdates.category = category;
        if (imageUrl !== undefined) allowedUpdates.imageUrl = imageUrl;

        const service = await Service.findByIdAndUpdate(
            req.params.id,
            allowedUpdates,
            { new: true, runValidators: true }
        );

        if (!service) {
            return res.status(404).json({ success: false, message: "الخدمة غير موجودة" });
        }

        res.json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: process.env.NODE_ENV === "development" ? err.message : "خطأ في تعديل الخدمة"
        });
    }
});

// @desc    حذف خدمة
// @route   DELETE /api/admin/services/:id
router.delete("/services/:id", async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);

        if (!service) {
            return res.status(404).json({ success: false, message: "الخدمة غير موجودة" });
        }

        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: process.env.NODE_ENV === "development" ? err.message : "خطأ في حذف الخدمة"
        });
    }
});

// ====================================
// --- إدارة الطلبات ---
// ====================================

// @desc    تحديث حالة الطلب
// @route   PUT /api/admin/orders/:id
// ✅ FIX API3: الأدمن يقدر يعدل الـ status فقط - مش أي حقل
router.put("/orders/:id", async (req, res) => {
    try {
        const { status } = req.body;

        // ✅ التحقق من أن الـ status قيمة مسموح بها فقط
        const allowedStatuses = ["جديد", "قيد التنفيذ", "مكتمل", "ملغي"];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `الحالة غير صالحة. القيم المسموح بها: ${allowedStatuses.join(", ")}`
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },  // ✅ فقط الـ status - لا نمرر req.body كله
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: "الطلب غير موجود" });
        }

        res.json({ success: true, data: order });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: process.env.NODE_ENV === "development" ? err.message : "خطأ في تحديث الطلب"
        });
    }
});

// @desc    حذف طلب
// @route   DELETE /api/admin/orders/:id
router.delete("/orders/:id", async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: "الطلب غير موجود" });
        }

        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: process.env.NODE_ENV === "development" ? err.message : "خطأ في حذف الطلب"
        });
    }
});

// ====================================
// --- إدارة المستخدمين ---
// ====================================

// @desc    جلب جميع المستخدمين
// @route   GET /api/admin/users
// ✅ لا نرجع الـ password أبداً
router.get("/users", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: "خطأ في جلب المستخدمين" });
    }
});

// @desc    تغيير دور مستخدم (ترقية/تخفيض)
// @route   PUT /api/admin/users/:id/role
// ✅ endpoint منفصل لتغيير الدور - يتطلب صلاحية أدمن صريحة
router.put("/users/:id/role", async (req, res) => {
    try {
        const { role } = req.body;

        const allowedRoles = ["user", "admin"];
        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "الدور غير صالح. القيم المسموح بها: user, admin"
            });
        }

        // منع الأدمن من تغيير دور نفسه
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "لا يمكنك تغيير دورك بنفسك"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
        }

        console.log(`✅ [ADMIN] ${req.user.username} غيّر دور المستخدم ${user.username} إلى: ${role}`);
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: process.env.NODE_ENV === "development" ? err.message : "خطأ في تغيير الدور"
        });
    }
});

module.exports = router;

