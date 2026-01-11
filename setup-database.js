// ====================================
// سكريبت إعداد قاعدة البيانات
// Database Setup Script
// ====================================
// هذا السكريبت يقوم بإنشاء بيانات تجريبية في قاعدة البيانات

require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');
const Order = require('./models/Order');

// الاتصال بقاعدة البيانات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/local_home_services';

console.log('\n' + '='.repeat(60));
console.log('🔧 بدء إعداد قاعدة البيانات...');
console.log('='.repeat(60) + '\n');

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

        // حذف البيانات القديمة (اختياري - احذف السطرين التاليين إذا كنت تريد الحفاظ على البيانات)
        // await Service.deleteMany({});
        // await Order.deleteMany({});
        // console.log('🗑️  تم حذف البيانات القديمة\n');

        // ====================================
        // إنشاء خدمات تجريبية
        // ====================================
        console.log('📝 إضافة خدمات تجريبية...');

        const services = [
            // خدمات النظافة
            {
                name: 'تنظيف شامل للمنزل',
                description: 'تنظيف شامل لجميع غرف المنزل بما في ذلك الأرضيات والنوافذ والحمامات',
                price: 250,
                department_id: new mongoose.Types.ObjectId()
            },
            {
                name: 'تنظيف المطبخ',
                description: 'تنظيف المطبخ بالكامل مع تنظيف الأجهزة والأسطح',
                price: 150,
                department_id: new mongoose.Types.ObjectId()
            },
            {
                name: 'تنظيف الحمامات',
                description: 'تنظيف وتعقيم الحمامات والأدوات الصحية',
                price: 100,
                department_id: new mongoose.Types.ObjectId()
            },
            {
                name: 'غسيل السجاد والموكيت',
                description: 'غسيل وتعقيم السجاد والموكيت باستخدام أحدث المعدات',
                price: 200,
                department_id: new mongoose.Types.ObjectId()
            },

            // خدمات الصيانة
            {
                name: 'صيانة الكهرباء',
                description: 'إصلاح الأعطال الكهربائية وتركيب المفاتيح والإضاءة',
                price: 180,
                department_id: new mongoose.Types.ObjectId()
            },
            {
                name: 'صيانة السباكة',
                description: 'إصلاح تسريبات المياه وصيانة المواسير والصنابير',
                price: 160,
                department_id: new mongoose.Types.ObjectId()
            },
            {
                name: 'صيانة أجهزة التكييف',
                description: 'صيانة وتنظيف أجهزة التكييف وشحن الفريون',
                price: 220,
                department_id: new mongoose.Types.ObjectId()
            },
            {
                name: 'صيانة الأجهزة المنزلية',
                description: 'إصلاح الثلاجات والغسالات وأجهزة المطبخ',
                price: 200,
                department_id: new mongoose.Types.ObjectId()
            },
            {
                name: 'النجارة',
                description: 'إصلاح وتركيب الأبواب والشبابيك والأثاث الخشبي',
                price: 175,
                department_id: new mongoose.Types.ObjectId()
            },
            {
                name: 'الدهانات',
                description: 'دهان الجدران والأسقف بأحدث أنواع الدهانات',
                price: 300,
                department_id: new mongoose.Types.ObjectId()
            }
        ];

        const createdServices = await Service.insertMany(services);
        console.log(`✅ تم إضافة ${createdServices.length} خدمة بنجاح\n`);

        // ====================================
        // إنشاء طلبات تجريبية
        // ====================================
        console.log('📝 إضافة طلبات تجريبية...');

        const orders = [
            {
                user_name: 'أحمد محمد',
                user_phone: '01012345678',
                user_address: 'القاهرة، مدينة نصر، شارع عباس العقاد',
                serviceId: [createdServices[0]._id, createdServices[1]._id],
                order_date: new Date(),
                status: 'جديد'
            },
            {
                user_name: 'فاطمة علي',
                user_phone: '01123456789',
                user_address: 'الجيزة، المهندسين، شارع جامعة الدول العربية',
                serviceId: [createdServices[4]._id],
                order_date: new Date(Date.now() - 86400000), // قبل يوم
                status: 'قيد التنفيذ'
            },
            {
                user_name: 'محمود حسن',
                user_phone: '01234567890',
                user_address: 'الإسكندرية، سموحة، شارع فوزي معاذ',
                serviceId: [createdServices[6]._id, createdServices[7]._id],
                order_date: new Date(Date.now() - 172800000), // قبل يومين
                status: 'مكتمل'
            }
        ];

        const createdOrders = await Order.insertMany(orders);
        console.log(`✅ تم إضافة ${createdOrders.length} طلب تجريبي بنجاح\n`);

        // ====================================
        // عرض ملخص البيانات
        // ====================================
        console.log('='.repeat(60));
        console.log('📊 ملخص قاعدة البيانات:');
        console.log('='.repeat(60));

        const totalServices = await Service.countDocuments();
        const totalOrders = await Order.countDocuments();

        console.log(`📦 إجمالي الخدمات: ${totalServices}`);
        console.log(`📋 إجمالي الطلبات: ${totalOrders}`);

        console.log('\n✅ تم إعداد قاعدة البيانات بنجاح!\n');
        console.log('💡 لعرض الخدمات: GET http://localhost:5000/api/services');
        console.log('💡 لعرض الطلبات: GET http://localhost:5000/api/orders (يحتاج إضافة route)\n');
        console.log('='.repeat(60) + '\n');

        // إغلاق الاتصال
        await mongoose.connection.close();
        console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات\n');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ خطأ في إعداد قاعدة البيانات:', err);
        process.exit(1);
    });
