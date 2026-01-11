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
    console.error("❌ خطأ في جلب الخدمات:", err);
    res.status(500).json({
      success: false,
      message: "حصل خطأ في جلب الخدمات",
      error: err.message
    });
  }
});

module.exports = router;


