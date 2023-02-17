// const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')
const Device = require('../models/Device')

const env = dotenv.config().parsed

// @return = req.user, req.device
const verifyApiKey = asyncHandler(async (req, res, next) => {
    // let userId = ''

    const apiKey = req.query.key || req.body.key
    console.log(req.body)

    if (!apiKey) {
        res.status(401)
        throw new Error('API_KEY_REQUIRED')
    }

    const device = await Device.findOne({ apiKey })
    console.log("midware-api-key-device ===" + device)
    if (!device) {
        res.status(401)
        throw new Error('DEVICE_NOT_FOUND')
    }

    const user = await User.findById(device.userId).select('-password')

    console.log(user)
    if (!user) {
        res.status(400)
        throw new Error('NO_USER_FOUND')
    }
    // req.jwt = decoded
    req.device = device
    req.user = user

    next()
})

module.exports = verifyApiKey