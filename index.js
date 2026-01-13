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
  res.sendFile(path.join(__dirname, "public", "pro!.html"));
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
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) { // 1 = connected
    return res.status(503).json({
      success: false,
      message: "الخدمة غير متاحة حالياً - لا يوجد اتصال بقاعدة البيانات",
      error: "Database Disconnected"
    });
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
// الاتصال بقاعدة البيانات MongoDB
// ====================================
// استخدام MONGODB_URI من ملف .env للحفاظ على أمان البيانات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/local_home_services';

// متغير لتتبع حالة الاتصال
let isDbConnected = false;

mongoose.connect(MONGODB_URI)
  .then(() => {
    isDbConnected = true;
    console.log("✅ تم الاتصال بقاعدة البيانات MongoDB بنجاح");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch(err => {
    isDbConnected = false;
    console.error("❌ فشل الاتصال بقاعدة البيانات (لكن الخادم سيستمر في العمل):", err.message);
    console.log("⚠️  ملاحظة: خدمات API التي تعتمد على قاعدة البيانات لن تعمل، لكن الموقع سيظل متاحاً.");
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
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log("\n" + "=".repeat(50));
  console.log(`🚀 الخادم يعمل بنجاح على المنفذ ${PORT}`);
  console.log(`🌐 افتح المتصفح على: http://localhost:${PORT}`);
  console.log(`📘 API Endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/api/services`);
  console.log(`   - POST http://localhost:${PORT}/api/orders`);
  console.log("=".repeat(50) + "\n");
});

// ====================================
// معالجة إغلاق الخادم بشكل آمن (Graceful Shutdown)
// ====================================
process.on('SIGTERM', async () => {
  console.log('\n⚠️  تم استلام إشارة SIGTERM. إغلاق الخادم بأمان...');

  server.close(async () => {
    console.log('🔌 تم إيقاف الخادم');

    try {
      await mongoose.connection.close();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
      process.exit(0);
    } catch (err) {
      console.error('❌ خطأ في إغلاق الاتصال:', err);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  console.log('\n\n⚠️  تم استلام إشارة SIGINT (Ctrl+C). إغلاق الخادم بأمان...');

  server.close(async () => {
    console.log('🔌 تم إيقاف الخادم');

    try {
      await mongoose.connection.close();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
      console.log('👋 مع السلامة!\n');
      process.exit(0);
    } catch (err) {
      console.error('❌ خطأ في إغلاق الاتصال:', err);
      process.exit(1);
    }
  });
});
