const express = require('express')
const { addMessage, queuMessage } = require('../controllers/messageController')
const verifyApiKey = require('../middlewares/verifyApiKey')
// const verifyToken = require('../middlewares/verifyToken')
const router = express.Router()

router.post('/add', verifyApiKey, addMessage)
router.get('/queu', verifyApiKey, queuMessage)

module.exports = router