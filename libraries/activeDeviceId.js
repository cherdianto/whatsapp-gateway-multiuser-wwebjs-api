const activeDeviceId = async (deviceId, user) => {
    console.log('activedeviceid')
    devices = user.device
    return devices.some(device => {
        // console.log(number === device.number)
        console.log(device.id)
        console.log(deviceId)
        if(device.id == deviceId && device.status === 'active') {//found
            return true
        }

        return false
    })
}

module.exports = activeDeviceId