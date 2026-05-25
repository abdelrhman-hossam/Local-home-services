// ====================================
// Routes الخاصة بالطلبات - Orders Routes
// ====================================
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { protect, authorize } = require("../middleware/auth");

// ====================================
// ✅ FIX API5 - Broken Function Level Authorization
// GET /api/orders - للأدمن فقط (مش لأي مستخدم)
// ====================================
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const orders = await Order.find().sort({ order_date: -1 });
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    console.error("❌ خطأ في جلب الطلبات:", err);
    res.status(500).json({
      success: false,
      message: "حصل خطأ في جلب الطلبات",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// ====================================
// ✅ GET - جلب طلبات المستخدم الحالي فقط
// @route   GET /api/orders/my-orders
// @access  Private (logged in user)
// ====================================
router.get("/my-orders", protect, async (req, res) => {
  try {
    // يجلب فقط الطلبات المرتبطة بالـ user الحالي عن طريق الـ userId المحفوظ
    const orders = await Order.find({ userId: req.user._id }).sort({ order_date: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "خطأ في جلب طلباتك",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// ====================================
// @desc    إنشاء طلب جديد
// @route   POST /api/orders
// @access  Public (العملاء بدون حساب)
// ====================================
router.post("/", async (req, res) => {
  try {
    // ✅ استخراج الحقول المسموح بها فقط - Mass Assignment Protection
    const { user_name, user_phone, user_address, user_email, serviceId, paymentMethod } = req.body;

    // التحقق من وجود البيانات المطلوبة
    if (!user_name || !user_phone || !user_address || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة (الاسم، الهاتف، العنوان، الخدمة)"
      });
    }

    // إعداد كائن الطلب - فقط الحقول المسموح بها
    const orderData = {
      user_name,
      user_phone,
      user_address,
      user_email,
      serviceId: Array.isArray(serviceId) ? serviceId : [serviceId],
      paymentMethod: paymentMethod || "كاش",
      order_date: new Date(),
      status: "جديد", // ✅ الـ status دائماً "جديد" - لا يقبل من المستخدم
      totalAmount: 0
    };

    // ربط الطلب بالمستخدم إذا كان مسجلاً
    // (اختياري - لمن يملك حساب)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const secret = process.env.JWT_SECRET || "raya_dev_secret_key_NOT_FOR_PRODUCTION_2026";
        const decoded = jwt.verify(authHeader.split(" ")[1], secret);
        orderData.userId = decoded.id;
      } catch (_) {
        // التوكن غير صالح - نكمل بدونه (guest order)
      }
    }

    let savedOrder;

    try {
      if (mongoose.connection.readyState === 1) {
        const Service = require("../models/Service");
        const services = await Service.find({ _id: { $in: orderData.serviceId } });
        orderData.totalAmount = services.reduce((acc, s) => acc + s.price, 0);

        const order = new Order(orderData);
        savedOrder = await order.save();
      } else {
        throw new Error("DB Disconnected");
      }
    } catch (dbError) {
      console.warn("⚠️ فشل الحفظ في قاعدة البيانات (Offline Mode)");

      savedOrder = {
        _id: "offline_" + Date.now(),
        ...orderData,
        totalAmount: orderData.totalAmount || 500,
        status: "جديد (محلي)",
        paymentStatus: paymentMethod === "كاش" ? "غير مدفوع" : "مدفوع (محاكاة)",
        createdAt: new Date(),
        updatedAt: new Date(),
        isMock: true
      };
    }

    // إرسال إشعار بريد إلكتروني (محاولة)
    try {
      const sendEmail = require("../utils/email");
      if (user_email) {
        await sendEmail({
          email: user_email,
          subject: "تم استلام طلبك بنجاح - رعاية للمهام المنزلية",
          html: `<h1>أهلاً بك يا ${user_name}</h1><p>لقد تلقينا طلبك وسنتواصل معك قريباً.</p>`
        });
      }
    } catch (emailErr) {
      console.error("❌ فشل إرسال البريد:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "تم استلام الطلب بنجاح! سيتم التواصل معك قريباً.",
      data: savedOrder
    });

  } catch (err) {
    console.error("❌ خطأ في إنشاء الطلب:", err);
    res.status(500).json({
      success: false,
      message: "حصل خطأ في الطلب",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// ====================================
// ✅ FIX API1 - BOLA: جلب طلب محدد
// المستخدم يقدر يشوف طلبه بس - الأدمن يشوف أي طلب
// @route   GET /api/orders/:id
// @access  Private
// ====================================
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("serviceId");

    if (!order) {
      return res.status(404).json({ success: false, message: "الطلب غير موجود" });
    }

    // ✅ BOLA Check: الأدمن يشوف أي طلب، المستخدم يشوف طلبه بس
    const isAdmin = req.user.role === "admin";
    const isOwner = order.userId && order.userId.toString() === req.user._id.toString();
    const isEmailMatch = order.user_email && order.user_email === req.user.email;

    if (!isAdmin && !isOwner && !isEmailMatch) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالاطلاع على هذا الطلب"
      });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "خطأ في جلب بيانات الطلب",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

module.exports = router;
