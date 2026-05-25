require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function checkAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ متصل بقاعدة البيانات...");
        
        const admins = await User.find({ role: "admin" }).select("username email createdAt");
        
        console.log(`\n🔍 وجدنا ${admins.length} مديرين (Admins) في النظام:\n`);
        
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. الاسم: ${admin.username} | الإيميل: ${admin.email} | تاريخ التسجيل: ${admin.createdAt}`);
        });

        console.log("\n==================================");
        process.exit(0);
    } catch (err) {
        console.error("❌ حدث خطأ:", err);
        process.exit(1);
    }
}

checkAdmins();
