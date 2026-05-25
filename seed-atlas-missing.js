const mongoose = require('mongoose');
const Service = require('./models/Service');

const MONGODB_URI = "mongodb+srv://abderlrhman:Abdo11223344@cluster0.dckvued.mongodb.net/local_home_services?retryWrites=true&w=majority";

const additionalServices = [
    {
        name: 'تنظيف شامل للمنزل',
        description: 'خدمة تنظيف عميقة تشمل جميع الغرف، المطابخ، والحمامات بأحدث المعدات.',
        price: 500
    },
    {
        name: 'مكافحة حشرات',
        description: 'رش آمن وفعال للقضاء على الصراصير، النمل، والقوارض.',
        price: 300
    },
    {
        name: 'نظافة خزانات',
        description: 'غسيل وتعقيم خزانات المياه العلوية والسفلية.',
        price: 400
    },
    {
        name: 'صيانة تكييف',
        description: 'غسيل، شحن فريون، وصيانة شاملة لجميع أنواع المكيفات.',
        price: 250
    }
];

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to Atlas.');
        
        // Loop through and only add if they don't exist
        for (const s of additionalServices) {
            const exists = await Service.findOne({ name: s.name });
            if (!exists) {
                await Service.create(s);
                console.log(`Added: ${s.name}`);
            } else {
                console.log(`Already exists: ${s.name}`);
            }
        }
        
        console.log('Done!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
