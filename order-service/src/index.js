const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Create Order
app.post('/orders', async (req, res) => {
    try {
        // Expects: { restaurantId, items: [{name, price, quantity}], userId }
        const { restaurantId, items, userId } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items provided' });
        }

        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const order = await db.createOrder({
            restaurant_id: restaurantId,
            user_id: userId,
            items,
            total_price: total
        });

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Orders
app.get('/orders', async (req, res) => {
    try {
        const orders = await db.getOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Order by ID
app.get('/orders/:id', async (req, res) => {
    try {
        const order = await db.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Order Status
app.put('/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await db.updateOrderStatus(req.params.id, status);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Order Service running on port ${PORT}`);
});


