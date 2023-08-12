const {
    Client,
    LocalAuth,
    RemoteAuth
} = require('whatsapp-web.js');

const sessionInit = (sessions, id) => {
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
}

module.exports = sessionInit