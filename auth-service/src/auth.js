const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'a8f5e2d9c4b7a1e6f3d8c2b5a9e7f4d1c8b6a3e9f2d7c5b8a4e1f6d3c9b7a2e5';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Generate access token
function generateAccessToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        restaurantId: null // Will be populated for owners
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Generate refresh token
function generateRefreshToken(user) {
    const payload = {
        userId: user.id,
        type: 'refresh'
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

// Verify token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

// Generate both tokens
function generateTokens(user) {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user)
    };
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    generateTokens,
    JWT_SECRET
};
