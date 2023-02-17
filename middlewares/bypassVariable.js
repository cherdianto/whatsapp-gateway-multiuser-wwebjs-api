const bypassVariable = ({io, sessions, cronTask}) => {
    const bypass = (req, res, next) => {
        req.sessions = sessions
        req.io = io
        req.cronTask = cronTask
        next()
    }

    return bypass
}

module.exports = bypassVariable