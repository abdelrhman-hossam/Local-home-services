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
// تفعيل CORS للسماح بطلبات من نطاقات مختلفة
// استخدام CORS_ORIGIN من ملف .env أو السماح من أي مكان للتطوير
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
};
app.use(cors(corsOptions));

// --- إعدادات الأمان (Security) ---

// 1. حماية HTTP Headers باستخدام Helmet
app.use(helmet({
  contentSecurityPolicy: false, // تعطيل CSP مؤقتاً لسهولة التعامل مع الصور والسكربتات الخارجية في وضع التطوير
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

// معالجة البيانات الواردة بصيغة JSON
app.use(express.json());

// معالجة البيانات الواردة من النماذج
app.use(express.urlencoded({ extended: true }));

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
