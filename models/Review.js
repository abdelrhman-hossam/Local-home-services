// ====================================
// نموذج التقييمات - Review Model
// ====================================
const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    // الخدمة المقيمة
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },

    // المستخدم (اختياري، يمكن أن يكون مجهول أو بالاسم فقط)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    user_name: {
        type: String,
        required: [true, "اسم المستخدم مطلوب"]
    },

    // التقييم (1-5)
    rating: {
        type: Number,
        required: [true, "التقييم مطلوب"],
        min: 1,
        max: 5
    },

    // التعليق
    comment: {
        type: String,
        required: [true, "التعليق مطلوب"],
        minlength: [5, "التعليق يجب أن يكون 5 أحرف على الأقل"]
    }
}, {
    timestamps: true
});

// منع تكرار التقييم من نفس المستخدم لنفس الخدمة (إذا كان مسجلاً)
ReviewSchema.index({ service: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);
