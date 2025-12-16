const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5003;
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:5002';

app.use(cors());
app.use(express.json());

// Assign Driver
app.post('/delivery/assign', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ error: 'orderId required' });

        const delivery = await db.assignDriver(orderId);

        // Auto-complete delivery after 5 seconds
        setTimeout(async () => {
            try {
                console.log(`🚚 Auto-completing delivery for order ${orderId}...`);
                await axios.put(`${ORDER_SERVICE_URL}/orders/${orderId}/status`, {
                    status: 'DELIVERED'
                });
                console.log(`✅ Order ${orderId} marked as DELIVERED`);
            } catch (err) {
                console.error(`❌ Failed to auto-complete order ${orderId}:`, err.message);
            }
        }, 5000); // 5 seconds delay

        res.json(delivery);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Delivery Info
app.get('/delivery/:orderId', async (req, res) => {
    try {
        const delivery = await db.getDeliveryByOrderId(req.params.orderId);
        if (!delivery) return res.status(404).json({ status: 'SEARCHING_DRIVER' });
        res.json(delivery);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Delivery Service running on port ${PORT}`);
});


