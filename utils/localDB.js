const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure orders file exists
if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
}

const localDB = {
    // Save order locally
    saveOrder: async (orderData) => {
        try {
            const fileData = fs.readFileSync(ORDERS_FILE, 'utf8');
            const orders = JSON.parse(fileData);

            // Add mimic ID and timestamps
            const newOrder = {
                _id: 'local_' + Date.now().toString(),
                ...orderData,
                createdAt: new Date(),
                updatedAt: new Date(),
                isLocal: true
            };

            orders.unshift(newOrder); // Add to beginning
            fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
            console.log('⚠️ [Offline Mode] Order saved locally:', newOrder._id);
            return newOrder;
        } catch (error) {
            console.error('❌ Local DB Save Error:', error);
            throw error;
        }
    },

    // Get all orders
    getOrders: async () => {
        try {
            const fileData = fs.readFileSync(ORDERS_FILE, 'utf8');
            return JSON.parse(fileData);
        } catch (error) {
            return [];
        }
    }
};

module.exports = localDB;
