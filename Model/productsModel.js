const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        unique: true
    },
    productCategory: {

        type: String,
    },
    totalQuantity: {
        type: Number,

    },
    description: String,
    ManufactureDate: Date,
    price: Number,
    image: [{
        type: String,
    }],
    isListed: {
        type: Boolean,
        default: true
    },
    popularity: {
        type: Number,
        default: 0,
    },
})


const products = mongoose.model("products", productSchema)

module.exports = products