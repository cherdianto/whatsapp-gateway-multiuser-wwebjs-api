const express = require('express')
const { addDevice, showDevices, scanQrcode, destroy, logout, updateDevice, deleteDevice, createApiKey, getState } = require('../controllers/deviceController')
const verifyApiKey = require('../middlewares/verifyApiKey')
const verifyToken = require('../middlewares/verifyToken')
const router = express.Router()

// @url : {{domain}}/device/update/{{deviceId}}
router.post('/add', verifyToken, addDevice)

// @url : {{domain}}/device/update/{{deviceId}}
router.put('/update/:deviceid', verifyToken, updateDevice)

// @url : {{domain}}/device/delete/{{deviceId}}
router.delete('/delete/:deviceid', verifyToken, deleteDevice)

// @url : {{domain}}/device/show-devices
router.get('/all', verifyToken, showDevices) 

// @url : {{domain}}/device/new-api-key/{{deviceId}}
router.get('/new-api-key/:deviceid', verifyToken, createApiKey) 

// @url : {{domain}}/device/destroy?key={{apiKey}}
router.get('/destroy', verifyApiKey, destroy) 

// @url : {{domain}}/device/logout?key={{apiKey}}
router.get('/logout', verifyApiKey, logout) 

// @url : {{domain}}/device/scan?key={{apiKey}}
router.get('/scan',verifyApiKey, scanQrcode)

// @url : {{domain}}/device/getState?key={{apiKey}}
router.get('/get-state', verifyApiKey, getState)

module.exports = router