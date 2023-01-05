const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    deviceName: {
        type: String
    },
    number: {
        type: Number
    },
    status: {
        type: Boolean,
        default: false
    },
    connectionStatus: {
        type: String
    },
    createdAt: {
        type: Number
    },
    updatedAt: {
        type: Number
    }
}, {
    timestamps: {currentTime: () => Math.floor(Date.now() / 1000)}
})

module.exports=mongoose.model('Device', Schema)