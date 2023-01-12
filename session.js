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
const dotenv = require('dotenv')
const env = dotenv.config().parsed
const app = express()

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// dbConnection();
// const store = new MongoStore({mongoose: mongoose})


// let sessions = {}
let rooms = []

const session = ({io, id, sessions, cronTask}) => {

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
    }

    sessions[id] = new Client(pptOptions)

    sessions[id].initialize()

    let statusConnection = {}
    io.on('connection', (socket) => {
        let now = new Date().toLocaleString();
        statusConnection[id] = 'initializing'
        console.log(rooms)

        if(id == undefined || id === ""){
            return false
        }

        if(!rooms.includes(`${id}`)){
            rooms.push(`${id}`)

            console.log('joining')
            socket.join(`${id}`)
            io.sockets.in(`${id}`).emit('message', `${now} socket.io is Connected at room ` + id);
            io.sockets.in(`${id}`).emit('statusConnection', statusConnection[id])
        }

        socket.on('disconnect', async function () {
            // if (statusConnection !== 'connected') {
            //     console.log('close without connecting')
            //     await whatsapp.destroy()
            // }
            console.log('???')
            console.log(socket)
        })

        // activate the listeners
        sessions[id].on('qr', (qr) => {
            now = new Date().toLocaleString();
            qrcode.toDataURL(qr, (err, url) => {
                qrCodeString = url;
                io.sockets.in(`${id}`).emit('statusConnection', statusConnection[id]);
                io.sockets.in(`${id}`).emit("qr", url);
                io.sockets.in(`${id}`).emit('message', `${now} QR Code received`);
                console.log(id + ' scan qr code')
            });
        });

        sessions[id].on('authenticated', () => {
            now = new Date().toLocaleString();
            io.sockets.in(`${id}`).emit('statusConnection', statusConnection[id]);
            // io.sockets.in(`${id}`).emit("qr", url);
            io.sockets.in(`${id}`).emit('close');
            console.log(id + ' is auth-ed, close the user,s window')
        });
    })

    sessions[id].on('authenticated', (session) => {
        now = new Date().toLocaleString();
        console.log(id + ' is auth-ed')
    });
    
    sessions[id].on('ready', () => {
        now = new Date().toLocaleString();
        console.log(id + ' whatsapp ready')

        const interval = '*/30 * * * * *'
        cronTask[id] = cron.schedule(interval, function() {
            console.log('cron task ' + id)
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

    sessions[id].on('disconnected', async function () {
        now = new Date().toLocaleString();
        console.log(id + ' is disconnectd')
        await sessions[id].destroy();
    });

    return sessions[id]
}

module.exports = session