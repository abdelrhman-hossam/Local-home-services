require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');
const Order = require('./models/Order');
const Review = require('./models/Review');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('\n' + '='.repeat(60));
console.log('🎓 بدء إعداد قاعدة بيانات مشروع التخرج المتقدمة...');
console.log('='.repeat(60) + '\n');

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

        // حذف البيانات القديمة لضمان نظافة قاعدة البيانات
        console.log('🗑️ جاري مسح البيانات السابقة (للبدء على النظيف)...');
        await User.deleteMany({});
        await Service.deleteMany({});
        await Order.deleteMany({});
        await Review.deleteMany({});
        console.log('✅ تم تهيئة قاعدة البيانات\n');

        // 1. إنشاء المستخدمين
        console.log('👤 جاري إضافة المستخدمين (مديرين وعملاء)...');
        const users = [
            { username: 'admin', email: 'admin@system.com', password: 'password123', role: 'admin' },
            { username: 'ahmed_ali', email: 'ahmed@gmail.com', password: 'password123', role: 'user' },
            { username: 'sara_kh', email: 'sara@gmail.com', password: 'password123', role: 'user' },
            { username: 'mohamed_hs', email: 'mohamed@gmail.com', password: 'password123', role: 'user' }
        ];
        const createdUsers = await User.create(users);
        console.log(`✅ تم إضافة ${createdUsers.length} مستخدمين بنجاح\n`);

        // 2. إنشاء الخدمات
        console.log('🛠️ جاري إضافة الخدمات المتنوعة...');
        const services = [
            // النظافة
            { name: 'تنظيف شامل للمنزل VIP', description: 'باقة تنظيف عميق تشمل تلميع الأرضيات، غسيل السجاد، وتعقيم الحمامات والمطابخ بفريق متخصص.', price: 450, department_id: new mongoose.Types.ObjectId() },
            { name: 'تنظيف وتلميع الواجهات', description: 'تنظيف الواجهات الزجاجية والحجرية بأحدث المعدات ومواد التلميع الخاصة.', price: 300, department_id: new mongoose.Types.ObjectId() },
            // الصيانة
            { name: 'تأسيس وتشطيب الكهرباء', description: 'تأسيس شبكات الكهرباء بالكامل أو صيانتها وكشف الأعطال باستخدام أجهزة متطورة.', price: 250, department_id: new mongoose.Types.ObjectId() },
            { name: 'صيانة سباكة طارئة', description: 'حل مشاكل تسرب المياه واستبدال المواسير التالفة وتركيب أطقم الحمامات.', price: 150, department_id: new mongoose.Types.ObjectId() },
            { name: 'غسيل وصيانة تكييفات', description: 'تنظيف الفلاتر، شحن الفريون، وإصلاح تسريبات التكييفات الاسبليت والمركزية.', price: 200, department_id: new mongoose.Types.ObjectId() },
            // أخرى
            { name: 'مكافحة الحشرات والقوارض', description: 'إبادة تامة للحشرات والقوارض بمبيدات آمنة وفعالة مع ضمان لمدة 6 أشهر.', price: 350, department_id: new mongoose.Types.ObjectId() },
            { name: 'نقل وتركيب العفش', description: 'فك، تغليف، نقل، وإعادة تركيب الأثاث بسيارات مجهزة وعمالة مدربة.', price: 800, department_id: new mongoose.Types.ObjectId() }
        ];
        const createdServices = await Service.insertMany(services);
        console.log(`✅ تم إضافة ${createdServices.length} خدمات بنجاح\n`);

        // 3. إنشاء الطلبات
        console.log('📦 جاري إضافة الطلبات بالحالات المختلفة...');
        const orders = [
            {
                user_name: 'أحمد علي', user_phone: '01001234567', user_address: 'القاهرة، مصر الجديدة، شارع الحجاز',
                serviceId: [createdServices[0]._id, createdServices[4]._id],
                order_date: new Date(), status: 'جديد'
            },
            {
                user_name: 'سارة خالد', user_phone: '01112345678', user_address: 'الجيزة، السادس من أكتوبر، الحي المتميز',
                serviceId: [createdServices[3]._id],
                order_date: new Date(Date.now() - 86400000), status: 'قيد التنفيذ'
            },
            {
                user_name: 'محمد حسن', user_phone: '01223456789', user_address: 'الأسكندرية، سموحة',
                serviceId: [createdServices[5]._id],
                order_date: new Date(Date.now() - 172800000), status: 'مكتمل'
            }
        ];
        const createdOrders = await Order.insertMany(orders);
        console.log(`✅ تم إضافة ${createdOrders.length} طلبات بنجاح\n`);

        // 4. إنشاء التقييمات
        console.log('⭐ جاري إضافة التقييمات الواقعية...');
        const reviews = [
            { service: createdServices[0]._id, user: createdUsers[1]._id, user_name: 'أحمد علي', rating: 5, comment: 'فريق العمل كان محترف جداً، التنظيف تم على أكمل وجه والبيت أصبح كأنه جديد. شكراً لكم.' },
            { service: createdServices[3]._id, user: createdUsers[2]._id, user_name: 'سارة خالد', rating: 4, comment: 'السباك وصل في الموعد المحدد وحل المشكلة بسرعة وسعره كان مناسباً.' },
            { service: createdServices[4]._id, user_name: 'عميل غير مسجل', rating: 5, comment: 'تكييف الصالة كان يسرب مياهاً، تم حله في نصف ساعة والتبريد ممتاز الآن.' }
        ];
        const createdReviews = await Review.insertMany(reviews);
        console.log(`✅ تم إضافة ${createdReviews.length} تقييمات بنجاح\n`);

        console.log('='.repeat(60));
        console.log('🎉 تم إنشاء قاعدة البيانات الخاصة بمشروع التخرج بنجاح!');
        console.log(`- المستخدمين: ${createdUsers.length} (يمكنك تسجيل الدخول بـ admin@system.com ورمز password123)`);
        console.log(`- الخدمات: ${createdServices.length}`);
        console.log(`- الطلبات: ${createdOrders.length}`);
        console.log(`- التقييمات: ${createdReviews.length}`);
        console.log('='.repeat(60) + '\n');

        await mongoose.connection.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ حدث خطأ:', err);
        process.exit(1);
    });
