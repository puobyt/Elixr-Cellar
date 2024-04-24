const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      unique: true,
    },
    productCategory: {
      type: String,
    },
    totalQuantity: {
      type: Number,
    },
    description: String,
    ManufactureDate: Date,
    originalPrice: Number,
    price: Number,
    discount: {
      type: Number,
      default: 0,
    },
    image: [
      {
        type: String,
      },
    ],
    isListed: {
      type: Boolean,
      default: true,
    },
    popularity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const products = mongoose.model("products", productSchema);

module.exports = products;
