const cloudnary = require("cloudinary").v2

require("dotenv").config()
exports.cloudnaryConnect = async (req, res) => {
    try {
        cloudnary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET
        })

    } catch (error) {
        res.status(400).json({
            success: "false",
            message: "cloudnary  error"
        })
    }
}