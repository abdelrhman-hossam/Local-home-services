// ====================================
// نموذج الخدمات - Service Model
// ====================================
const mongoose = require("mongoose");

// تعريف Schema للخدمات
const ServiceSchema = new mongoose.Schema({
  // اسم الخدمة
  name: {
    type: String,
    required: [true, "اسم الخدمة مطلوب"],
    trim: true,
    minlength: [3, "اسم الخدمة يجب أن يكون 3 أحرف على الأقل"]
  },

  // وصف الخدمة
  description: {
    type: String,
    required: [true, "وصف الخدمة مطلوب"],
    trim: true,
    minlength: [10, "الوصف يجب أن يكون 10 أحرف على الأقل"]
  },

  // سعر الخدمة
  price: {
    type: Number,
    required: [true, "سعر الخدمة مطلوب"],
    min: [0, "السعر يجب أن يكون موجب"],
  },

  // معرف القسم (Department)
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department' // للربط مع نموذج الأقسام في المستقبل
  }
}, {
  // إضافة timestamps تلقائياً (createdAt, updatedAt)
  timestamps: true
});

// إنشاء فهرس (Index) على اسم الخدمة لتحسين الأداء
ServiceSchema.index({ name: 1 });

module.exports = mongoose.model("Service", ServiceSchema);

