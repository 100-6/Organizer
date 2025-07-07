const express = require('express');
const router = express.Router();
const { 
    getProfile, 
    updateProfile, 
    changePassword, 
    deleteAccount, 
    searchUsers, 
    getUserById 
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validateUserUpdate, validatePasswordChange } = require('../middleware/validation');

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateUserUpdate, updateProfile);
router.put('/password', authenticateToken, validatePasswordChange, changePassword);
router.delete('/account', authenticateToken, deleteAccount);
router.get('/search', authenticateToken, searchUsers);
router.get('/:id', authenticateToken, getUserById);

module.exports = router;
