// ====================================
// برمجية وسيطة للحماية - Authentication Middleware
// ====================================
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// حماية المسارات (يجب أن يكون المستخدم مسجلاً)
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    // التحقق من وجود التوكن
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "غير مصرح لك بالوصول لهذا المسار"
        });
    }

    try {
        // التحقق من صحة التوكن
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "raya_secret_key_2026");

        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "المستخدم غير موجود"
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "التوكن غير صالح"
        });
    }
};

// تحديد الصلاحيات (للأدمن فقط مثلاً)
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `المستخدم بالدور (${req.user.role}) غير مسموح له بالقيام بهذا الإجراء`
            });
        }
        next();
    };
};
