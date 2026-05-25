const mongoose = require('mongoose');
const Service = require('./models/Service');

const MONGODB_URI = "mongodb+srv://abderlrhman:Abdo11223344@cluster0.dckvued.mongodb.net/local_home_services?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to Atlas.');
        const services = await Service.find({});
        console.log('Services in DB:', services);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
