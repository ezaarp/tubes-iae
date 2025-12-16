require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const {
    createUser,
    findUserByEmail,
    findUserById,
    createRestaurantRequest,
    getRestaurantRequests,
    updateRestaurantRequestStatus,
    createRestaurantOwner,
    getRestaurantsByOwnerId
} = require('./db');
const { generateTokens, verifyToken } = require('./auth');
const { authenticateToken, requireRole } = require('./middleware');
const {
    registerValidation,
    loginValidation,
    registerOwnerValidation,
    handleValidationErrors
} = require('./validators');

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
});

// Register customer
app.post('/auth/register', registerValidation, handleValidationErrors, async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Check if user exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await createUser({ email, passwordHash, name, role: role || 'CUSTOMER' });

        // Generate tokens
        const tokens = generateTokens(user);

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            ...tokens
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// Register owner (with restaurant request)
app.post('/auth/register-owner', registerOwnerValidation, handleValidationErrors, async (req, res) => {
    try {
        const { email, password, name, restaurantName, restaurantDescription } = req.body;

        // Check if user exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user with OWNER role
        const user = await createUser({ email, passwordHash, name, role: 'OWNER' });

        // Create restaurant request
        const request = await createRestaurantRequest({
            userId: user.id,
            name: restaurantName,
            description: restaurantDescription || ''
        });

        // Generate tokens
        const tokens = generateTokens(user);

        res.status(201).json({
            message: 'Owner registration successful. Restaurant request pending approval.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            restaurantRequest: {
                id: request.id,
                name: request.name,
                status: request.status
            },
            ...tokens
        });
    } catch (error) {
        console.error('Owner registration error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// Login
app.post('/auth/login', loginValidation, handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Get restaurant IDs if owner
        let restaurantIds = [];
        if (user.role === 'OWNER') {
            restaurantIds = await getRestaurantsByOwnerId(user.id);
        }

        // Generate tokens
        const tokens = generateTokens(user);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                restaurantIds: restaurantIds
            },
            ...tokens
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// Refresh token
app.post('/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        // Verify refresh token
        const decoded = verifyToken(refreshToken);

        if (decoded.type !== 'refresh') {
            return res.status(400).json({ error: 'Invalid token type' });
        }

        // Get user
        const user = await findUserById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        res.json({
            message: 'Token refreshed',
            ...tokens
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
});

// Get current user
app.get('/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await findUserById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get restaurant IDs if owner
        let restaurantIds = [];
        if (user.role === 'OWNER') {
            restaurantIds = await getRestaurantsByOwnerId(user.id);
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            restaurantIds: restaurantIds
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// Verify token (for other services)
app.get('/auth/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Create restaurant request (Authenticated OWNER)
app.post('/auth/restaurant-request', authenticateToken, requireRole('OWNER'), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Restaurant name is required' });
        }

        const request = await createRestaurantRequest({
            userId: req.user.userId,
            name,
            description: description || ''
        });

        res.status(201).json({
            message: 'Restaurant request submitted successfully',
            id: request.id,
            name: request.name,
            status: request.status,
            created_at: request.created_at
        });
    } catch (error) {
        console.error('Restaurant request error:', error);
        res.status(500).json({ error: 'Failed to create restaurant request' });
    }
});

// Get restaurant requests (ADMIN only)
app.get('/auth/restaurant-requests', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { status } = req.query;
        const requests = await getRestaurantRequests(status);

        res.json(requests);
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ error: 'Failed to get restaurant requests' });
    }
});

// Approve/reject restaurant request (ADMIN only)
app.put('/auth/restaurant-requests/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, restaurantId } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const request = await updateRestaurantRequestStatus(id, status);

        // If approved and restaurantId provided, create owner mapping
        if (status === 'APPROVED' && restaurantId) {
            await createRestaurantOwner({
                userId: request.user_id,
                restaurantId: restaurantId
            });
        }

        res.json({
            message: `Restaurant request ${status.toLowerCase()}`,
            request
        });
    } catch (error) {
        console.error('Update request error:', error);
        res.status(500).json({ error: 'Failed to update restaurant request' });
    }
});

app.listen(PORT, () => {
    console.log(`🔐 Auth Service running on port ${PORT}`);
});
