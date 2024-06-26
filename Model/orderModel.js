const mongoose= require('mongoose');
const orderModel = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  address: {
    mobile: Number,
    houseName: String,
    street: String,
    city: String,
    pincode: String,
    state: String
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products'
      },
      quantity: {
        type: Number
      }
    }
  ],
  totalAmount: Number,
  OrderStatus: {
    type: String,
    enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned']
  },
  orderDate: {
    type: Date,
    default: Date.now
  },  

  couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'coupon'
  },
  paymentMethod: String,
  orderId: String,
  deliveredAt: Date,

});
const order = mongoose.model('orders', orderModel);

module.exports = order;