const express = require('express')
const { register, login, logout, refreshToken, changePassword, getUser, resetPassword, validateResetLink } = require('../controllers/authController')
const verifyToken = require('../middlewares/verifyToken')
const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/change-password', verifyToken, changePassword)
router.get('/user', verifyToken, getUser)
router.get('/logout', logout)
router.post('/change-password', verifyToken, changePassword)
router.get('/reset-password', resetPassword)
router.get('/rst', validateResetLink)
router.get('/refresh-token', refreshToken)

module.exports = router