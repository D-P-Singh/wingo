const mongoose = require('mongoose')
require("dotenv").config()
const dbConnect = () => {
    mongoose.connect(process.env.DATABASE_URL, {
    }).then(() => {
        console.log("database connect")
    })
        .catch((error) => {
            console.log("error in connection")
            console.log(error.message)
            process.exit(1)
        })
}

module.exports = dbConnect 