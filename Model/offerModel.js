const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique:true
    },
    discountValue:{
        type:Number,
        required:true
    },
    productCategory: {

        type: String,
    },
    expiry: {
        type: Date,
        required: true,
    },
    minimumCartAmount: {
        type: Number,
        required: true,
    },
    status:{
        type:String,
        enum:['Active','Expired','Not Active']
    },
    isActive:{
        type:Boolean,
        default:true
    },
    isExpired:{
        type:Boolean,
        default:false
    }
})

const offer = mongoose.model('offer', offerSchema);

module.exports = offer;