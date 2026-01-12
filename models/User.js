// ====================================
// نموذج المستخدمين - User Model
// ====================================
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    // اسم المستخدم
    username: {
        type: String,
        required: [true, "اسم المستخدم مطلوب"],
        unique: true,
        trim: true,
        minlength: [3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"]
    },

    // البريد الإلكتروني
    email: {
        type: String,
        required: [true, "البريد الإلكتروني مطلوب"],
        unique: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "البريد الإلكتروني غير صحيح"]
    },

    // كلمة المرور
    password: {
        type: String,
        required: [true, "كلمة المرور مطلوبة"],
        minlength: [6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"],
        select: false // لا تظهر كلمة المرور بشكل افتراضي عند جلب البيانات
    },

    // الدور (مستخدم عادي أو مدير)
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }
}, {
    timestamps: true
});

// تشفير كلمة المرور قبل الحفظ
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// ميثود لمقارنة كلمة المرور
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
