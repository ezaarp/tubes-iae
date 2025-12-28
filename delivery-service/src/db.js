require('dotenv').config();
const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    throw new Error('Missing Redis URL. Please set REDIS_URL in .env');
}

let redisClient;

async function connectRedis() {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }

    try {
        redisClient = redis.createClient({
            url: REDIS_URL
        });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));

        await redisClient.connect();
        console.log('Connected to Redis');
        return redisClient;
    } catch (error) {
        console.error('Redis connection failed:', error);
        throw error;
    }
}

// Assign driver to order
async function assignDriver(orderId) {
    const client = await connectRedis();

    // 3 Specific Drivers available for assignment
    const drivers = [
        'Andi (Motor 1)',
        'Budi (Motor 2)',
        'Citra (Motor 3)'
    ];
    const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];

    const delivery = {
        orderId: orderId,
        driverName: randomDriver,
        status: 'ON_THE_WAY',
        estimatedTime: '15 mins'
    };

    // Store in Redis with hash
    const key = `delivery:${orderId}`;
    await client.hSet(key, {
        orderId: delivery.orderId,
        driverName: delivery.driverName,
        status: delivery.status,
        estimatedTime: delivery.estimatedTime
    });

    // Set expiry to 24 hours
    await client.expire(key, 86400);

    return delivery;
}

// Get delivery by order ID
async function getDeliveryByOrderId(orderId) {
    const client = await connectRedis();
    const key = `delivery:${orderId}`;

    const delivery = await client.hGetAll(key);

    if (!delivery || Object.keys(delivery).length === 0) {
        return null;
    }

    return {
        orderId: delivery.orderId,
        driverName: delivery.driverName,
        status: delivery.status,
        estimatedTime: delivery.estimatedTime
    };
}

module.exports = {
    connectRedis,
    assignDriver,
    getDeliveryByOrderId
};
