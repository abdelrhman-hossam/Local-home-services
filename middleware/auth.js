// ====================================
// برمجية وسيطة للحماية - Authentication Middleware
// ====================================
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// المفتاح السري المستخدم في كل مكان
const JWT_SECRET = process.env.JWT_SECRET || "raya_dev_secret_key_NOT_FOR_PRODUCTION_2026";

// ====================================
// ✅ Middleware: حماية المسارات (المستخدم لازم يكون مسجل دخول)
// ====================================
exports.protect = async (req, res, next) => {
    let token;

    // قبول التوكن من الـ Authorization Header فقط (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    // ✅ رفض الطلب إذا لم يوجد توكن
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "غير مصرح لك بالوصول - يجب تسجيل الدخول أولاً"
        });
    }

    try {
        // ✅ التحقق من صحة التوكن وانتهاء صلاحيته
        const decoded = jwt.verify(token, JWT_SECRET);

        // ✅ جلب المستخدم من قاعدة البيانات (لا نثق بالـ token وحده)
        // هذا يضمن أن المستخدم لا يزال موجوداً في النظام
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            // المستخدم تم حذفه لكن التوكن لا يزال صالحاً
            console.warn(`⚠️ [SECURITY] محاولة وصول بتوكن لمستخدم محذوف: ${decoded.id}`);
            return res.status(401).json({
                success: false,
                message: "المستخدم غير موجود"
            });
        }

        // ✅ حفظ بيانات المستخدم الحقيقية من DB (وليس من الـ token)
        // الـ role يُؤخذ من قاعدة البيانات دائماً - ليس من الـ JWT
        req.user = user;

        next();
    } catch (err) {
        // تسجيل محاولات التزوير
        if (err.name === "JsonWebTokenError") {
            console.warn(`⚠️ [SECURITY] توكن مزور أو تالف من IP: ${req.ip}`);
        } else if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "انتهت صلاحية الجلسة - يرجى تسجيل الدخول مجدداً"
            });
        }

        return res.status(401).json({
            success: false,
            message: "التوكن غير صالح"
        });
    }
};

// ====================================
// ✅ Middleware: تحديد الصلاحيات بحسب الدور (Role-Based Access Control)
// ====================================
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // التأكد من أن req.user موجود (protect لازم يُشغَّل قبله)
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: "غير مسموح بالوصول"
            });
        }

        if (!roles.includes(req.user.role)) {
            // تسجيل محاولة الوصول غير المصرح بها
            console.warn(`⚠️ [SECURITY] محاولة وصول غير مصرح: المستخدم ${req.user._id} (دور: ${req.user.role}) حاول الوصول لمسار يتطلب: [${roles.join(", ")}]`);

            return res.status(403).json({
                success: false,
                message: "ليس لديك صلاحية للوصول إلى هذا المسار"
            });
        }

        next();
    };
};
