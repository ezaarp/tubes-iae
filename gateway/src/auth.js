const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'a8f5e2d9c4b7a1e6f3d8c2b5a9e7f4d1c8b6a3e9f2d7c5b8a4e1f6d3c9b7a2e5';

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Extract token from Authorization header
function extractToken(authHeader) {
    if (!authHeader) return null;

    // Support both "Bearer TOKEN" and just "TOKEN"
    const parts = authHeader.split(' ');
    return parts.length === 2 ? parts[1] : authHeader;
}

module.exports = {
    verifyToken,
    extractToken,
    JWT_SECRET
};
