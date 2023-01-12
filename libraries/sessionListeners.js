const qrcode = require('qrcode');
const cron = require('node-cron')

const sessionListeners = ({sessions, id, cronTask}) => {
    // activate the listeners
    sessions[id].on('qr', (qr) => {
        now = new Date().toLocaleString();
        qrcode.toDataURL(qr, (err, url) => {
            qrCodeString = url;
            console.log(id + ' scan qr code')
        });
    });

    sessions[id].on('authenticated', (session) => {
        now = new Date().toLocaleString();
        console.log(id + ' is auth-ed')
    });
    
    sessions[id].on('ready', () => {
        now = new Date().toLocaleString();
        console.log(id + ' whatsapp ready')

        cronTask[id] = cron.schedule('* * * * *', function() {
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
    // end of activate listeners
}

module.exports = sessionListeners