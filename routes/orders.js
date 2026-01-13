// ====================================
// Routes الخاصة بالطلبات - Orders Routes
// ====================================
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

// ====================================
// GET - جلب جميع الطلبات
// ====================================
router.get("/", async (req, res) => {
  try {
    // جلب جميع الطلبات من قاعدة البيانات مع ترتيبها حسب الأحدث
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
      error: err.message
    });
  }
});

// ====================================
// GET - جلب طلبات المستخدم الحالي
// ====================================
router.get("/my-orders", protect, async (req, res) => {
  try {
    // جلب الطلبات المرتبطة ببريد المستخدم أو هاتفه
    const orders = await Order.find({
      $or: [
        { user_email: req.user.email },
        { user_phone: req.user.phone }
      ]
    }).sort({ order_date: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "خطأ في جلب طلباتك" });
  }
});

// @desc    إنشاء طلب جديد
// @route   POST /api/orders
router.post("/", async (req, res) => {
  try {
    // استخراج البيانات من الطلب
    const { user_name, user_phone, user_address, user_email, serviceId, paymentMethod } = req.body;

    // التحقق من وجود البيانات المطلوبة
    if (!user_name || !user_phone || !user_address || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة (الاسم، الهاتف، العنوان، الخدمة)"
      });
    }

    // إنشاء طلب جديد
    const order = new Order({
      user_name,
      user_phone,
      user_address,
      user_email,
      serviceId: Array.isArray(serviceId) ? serviceId : [serviceId],
      paymentMethod: paymentMethod || "كاش",
      order_date: new Date(),
      status: "جديد"
    });

    // حفظ الطلب في قاعدة البيانات
    await order.save();

    // إرسال إشعار بريد إلكتروني (محاولة)
    try {
      const sendEmail = require("../utils/email");

      // إرسال للعميل
      if (user_email) {
        await sendEmail({
          email: user_email,
          subject: "تم استلام طلبك بنجاح - رعاية للمهام المنزلية",
          html: `<h1>أهلاً بك يا ${user_name}</h1><p>لقد تلقينا طلبك وسنتواصل معك قريباً.</p><p>تفاصيل الطلب: ${user_address}</p>`
        });
      }

      // إرسال للمدير (مثال)
      await sendEmail({
        email: "admin@raya.com",
        subject: "طلب خدمة جديد 🆕",
        html: `<h3>طلب جديد من ${user_name}</h3><p>الهاتف: ${user_phone}</p><p>العنوان: ${user_address}</p>`
      });

    } catch (emailErr) {
      console.error("❌ فشل إرسال البريد:", emailErr.message);
      // لا نعيد خطأ للعميل لأن الطلب تم حفظه فعلياً
    }

    console.log(`✅ تم استلام طلب جديد من: ${user_name}`);

    res.status(201).json({
      success: true,
      message: "تم استلام الطلب بنجاح! سيتم التواصل معك قريباً عبر الهاتف أو البريد.",
      data: order
    });
  } catch (err) {
    console.error("❌ خطأ في إنشاء الطلب:", err);
    res.status(500).json({
      success: false,
      message: "حصل خطأ في الطلب",
      error: err.message
    });
  }
});

module.exports = router;



