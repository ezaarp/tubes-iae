const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Get all restaurants
app.get('/restaurants', async (req, res) => {
    try {
        const restaurants = await db.getRestaurants();
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get restaurant by ID
app.get('/restaurants/:id', async (req, res) => {
    try {
        const restaurant = await db.getRestaurantById(req.params.id);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        
        const menus = await db.getMenusByRestaurantId(req.params.id);
        res.json({ ...restaurant, menus });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Restaurant Service running on port ${PORT}`);
});


