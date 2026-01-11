// ====================================
// Routes الخاصة بالطلبات - Orders Routes
// ====================================
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

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
// POST - إنشاء طلب جديد
// ====================================
router.post("/", async (req, res) => {
  try {
    // استخراج البيانات من الطلب
    const { user_name, user_phone, user_address, serviceId } = req.body;

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
      serviceId: Array.isArray(serviceId) ? serviceId : [serviceId], // تحويل إلى array إذا لم يكن
      order_date: new Date(),
      status: "جديد"
    });

    // حفظ الطلب في قاعدة البيانات
    await order.save();

    console.log(`✅ تم استلام طلب جديد من: ${user_name}`);

    res.status(201).json({
      success: true,
      message: "تم استلام الطلب بنجاح! سيتم التواصل معك قريباً.",
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



