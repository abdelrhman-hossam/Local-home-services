// ====================================
// استيراد المكتبات المطلوبة
// ====================================
require('dotenv').config(); // تحميل متغيرات البيئة من ملف .env
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // للسماح بطلبات Cross-Origin
const path = require("path");
const helmet = require("helmet"); // حماية العناوين
const rateLimit = require("express-rate-limit"); // تحديد عدد الطلبات
const mongoSanitize = require("express-mongo-sanitize"); // منع NoSQL Injection

// ====================================
// إنشاء تطبيق Express
// ====================================
const app = express();

// Set trust proxy for Vercel/proxies so rate limiters work correctly
app.set('trust proxy', 1);

// ====================================
// Middleware - البرمجيات الوسيطة
// ====================================
// ✅ FIX API7 - CORS: تقييد المصادر المسموح بها
// في الإنتاج: حدد النطاق الفعلي فقط (مثل: https://yourdomain.com)
// لا تستخدم '*' في الإنتاج أبداً
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:5000", "http://127.0.0.1:5000"];

const corsOptions = {
  origin: (origin, callback) => {
    // السماح للطلبات بدون origin (Postman, mobile apps, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ [SECURITY] محاولة وصول CORS من مصدر غير مصرح: ${origin}`);
      callback(new Error("غير مسموح بالوصول من هذا المصدر (CORS)"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// --- إعدادات الأمان (Security) ---

// ✅ FIX API7 - تفعيل جميع إعدادات Helmet الأمنية
// إزالة X-Powered-By header لمنع كشف تقنية السيرفر
app.disable("x-powered-by");

app.use(helmet({
  // ✅ تفعيل Content Security Policy لمنع XSS
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // inline scripts للـ frontend الحالي
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  // ✅ إخفاء معلومات السيرفر
  hidePoweredBy: true,
  // ✅ منع Clickjacking
  frameguard: { action: "deny" },
  // ✅ منع MIME type sniffing
  noSniff: true,
  // ✅ تفعيل XSS Protection للمتصفحات القديمة
  xssFilter: true,
  // ✅ HSTS - إجبار HTTPS في الإنتاج
  hsts: process.env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true } : false
}));

// 2. منع NoSQL Injection (تطهير البيانات)
app.use(mongoSanitize());

// 3. تحديد معدل الطلبات العالمي (Rate Limiting)
// يسمح بـ 100 طلب كل 15 دقيقة لكل IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100,
  message: {
    success: false,
    message: "لقد تجاوزت عدد الطلبات المسموح بها، يرجى المحاولة لاحقاً."
  }
});
app.use("/api", limiter); // تطبيق المحدد على مسارات الـ API فقط

// ✅ FIX API4 - تحديد حجم الـ request body لمنع هجمات الـ payload الكبير
app.use(express.json({ limit: "10kb" }));

// ✅ تحذير أمني عند عدم وجود JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.warn("⛔ [SECURITY WARNING] JWT_SECRET غير محدد في ملف .env!");
  console.warn("⛔ السيرفر يستخدم مفتاحاً افتراضياً غير آمن للتطوير فقط!");
}

// معالجة البيانات الواردة من النماذج (بحد أقصى 10kb)
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ====================================
// تقديم الملفات الثابتة (Static Files)
// ====================================
// تقديم ملفات HTML, CSS, Images من مجلد public
app.use(express.static(path.join(__dirname, "public")));

// ====================================
// Route للصفحة الرئيسية
// ====================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====================================
// Routes - المسارات الخاصة بالـ API
// ====================================
// استيراد وربط routes الخاصة بالخدمات والطلبات
const servicesRoutes = require("./routes/services");
const ordersRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const reviewRoutes = require("./routes/reviews");
const paymentRoutes = require("./routes/payment");

// Middleware لفحص حالة قاعدة البيانات قبل معالجة الطلبات
// في بيئة Vercel (Serverless) يجب أن ننتظر حتى تتصل القاعدة قبل معالجة الطلب
app.use('/api', async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ جاري محاولة إنشاء اتصال بقاعدة البيانات...');
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/local_home_services', {
        serverSelectionTimeoutMS: 15000,
      });
      console.log("✅ تم الاتصال بقاعدة البيانات MongoDB بنجاح قبل معالجة الطلب!");
    } catch (err) {
      console.error("❌ فشل الاتصال بقاعدة البيانات قبل معالجة الطلب:", err.message);
    }
  }
  next();
});

// استخدام Routes مع prefix مناسب
app.use("/api/services", servicesRoutes); // مسارات الخدمات
app.use("/api/orders", ordersRoutes);     // مسارات الطلبات
app.use("/api/auth", authRoutes);         // مسارات المصادقة
app.use("/api/admin", adminRoutes);       // مسارات الإدارة
app.use("/api/reviews", reviewRoutes);     // مسارات التقييمات
app.use("/api/payment", paymentRoutes);   // مسارات الدفع

// ====================================
// الاتصال الأولي بقاعدة البيانات MongoDB
// ====================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/local_home_services';

// محاولة الاتصال عند بدء التشغيل
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 15000, // مهلة 15 ثانية للاتصال بسيرفر أطلس
})
  .then(() => {
    console.log("✅ تم الاتصال بقاعدة البيانات MongoDB (بدء التشغيل)");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.error("❌ فشل الاتصال الأولي بقاعدة البيانات!");
    console.error("📝 السبب المحتمل: " + err.message);
  });


// ====================================
// معالجة الأخطاء - Error Handling
// ====================================
// معالجة المسارات غير الموجودة (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "المسار المطلوب غير موجود",
    error: "Not Found"
  });
});

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
  console.error("❌ خطأ في الخادم:", err.stack);
  res.status(500).json({
    success: false,
    message: "حدث خطأ في الخادم",
    error: process.env.NODE_ENV === 'development' ? err.message : "Internal Server Error"
  });
});

// ====================================
// تشغيل الخادم - Start Server
// ====================================
// ====================================
// تصدير تطبيق Express ليعمل كـ Serverless Function على Vercel
// ====================================
module.exports = app;

// تشغيل الخادم محلياً فقط (Local Development)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
  });
}
