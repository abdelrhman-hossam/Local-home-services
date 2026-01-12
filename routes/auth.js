// ====================================
// مسارات المصادقة - Auth Routes
// ====================================
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const rateLimit = require("express-rate-limit");

// محدد خاص لمحاولات تسجيل الدخول والتسجيل (أكثر صرامة)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // ساعة واحدة
    max: 15, // 15 محاولة فقط كل ساعة
    message: {
        success: false,
        message: "كثير من محاولات الدخول/التسجيل، يرجى المحاولة بعد ساعة."
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // التحقق من وجود المستخدم مسبقاً
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "المستخدم موجود بالفعل"
            });
        }

        // إنشاء مستخدم جديد
        const user = await User.create({
            username,
            email,
            password,
            role: role || "user" // الافتراضي مستخدم عادي
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "خطأ في عملية التسجيل",
            error: err.message
        });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
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
            error: err.message
        });
    }
});

// ميثود لإنشاء التوكن وإرسال الاستجابة
const sendTokenResponse = (user, statusCode, res) => {
    // إنشاء التوكن
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || "raya_secret_key_2026",
        { expiresIn: "30d" }
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
