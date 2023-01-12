const rewritePhone = (phone) => {
    let phoneNumber;
    if (phone.startsWith('08')) {
        phoneNumber = "62" + phone.slice(1) + "@c.us"
    } else if ( phone.startsWith("62")) {
        phoneNumber = phone + "@c.us"
    } else if (phone.startsWith("06")){
        phoneNumber = "31" + phone.slice(1) + "@c.us"
    } else if (phone.startsWith("8")){
        phoneNumber = "62" + phone + "@c.us"
    } else if (phone.startsWith("3")){
        phoneNumber = "31" + phone + "@c.us"
    } else if (phone.startsWith("+") || phone.startsWith(" ")){
        phoneNumber = phone.slice(1) + "@c.us"
    } else {
        // will return as it is
        phoneNumber = phone
    }
    return phoneNumber
}

module.exports = rewritePhone