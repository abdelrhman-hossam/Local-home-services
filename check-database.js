// ====================================
// سكريبت التحقق من الاتصال بقاعدة البيانات
// Database Connection Test Script
// ====================================

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/local_home_services';

console.log('\n' + '='.repeat(60));
console.log('🔍 فحص الاتصال بقاعدة البيانات...');
console.log('='.repeat(60) + '\n');

console.log(`📡 محاولة الاتصال بـ: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')}\n`);

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // timeout بعد 5 ثواني
})
    .then(async () => {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!\n');
        console.log(`📊 اسم قاعدة البيانات: ${mongoose.connection.name}`);
        console.log(`🌐 المضيف: ${mongoose.connection.host}\n`);

        // عرض إحصائيات
        const Service = require('./models/Service');
        const Order = require('./models/Order');

        const servicesCount = await Service.countDocuments();
        const ordersCount = await Order.countDocuments();

        console.log('='.repeat(60));
        console.log('📈 إحصائيات قاعدة البيانات:');
        console.log('='.repeat(60));
        console.log(`📦 عدد الخدمات: ${servicesCount}`);
        console.log(`📋 عدد الطلبات: ${ordersCount}`);
        console.log('='.repeat(60) + '\n');

        if (servicesCount === 0) {
            console.log('⚠️  ملاحظة: قاعدة البيانات فارغة (لا توجد خدمات)');
            console.log('💡 يمكنك إضافة بيانات تجريبية بتشغيل: npm run setup\n');
        }

        await mongoose.connection.close();
        console.log('✅ تم إغلاق الاتصال بنجاح\n');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ فشل الاتصال بقاعدة البيانات!\n');
        console.error('تفاصيل الخطأ:', err.message, '\n');

        console.log('='.repeat(60));
        console.log('💡 الحلول المقترحة:');
        console.log('='.repeat(60));
        console.log('1. تأكد من تشغيل MongoDB محلياً (إذا كنت تستخدم قاعدة بيانات محلية)');
        console.log('2. تحقق من ملف .env والتأكد من صحة MONGODB_URI');
        console.log('3. إذا كنت تستخدم MongoDB Atlas:');
        console.log('   - تأكد من إضافة IP الخاص بك إلى Whitelist');
        console.log('   - تأكد من صحة اسم المستخدم وكلمة المرور');
        console.log('   - تأكد من وجود اتصال بالإنترنت');
        console.log('='.repeat(60) + '\n');

        process.exit(1);
    });
