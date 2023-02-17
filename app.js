const {
    Client,
    LocalAuth,
    RemoteAuth
} = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const socketIO = require('socket.io');
const morgan = require('morgan')
const http = require('http');
const cookieParser = require('cookie-parser')
const dbConnection = require('./libraries/dbConnect')
const {
    MongoStore
} = require('wwebjs-mongo')
const mongoose = require('mongoose')
// const ejs = require('ejs')
const path = require('path')
const asyncHandler = require('express-async-handler')
const cron = require('node-cron')
const cors = require('cors')
const dotenv = require('dotenv')
const env = dotenv.config().parsed

const errorHandler = require('./middlewares/errorMiddleware')
const authRouter = require('./routers/authRouter')
const deviceRouter = require('./routers/deviceRouter')
const messageRouter = require('./routers/messageRouter')
const verifyToken = require('./middlewares/verifyToken');
const activeDeviceId = require('./libraries/activeDeviceId');
const Device = require('./models/Device');
const Message = require('./models/Message');
const libsession = require('./session');
const bypassVariable = require('./middlewares/bypassVariable');
const sessionInit = require('./libraries/sessionInit');
const sessionListeners = require('./libraries/sessionListeners');
const rewritePhone = require('./libraries/rewritePhone');
// const asyncHandler = require('express-async-handler')

// const fs = require('fs')
const app = express()
const server = http.createServer(app)
const io = socketIO(server)

const PORT = env.PORT
dbConnection();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// MIDDLEWARES
if(process.env.ENV === 'dev'){
    app.use(cors({credentials: true, origin: `${process.env.CLIENT_URL_DEV}`}));
} else {
    app.use(cors({credentials: true, origin: `${process.env.CLIENT_URL_PROD}`}));
}
// const store = new MongoStore({mongoose: mongoose})

let sessions = {}
let cronTask = {}
// let rooms = []
console.log(sessions)

const restoreActiveUserSessions = asyncHandler(async () => {
    // get all active users
    // let users = await User.find({
    //     $and: [{
    //         devices: {
    //             $exists: true,
    //             $ne: []
    //         }
    //     }, {
    //         status: 'active'
    //     }]
    // })

    const devices = await Device.find({
        status: 'active',
        connectionStatus: 'connected' //it is to prevent
    })

    // get all active devices from active users
    let activeDevices = []
    // users.forEach(user => {
        devices.forEach(device => {
            // if (device.status === 'active') {
                activeDevices.push(device._id.valueOf())
            // }
        })
    // })

    console.log('active devices : ' + activeDevices)
    // restore each client
    activeDevices.forEach((id, index) => {
        setTimeout(() => {
            console.log('run id number ' + id)
            sessionInit(sessions, id)
            sessionListeners({sessions, id, cronTask})
        }, index * 10000)
    })
})

restoreActiveUserSessions()

// index routing and middleware
app.use(cookieParser())
app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({
    extended: true
}));

// routers
app.use('/auth', authRouter)
app.use('/device', bypassVariable({io, sessions, cronTask}), deviceRouter)
app.use('/message', bypassVariable({io, sessions, cronTask}), messageRouter)

// app.get('/get-state', async (req, res) => {
//     const id = req.body.id
//     console.log('getState ' + id)

//     try {
//         const response = await sessions[id].getState()

//         res.status(200).json({
//             msg: `getState ${id} OK`,
//             state: response
//         })
//     } catch (error) {
//         res.status(500).json({
//             msg: 'getState ' + id + ' error',
//             state: 'session not found'
//         })
//     }

// })

app.use(errorHandler)

// server.listen(PORT, () => {
server.listen(PORT, () => {
    console.log('App listen on port ', PORT);
});