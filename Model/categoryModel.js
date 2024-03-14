const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "products"
    }],
    isListed: {
        type: Boolean,
        default: true
    }
})


const category = mongoose.model('categories', categorySchema)
module.exports = category