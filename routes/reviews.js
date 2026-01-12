// ====================================
// مسارات التقييمات - Review Routes
// ====================================
const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Service = require("../models/Service");
const { protect } = require("../middleware/auth");

// @desc    جلب تقييمات خدمة معينة
// @route   GET /api/reviews/:serviceId
router.get("/:serviceId", async (req, res) => {
    try {
        const reviews = await Review.find({ service: req.params.serviceId }).sort("-createdAt");
        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    إضافة تقييم جديد
// @route   POST /api/reviews
router.post("/", protect, async (req, res) => {
    try {
        req.body.user = req.user.id;
        req.body.user_name = req.user.username;

        // التحقق من وجود الخدمة
        const service = await Service.findById(req.body.service);
        if (!service) {
            return res.status(404).json({ success: false, message: "الخدمة غير موجودة" });
        }

        // إضافة التقييم
        const review = await Review.create(req.body);

        // تحديث متوسط التقييم للخدمة
        const reviews = await Review.find({ service: req.body.service });
        const averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        await Service.findByIdAndUpdate(req.body.service, {
            averageRating: averageRating.toFixed(1),
            numOfReviews: reviews.length
        });

        res.status(201).json({ success: true, data: review });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "لقد قمت بتقييم هذه الخدمة مسبقاً" });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
