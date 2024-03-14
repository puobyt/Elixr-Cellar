const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,

    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,

    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    address: [{
        mobile: Number,
        houseName: String,
        street: String,
        city: String,
        pincode: String,
        state: String
    }
    ],
})


const UserCollection = mongoose.model("User", userSchema)

module.exports = UserCollection