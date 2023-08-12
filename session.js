const { Client, LocalAuth,  RemoteAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const socketIO = require('socket.io');
// const http = require('http');
const dbConnection = require('./libraries/dbConnect')
// const {MongoStore} = require('wwebjs-mongo')
// const mongoose = require('mongoose')
const cron = require('node-cron')
const path = require('path')
const Message = require('./models/Message')
const Device = require('./models/Device')
const rewritePhone = require('./libraries/rewritePhone')
const dotenv = require('dotenv')
const env = dotenv.config().parsed
const app = express()

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

let rooms = []

const session = async ({io, id, sessions, cronTask}) => {

    const pptOptions = {
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-session-crashed-bubble',
                '--disable-infobars'
            ]
        },

        authStrategy: new LocalAuth({
            clientId: id,
        }),
        qrMaxRetries: 1,
        takeoverOnConflict: true,

    }

    // sessions = [...new Map(sessions.map(session => [session[id], session])).values()]

    sessions[id] = new Client(pptOptions)
    
    sessions[id].initialize()

    let statusConnection = {}
    io.on('connection', (socket) => {
        let now = new Date().toLocaleString();
        statusConnection[id] = 'initializing'
        // console.log('room : ' + rooms)
        // console.log('id ' + id)

        // if(id == undefined || id === ""){
        //     return false
        // }

        // if(!rooms.includes(`${id}`)){
        //     rooms.push(`${id}`)

        //     console.log('joining')
        //     socket.join(id)
        //     io.sockets.in(id).emit('message', `${now} socket.io is Connected at room ` + id);
        //     io.sockets.in(id).emit('statusConnection', statusConnection[id])
        // }

        socket.on('disconnect', async function () {
            // await sessions[id].destroy()
            // await socket.leave()
            return
        })

        // activate the listeners
        sessions[id].on('qr', async (qr) => {
            console.log(sessions)
            statusConnection[id] = 'scan qrcode'
            qrcode.toDataURL(qr, (err, url) => {
                qrCodeString = url;
                socket.emit('statusConnection', statusConnection[id]);
                socket.emit("qr", url);
                console.log(id + ' scan qr code')
            });

            // if(sessions[id].scanLimit > 1){
            //     console.log('destroy atas')
            //     socket.emit('statusConnection', 'disconnected, please retry to scan');

            //     await sessions[id].destroy();
            //     return
            // }
        });

        sessions[id].on('authenticated', () => {
            // now = new Date().toLocaleString();
            statusConnection[id] = 'connected'
            socket.emit('statusConnection', statusConnection[id]);
            // socket.emit('close');
            // io.sockets.disconnect()
            console.log(id + ' is auth-ed, close the user,s window')
        });

        sessions[id].on('disconnected', async function () {
            now = new Date().toLocaleString();
            socket.emit('statusConnection', 'disconnected, please retry');
            console.log(id + ' is disconnectd')
            delete sessions[id]
            await Device.findByIdAndUpdate(
                id,
                { $set: { connectionStatus: 'disconnected'} }
            )
        });
    })

    sessions[id].on('authenticated', (session) => {
        now = new Date().toLocaleString();
        console.log(id + ' is auth-ed')
    });
    
    sessions[id].on('ready', async () => {
        // now = new Date().toLocaleString();
        console.log(id + ' whatsapp ready')
        
        await Device.findByIdAndUpdate(
            id,
            { $set: { connectionStatus: 'connected'} }
        )

        cronTask[id] = cron.schedule('*/20 * * * * *', async () => {
            const response = await Message.findOne({
                deviceId: id,
                status: '1'
            }).sort({
                priority: -1,
                time: 1
            })
            if (!response) {
                console.log('no task left')
                console.log('cron idle ' + id)
                await Device.findByIdAndUpdate(
                    id,
                    { $set: { cronIdle: true } }
                )
                cronTask[id].stop()
                return
            }

            try {
                const normalizedPhone = rewritePhone(response.to)
                const checkUser = await sessions[id].isRegisteredUser(normalizedPhone)

                if (!checkUser) {
                    console.log('invalid destination ' + normalizedPhone)
                    await Message.findByIdAndUpdate(
                        response._id, {
                            $set: {
                                status: '4'
                            }
                        }, {
                            new: true
                        }
                    )
                    throw new Error('invalid destination')
                }
                sessions[id].sendMessage(normalizedPhone, response.message)
            } catch (error) {
                console.log(error)
                return
            }


            const updating = await Message.findByIdAndUpdate(
                response._id, {
                    $set: {
                        status: '2'
                    }
                }, {
                    new: true
                }
            )

            if (!updating) {
                console.log('updating status error')
                return
            }

            console.log('send message ' + response.message)
        })

        cronTask[id].start()
    });
    
    sessions[id].on('auth_failure', function (session) {
        now = new Date().toLocaleString();

        console.log(id + ' is fail')
    });

    sessions[id].on('message', msg => {
        console.log('MESSAGE session : ' + id)
        if (msg.body == '!ping') {
            setTimeout(() => {
                msg.reply('pong');
            }, 2000)
        }
    });

    

    // if(sessions[id].scanLimit > 1){
    //     // sessions[id].scanLimit = 0
    //     // sessions[id].destroy();
    //     console.log('DESTROY SESSION')
    //     delete sessions[id]
    //     // return
    // }
    // console.log(sessions[id])
    return sessions[id]
}

// const session = ({io, id, sessions, cronTask}) => {

//     const pptOptions = {
//         puppeteer: {
//             headless: false,
//             args: [
//                 '--no-sandbox',
//                 '--disable-setuid-sandbox',
//                 '--disable-dev-shm-usage',
//                 '--disable-accelerated-2d-canvas',
//                 '--no-first-run',
//                 '--no-zygote',
//                 '--disable-gpu',
//                 '--disable-session-crashed-bubble',
//                 '--disable-infobars'
//             ]
//         },

