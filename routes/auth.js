// ====================================
// مسارات المصادقة - Auth Routes
// ====================================
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth");

// ====================================
// التحقق من وجود JWT_SECRET في البيئة
// ====================================
if (!process.env.JWT_SECRET) {
    console.error("⛔ SECURITY ERROR: JWT_SECRET غير موجود في ملف .env - يجب تحديده فوراً!");
    if (process.env.NODE_ENV === "production") {
        process.exit(1); // إيقاف السيرفر في الإنتاج إذا لم يوجد المفتاح السري
    }
}

// ====================================
// Rate Limiter خاص بالمصادقة (أكثر صرامة)
// ====================================
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // ساعة واحدة
    max: 10, // 10 محاولات فقط كل ساعة (مشدد من 15)
    message: {
        success: false,
        message: "كثير من محاولات الدخول/التسجيل، يرجى المحاولة بعد ساعة."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ====================================
// @desc    تسجيل مستخدم جديد
// @route   POST /api/auth/register
// @access  Public
// ====================================
router.post("/register", authLimiter, async (req, res) => {
    try {
        // ✅ FIX API3 - Mass Assignment: استخراج الحقول المسموح بها فقط
        // يُمنع منعاً باتاً قبول حقل "role" من المستخدم
        // الـ role يُحدد دائماً على السيرفر وليس من الـ client
        const { username, email, password } = req.body;

        // التحقق من وجود جميع الحقول المطلوبة
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "جميع الحقول مطلوبة (اسم المستخدم، البريد الإلكتروني، كلمة المرور)"
            });
        }

        // التحقق من طول كلمة المرور
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
            });
        }

        // التحقق من وجود المستخدم مسبقاً
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "المستخدم موجود بالفعل"
            });
        }

        // ✅ إنشاء مستخدم جديد - الـ role دائماً "user" ولا يُقبل من الـ body أبداً
        const user = await User.create({
            username,
            email,
            password,
            role: "user" // ← مُثبّت على السيرفر - لا يمكن للمستخدم تغييره
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        // ✅ FIX API7: لا نكشف تفاصيل الخطأ الداخلية في الإنتاج
        res.status(500).json({
            success: false,
            message: "خطأ في عملية التسجيل",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
});

// ====================================
// @desc    تسجيل الدخول
// @route   POST /api/auth/login
// @access  Public
// ====================================
router.post("/login", authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // التحقق من الحقول
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "يرجى إدخال البريد الإلكتروني وكلمة المرور"
            });
        }

        // البحث عن المستخدم وتضمين كلمة المرور
        const user = await User.findOne({ email }).select("+password");

        // ✅ رسالة خطأ موحدة لمنع User Enumeration
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                success: false,
                message: "بيانات الدخول غير صحيحة"
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "خطأ في عملية تسجيل الدخول",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
});

// ====================================
// @desc    جلب بيانات المستخدم الحالي
// @route   GET /api/auth/me
// @access  Private
// ====================================
router.get("/me", protect, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// ====================================
// دالة داخلية لإنشاء التوكن وإرسال الاستجابة
// ====================================
const sendTokenResponse = (user, statusCode, res) => {
    const secret = process.env.JWT_SECRET || "raya_dev_secret_key_NOT_FOR_PRODUCTION_2026";

    // ✅ التوكن صالح لـ 24 ساعة فقط (مشدد من 30 يوم)
    const token = jwt.sign(
        { id: user._id },
        secret,
        { expiresIn: "24h" }
    );

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
};

module.exports = router;
