// ====================================
// نموذج الطلبات - Order Model
// ====================================
const mongoose = require("mongoose");

// تعريف Schema للطلبات
const OrderSchema = new mongoose.Schema({
  // اسم المستخدم
  user_name: {
    type: String,
    required: [true, "اسم المستخدم مطلوب"],
    trim: true,
    minlength: [2, "الاسم يجب أن يكون حرفين على الأقل"]
  },

  // رقم هاتف المستخدم
  user_phone: {
    type: String,
    required: [true, "رقم الهاتف مطلوب"],
    trim: true,
    match: [/^(010|011|012|015)\d{8}$/, "رقم الهاتف غير صحيح"]
  },

  // عنوان المستخدم
  user_address: {
    type: String,
    required: [true, "العنوان مطلوب"],
    trim: true,
    minlength: [10, "العنوان يجب أن يكون 10 أحرف على الأقل"]
  },

  // البريد الإلكتروني (اختياري للعميل)
  user_email: {
    type: String,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "البريد الإلكتروني غير صحيح"]
  },

  // مصفوفة الخدمات المطلوبة
  serviceId: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Service', // للربط مع نموذج الخدمات
    required: [true, "يجب اختيار خدمة واحدة على الأقل"],
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: "يجب اختيار خدمة واحدة على الأقل"
    }
  },

  // تاريخ الطلب
  order_date: {
    type: Date,
    default: Date.now
  },

  // حالة الطلب
  status: {
    type: String,
    default: "جديد",
    enum: {
      values: ["جديد", "قيد التنفيذ", "مكتمل", "ملغي"],
      message: "حالة الطلب غير صحيحة"
    }
  }
}, {
  // إضافة timestamps تلقائياً (createdAt, updatedAt)
  timestamps: true
});

// إنشاء فهارس (Indexes) لتحسين الأداء
OrderSchema.index({ order_date: -1 }); // ترتيب حسب التاريخ
OrderSchema.index({ status: 1 });       // للبحث حسب الحالة
OrderSchema.index({ user_phone: 1 });   // للبحث برقم الهاتف

module.exports = mongoose.model("Order", OrderSchema);

