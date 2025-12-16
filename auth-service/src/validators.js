const { body, validationResult } = require('express-validator');

// Validation rules for registration
const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(['CUSTOMER', 'OWNER', 'ADMIN']).withMessage('Invalid role')
];

// Validation rules for login
const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Validation rules for owner registration
const registerOwnerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('restaurantName').trim().notEmpty().withMessage('Restaurant name is required'),
    body('restaurantDescription').optional().trim()
];

// Middleware to handle validation errors
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

module.exports = {
    registerValidation,
    loginValidation,
    registerOwnerValidation,
    handleValidationErrors
};
