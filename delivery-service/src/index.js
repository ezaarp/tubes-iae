const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// Assign Driver
app.post('/delivery/assign', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ error: 'orderId required' });

        const delivery = await db.assignDriver(orderId);
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


