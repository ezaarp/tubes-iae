const express = require('express');
const cors = require('cors');
const db = require('./db');
const { authenticateToken, requireRole, optionalAuth } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Create Order (CUSTOMER only, authenticated)
app.post('/orders', authenticateToken, requireRole('CUSTOMER'), async (req, res) => {
    try {
        // Expects: { restaurantId, items: [{name, price, quantity}], userId }
        const { restaurantId, items } = req.body;
        const userId = req.user.userId; // Get from JWT token

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

// Get All Orders (role-based filtering)
app.get('/orders', optionalAuth, async (req, res) => {
    try {
        const allOrders = await db.getOrders();

        // Filter based on role
        let filteredOrders = allOrders;

        if (req.user) {
            if (req.user.role === 'CUSTOMER') {
                // Customer sees only their own orders
                filteredOrders = allOrders.filter(o => o.user_id === req.user.userId);
            } else if (req.user.role === 'OWNER') {
                // Owner sees orders for their restaurants
                const { restaurantIds } = req.query;
                if (restaurantIds) {
                    const ids = restaurantIds.split(',');
                    filteredOrders = allOrders.filter(o => ids.includes(String(o.restaurant_id)));
                }
            }
            // ADMIN sees all orders (no filtering)
        }

        res.json(filteredOrders);
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

// Update Order Status (OWNER/ADMIN only)
app.put('/orders/:id/status', authenticateToken, requireRole('OWNER', 'ADMIN'), async (req, res) => {
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