//         authStrategy: new LocalAuth({
//             clientId: id,
//         }),
//     }

//     sessions[id] = new Client(pptOptions)

//     sessions[id].initialize()
//     sessions[id].scanLimit = 0

//     let statusConnection = {}
//     io.on('connection', (socket) => {
//         let now = new Date().toLocaleString();
//         statusConnection[id] = 'initializing'
//         console.log('room : ' + rooms)
//         console.log('id ' + id)

//         if(id == undefined || id === ""){
//             return false
//         }

//         if(!rooms.includes(`${id}`)){
//             console.log('sessions :')
//             console.log(sessions)
//             rooms.push(`${id}`)

//             console.log('joining')
//             socket.join(id)
//             io.sockets.in(id).emit('message', `${now} socket.io is Connected at room ` + id);
//             io.sockets.in(id).emit('statusConnection', statusConnection[id])
//         }

//         socket.on('disconnect', async function () {
//             console.log(id)
//             // socket.leave()
//             // const leavingRoom = io.sockets.in(id).leave(id)
//             // console.log(leavingRoom)
//             // if (statusConnection !== 'connected') {
//             //     console.log('close without connecting')
//             //     rooms = rooms.filter(room => room === id)
//             //     console.log(rooms)
//             //     await sessions[id]?.destroy();
//             //     delete sessions[id]
//             //     console.log(sessions)
//             //     return false
//             // }
//             // console.log('???')
//             // console.log(socket)
//             return false
//         })

//         // activate the listeners
//         sessions[id].on('qr', (qr) => {
//             // now = new Date().toLocaleString();
//             // sessions[id].scanLimit = 0
//             // console.log(sessions)
//             statusConnection[id] = 'scan qrcode'
//             console.log(sessions[id].scanLimit)
//             qrcode.toDataURL(qr, (err, url) => {
//                 sessions[id].scanLimit = sessions[id].scanLimit + 1
//                 qrCodeString = url;
//                 io.sockets.in(`${id}`).emit('statusConnection', statusConnection[id]);
//                 io.sockets.in(`${id}`).emit("qr", url);
//                 // io.sockets.in(`${id}`).emit('message', `${now} QR Code received`);
//                 console.log(id + ' scan qr code')
//             });

//             if(sessions[id].scanLimit > 1){
//                 // sessions[id].scanLimit = 0
//                 sessions[id].destroy();
//                 // delete sessions[id]
//                 return
//             }
//         });

//         sessions[id].on('authenticated', () => {
//             // now = new Date().toLocaleString();
//             statusConnection[id] = 'connected'
//             io.sockets.in(`${id}`).emit('statusConnection', statusConnection[id]);
//             // io.sockets.in(`${id}`).emit("qr", url);
//             io.sockets.in(`${id}`).emit('close');
//             // io.sockets.disconnect()
//             console.log(id + ' is auth-ed, close the user,s window')
//         });
//     })

//     sessions[id].on('authenticated', (session) => {
//         now = new Date().toLocaleString();
//         console.log(id + ' is auth-ed')
//     });
    
//     sessions[id].on('ready', async () => {
//         // now = new Date().toLocaleString();
//         console.log(id + ' whatsapp ready')
        
//         await Device.findByIdAndUpdate(
//             id,
//             { $set: { connectionStatus: 'connected'} }
//         )

//         cronTask[id] = cron.schedule('*/20 * * * * *', async () => {
//             const response = await Message.findOne({
//                 deviceId: id,
//                 status: '1'
//             }).sort({
//                 priority: -1,
//                 time: 1
//             })
//             if (!response) {
//                 console.log('no task left')
//                 console.log('cron idle ' + id)
//                 await Device.findByIdAndUpdate(
//                     id,
//                     { $set: { cronIdle: true } }
//                 )
//                 cronTask[id].stop()
//                 return
//             }

//             try {
//                 const normalizedPhone = rewritePhone(response.to)
//                 const checkUser = await sessions[id].isRegisteredUser(normalizedPhone)

//                 if (!checkUser) {
//                     console.log('invalid destination ' + normalizedPhone)
//                     await Message.findByIdAndUpdate(
//                         response._id, {
//                             $set: {
//                                 status: '4'
//                             }
//                         }, {
//                             new: true
//                         }
//                     )
//                     throw new Error('invalid destination')
//                 }
//                 sessions[id].sendMessage(normalizedPhone, response.message)
//             } catch (error) {
//                 console.log(error)
//                 return
//             }


//             const updating = await Message.findByIdAndUpdate(
//                 response._id, {
//                     $set: {
//                         status: '2'
//                     }
//                 }, {
//                     new: true
//                 }
//             )

//             if (!updating) {
//                 console.log('updating status error')
//                 return
//             }

//             console.log('send message ' + response.message)
//         })

//         cronTask[id].start()
//     });
    
//     sessions[id].on('auth_failure', function (session) {
//         now = new Date().toLocaleString();

//         console.log(id + ' is fail')
//     });

//     sessions[id].on('message', msg => {
//         console.log('MESSAGE session : ' + id)
//         if (msg.body == '!ping') {
//             setTimeout(() => {
//                 msg.reply('pong');
//             }, 2000)
//         }
//     });

//     sessions[id].on('disconnected', async function () {
//         now = new Date().toLocaleString();
//         console.log(id + ' is disconnectd')
//         await sessions[id].destroy();
//     });

//     if(sessions[id].scanLimit > 1){
//         // sessions[id].scanLimit = 0
//         // sessions[id].destroy();
//         delete sessions[id]
//         // return
//     }

//     return sessions[id]
// }

module.exports = session