const qrcode = require('qrcode');
const cron = require('node-cron')
const Message = require('../models/Message')
const Device = require('../models/Device')
const rewritePhone = require('./rewritePhone')

const sessionListeners = ({
    sessions,
    id,
    cronTask
}) => {
    // activate the listeners
    sessions[id].on('qr', async (qr) => {

        await Device.findByIdAndUpdate(
            id,
            { $set: { connectionStatus: 'disconnected'} }
        )

        sessions[id].destroy()

        // now = new Date().toLocaleString();
        // qrcode.toDataURL(qr, (err, url) => {
        //     qrCodeString = url;
        //     console.log(id + ' scan qr code')
        // });
    });

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

    sessions[id].on('disconnected', async function () {
        now = new Date().toLocaleString();
        await Device.findByIdAndUpdate(
            id,
            { $set: { cronIdle: false, connectionStatus: 'disconnected' } }
        )

        if(cronTask.hasOwnProperty(id)){
            cronTask[id].stop()
        }

        console.log(id + ' is disconnectd')
        await sessions[id].destroy();
    });
    // end of activate listeners
}

module.exports = sessionListeners