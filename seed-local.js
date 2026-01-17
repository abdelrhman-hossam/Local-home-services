require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');
const User = require('./models/User');
// Import bcryptjs directly since User model hashes on save, but we might need manual control if we bypass
const bcrypt = require('bcryptjs');

// 1. Connection URI (Local)
const MONGODB_URI = 'mongodb://localhost:27017/local_home_services';

// 2. Data to Seed
const servicesData = [
    {
        name: 'تنظيف شامل للمنزل',
        description: 'خدمة تنظيف عميقة تشمل جميع الغرف، المطابخ، والحمامات بأحدث المعدات.',
        price: 500,
        image: 'photo_2025-12-19_22-22-04.jpg',
        category: 'نظافة'
    },
    {
        name: 'صيانة كهرباء',
        description: 'إصلاح جميع الأعطال الكهربائية، تركيب النجف، وصيانة اللوحات.',
        price: 200,
        image: 'photo_2025-12-19_22-22-15.jpg',
        category: 'صيانة'
    },
    {
        name: 'سباكة متكاملة',
        description: 'كشف التسريبات، تسليك البالوعات، وتركيب الأدوات الصحية.',
        price: 150,
        image: 'photo_2025-12-19_22-22-19.jpg',
        category: 'صيانة'
    },
    {
        name: 'مكافحة حشرات',
        description: 'رش آمن وفعال للقضاء على الصراصير، النمل، والقوارض.',
        price: 300,
        image: 'photo_2025-12-19_22-22-10.jpg',
        category: 'نظافة'
    },
    {
        name: 'نظافة خزانات',
        description: 'غسيل وتعقيم خزانات المياه العلوية والسفلية.',
        price: 400,
        image: 'photo_2025-12-19_22-22-04.jpg',
        category: 'نظافة'
    },
    {
        name: 'صيانة تكييف',
        description: 'غسيل، شحن فريون، وصيانة شاملة لجميع أنواع المكيفات.',
        price: 250,
        image: 'photo_2025-12-19_22-22-15.jpg',
        category: 'صيانة'
    }
];

// Admin User Data
const adminUser = {
    username: 'admin',
    email: 'admin@local.com',
    password: 'password123', // Will be hashed by pre-save hook
    phone: '01000000000',
    address: 'Cairo, Egypt',
    role: 'admin'
};

const seedDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to Local MongoDB');

        // Clear existing data
        await Service.deleteMany({});
        await User.deleteMany({}); // Optional: Clear users to reset admin
        console.log('🗑️  Cleared existing data');

        // Insert Services
        await Service.insertMany(servicesData);
        console.log('✅ Services seeded successfully');

        // Create Admin User
        // Note: We use User.create/new User to ensure pre-save hook runs for hashing
        await User.create(adminUser);
        console.log('✅ Admin user created (Email: admin@local.com, Pass: password123)');

        console.log('🎉 Database seeding completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding database:', err);
        process.exit(1);
    }
};

seedDB();
