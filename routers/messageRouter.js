const express = require('express')
const { addMessage, queuMessage, getMessages } = require('../controllers/messageController')
const verifyApiKey = require('../middlewares/verifyApiKey')
const verifyToken = require('../middlewares/verifyToken')
// const verifyToken = require('../middlewares/verifyToken')
const router = express.Router()

router.post('/add', verifyApiKey, addMessage)
router.get('/all', verifyToken, getMessages)
router.get('/queu', verifyApiKey, queuMessage)

module.exports = router