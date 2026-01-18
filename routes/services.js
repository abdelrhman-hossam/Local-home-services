// ====================================
// Routes الخاصة بالخدمات - Services Routes
// ====================================
const express = require("express");
const router = express.Router();
const Service = require("../models/Service");

// ====================================
// GET - جلب جميع الخدمات
// ====================================
router.get("/", async (req, res) => {
  try {
    // جلب جميع الخدمات من قاعدة البيانات
    const services = await Service.find();

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (err) {
    console.error("❌ خطأ في جلب الخدمات (أو قاعدة البيانات مفصولة):", err.message);

    // Fallback: Return Mock Services immediately (Offline Mode)
    const mockServices = [
      { _id: 'mock1', name: 'تنظيف شامل للمنزل', description: 'تنظيف عميق وشامل لجميع الغرف', price: 500 },
      { _id: 'mock2', name: 'صيانة كهرباء', description: 'إصلاح جميع الأعطال الكهربائية بأمان', price: 200 },
      { _id: 'mock3', name: 'صيانة سباكة', description: 'حل مشاكل التسريب والانسداد', price: 150 },
      { _id: 'mock4', name: 'مكافحة حشرات', description: 'قضاء تام على الحشرات بمواد آمنة', price: 300 },
      { _id: 'mock5', name: 'نظافة خزانات', description: 'غسيل وتعقيم خزانات المياه', price: 400 },
      { _id: 'mock6', name: 'صيانة تكييف', description: 'غسيل وشحن فريون وصيانة', price: 250 }
    ];

    res.json({
      success: true,
      count: mockServices.length,
      data: mockServices,
      isMock: true
    });
  }
});

module.exports = router;


