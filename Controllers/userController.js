const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const UserCollection = require("../Model/userModel");
const Product = require("../Model/productsModel");
const Cart = require("../Model/cartModel");
const orders = require("../Model/orderModel");
const wallet = require("../Model/walletModel");
const Category = require("../Model/categoryModel");
const mongoose = require("mongoose");
const Coupons = require("../Model/couponModel");
const offer = require("../Model/offerModel");
const PDFDocument= require('pdfkit');


const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sortBy } = require("lodash");
require("dotenv").config();
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const userLogin = async (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("userlogin", { passwordError: "" });
  }
};

const resetPassword = async (req, res) => {
  req.session.resetpassword = true;
  if (req.session.resetpassword) {
    res.render("resetPassword");
  } else {
    res.redirect("/");
  }
};

const postResetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    console.log(email);
    const data = await UserCollection.findOne({ email });
    console.log(data);
    if (data.email === email) {
      req.session.resetEmail = email;
      res.json({ success: true, message: "Successfully" });
    } else {
      res.json({ success: false, message: "error" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Not correct" });
  }
};

const resetOtp = async (req, res) => {
  console.log("email from otp");
  const email = req.session.resetEmail;
  const otp = generateOTP();
  req.session.resetPasswordOTP = otp;

  await sendOTP(email, otp, req);

  res.render("resetOtp", { email });
};
const verifyOtp = (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp);
    const storedOTP = req.session.resetPasswordOTP;
    console.log(storedOTP);
    if (otp === storedOTP) {
      res.json({ success: true, message: "Verified Successfully!" });
    } else {
      res.json({ success: false, message: "Wrong OTP!" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Not correct" });
  }
};

const changePassword = (req, res) => {
  res.render("changePassword");
};

const changingPassword = async (req, res) => {
  try {
    const email = req.session.resetEmail;

    const password = req.body.password;
    const user = await UserCollection.findOne({ email });

    if (user) {
      user.password = password;
      await user.save();
      res.json({ success: true, message: "Verified Successfully!" });
    } else {
      res.json({ success: false, message: "Failed!" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed from cattch!" });
  }
};

const userLoginData = async (req, res) => {
  try {
    const { userEmail, password } = req.body;
    console.log(userEmail);
    const user = await UserCollection.findOne({ email: userEmail });
    if (user && !user.isBlocked) {
      if (user.email == userEmail && user.password == password) {
        req.session.user = true;
        req.session.userId = user._id;
        res.redirect("/");
      } else {
        res.render("userlogin", { passwordError: "Invalid passWord" });
      }
    } else {
      res.render("userlogin", { passwordError: "Invalid User" });
    }
  } catch (error) {
    console.log(error);
  }
};

// Shop
const userHome = async (req, res) => {
  try {
    let productId = req.params.id;
    const randomProducts = await Product.aggregate([{ $sample: { size: 4 } }]);
    const products = await Product.findById(productId);

    res.render("userHome", { products, randomProducts });
  } catch (error) {
    console.error("Error", error);
    res.status(500).send("Internal server Error");
  }
};

const userProductDetails = async (req, res) => {
  try {
    let productId = req.params.id;
    const product = await Product.findById(productId);

    res.render("userProductDetails", { product });
  } catch (error) {
    console.error("Error", error);
    res.status(500).send("Internal server Error");
  }
};

// About
const userAbout = (req, res) => {
  res.render("userAbout");
};

// Generate OTP
const generateOTP = (email) => {
  return randomstring.generate({
    length: 6,
    charset: "numeric",
  });
};

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "puobyt@gmail.com",
    pass: "nipo nwem rxhc eevm",
  },
});

// Send OTP via email

const sendOTP = (email, otp, req) => {
  console.log("req.session",req.session)
  console.log("email otp",email)
  
  const mailOptions = {
    from: "puobyt@gmail.com",
    to: email,
    subject: "OTP Verification",
    text: `Your OTP for registration is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

// Resend Otp

const resendOtp = async(req,res)=>{
  const email =req.session.email;
  console.log("Resend email",email)
  if(!email){
    return res.status(400).send("Invalid request.");
  }
  const otp= generateOTP(email);
  req.session.otp = otp;
  sendOTP(email, otp, req);
  res.status(200).send("OTP resent successfull")
};

const registerUser = (req, res) => {
  if (req.session.user) {
    res.redirect("/login");
  } else {
    res.render("usersignup");
  }
};

const userSignup = async (req, res) => {
  try {
    // User data from the request body
    let user1 = {
      name: req.body.Name,
      email: req.body.Email,
      password: req.body.password,
    };
    req.session.email = user1.email
    console.log("req.body",req.body)

    // Retrieve email from request body
    const email = req.body.Email;

    // Check if a user with the provided email already exists
    const userCheck = await UserCollection.findOne({ email: email });

    if (userCheck) {
      // If the email already exists, render the usersignup page with an error message
      res.render("usersignup", {
        regerstrationMessage:
          "<span class='error-message'>Email Already exists</span>",
      });
    } else {
      // Generate an OTP
      const otp = generateOTP();

      // Display the OTP in the console
      console.log("Generated OTP:", otp);
      console.log("Emailll",email)
      // Send the OTP to the user's email
      sendOTP(email, otp, req);

      // Store user data and OTP in the session
      req.session.userData = user1;
      req.session.otp = otp;

      // Redirect the user to the OTP verification page
      res.redirect("/otp");
    }
  } catch (error) {
    // Handle any errors by rendering the usersignup page with an error message
    res.render("usersignup", {
      regerstrationMessage: "Registration failed. Please try again.",
    });
    console.error(error);
  }
};

const otp = (req, res) => {
  res.render("otp", { email: req.session.userData.email, errorMessage: "" });
};

const userShop = async (req, res) => {
  try {
    let sortQuery = {};
    const categories = await Category.find();

    const sortBy = req.query.sortBy;
    switch (sortBy) {
      case "whats_new":
        sortQuery = { createdAt: -1 };
        break;
      case "price_asc":
        sortQuery = { price: 1 };
        break;
      case "price_desc":
        sortQuery = { price: -1 };
        break;
      case "name_asc":
        sortQuery = { productName: 1 };
        break;
      case "name_desc":
        sortQuery = { productName: -1 };
        break;
      case "popularity_desc":
        sortQuery = { popularity: -1 };
        break;
      default:
        break;
    }

    // Pagination logic
    const page = parseInt(req.query.page) || 1; // Current page number, default is 1
    const limit = 9; // Number of items per page
    const skip = (page - 1) * limit; // Number of items to skip

    const count = await Product.countDocuments(); // Total number of products
    const totalPages = Math.ceil(count / limit); // Total number of pages

    const products = await Product.find()
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    res.render("userShop", {
      products,
      categories,
      currentPage: page,
      totalPages,
      sortBy,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const categoryFilter = async (req, res) => {
  try {
    const category = req.query.category;
    console.log(category);
    const categories = await Category.findById(category).populate("products");
    console.log(categories.products);

    let categoryQuery = {};
    const page = parseInt(req.query.page) || 1; // Current page number, default is 1
    const limit = 9; // Number of items per page

    const count = await Product.countDocuments(); // Total number of products
    const totalPages = Math.ceil(count / limit); // Total number of pages

    res.render("userShop", {
      products: categories.products,
      categories: categories.products,
      currentPage: page,
      totalPages,
      sortBy,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const searchProduct = async (req, res) => {
  try {
    console.log("search working");
    let products;

    const query = req.query.query || "";
    const category = req.query.category || "";

    const filter = {
      productName: { $regex: new RegExp(`^${query}`, "i") },
    };

    if (category) {
      filter.category = category;
    }

    if (query || category) {
      products = await Product.find(filter);
    } else {
      products = await Product.find();
    }

    const categories = await Category.find();
    const page = parseInt(req.query.page) || 1; // Current page number, default is 1
    const limit = 9; // Number of items per page

    const count = await Product.countDocuments(); // Total number of products
    const totalPages = Math.ceil(count / limit); // Total number of pages

    res.render("userShop", {
      products,
      categories,
      currentPage: page,
      totalPages,
      sortBy,
    });
  } catch (error) {
    console.log(error);
  }
};

const userContact = (req, res) => {
  try {
    res.render("userContact");
  } catch (error) {
    console.log(error);
  }
};

// const userWallet = async (req, res) => {
//   try {
//     const userId = req.session.userId;

//     const userWallet = await wallet.findOne({ userId });
//     console.log("userWallet", userWallet.transactionHistory);

//     res.render("userWallet", { userWallet });
//   } catch (error) {
//     console.log(error);
//   }
// };

const userWallet = async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1; // Get page number from query parameter, default to 1 if not provided
    const limit = 10; // Number of transactions per page
    const skip = (page - 1) * limit;

    // Retrieve the user's wallet data and populate the transaction history
    const userWalletData = await wallet.findOne({ userId }).populate("transactionHistory");
    
    // Initialize transactionHistory to an empty array if userWalletData is null
    const transactionHistory = userWalletData ? userWalletData.transactionHistory.slice(skip, page * limit) : [];

    // Calculate the total number of transactions
    const totalTransactions = userWalletData ? userWalletData.transactionHistory.length : 0;

    // Render the 'userWallet' view and pass the necessary data
    res.render("userWallet", {
      userWallet: { transactionHistory },
      userWalletData,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
    });
  } catch (error) {
    console.log(error);
    // Handle any errors and respond appropriately
    res.status(500).send("An error occurred while processing your request.");
  }
};


const processPayment = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { paymentMethod, totalPrice } = req.body;

    const userWallet = await wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: -totalPrice } },
      { new: true }
    );

    const newTransaction = {
      transaction: "Money Deducted",
      amount: totalPrice,
    };

    userWallet.transactionHistory.push(newTransaction);
    await userWallet.save();

    res.redirect("/checkout/success");
  } catch (error) {
    console.log(error);

    res.status(500).send("Internal Server Error");
  }
};

const calculateTotalPrice = (items) => {
  const totalPrice = items.reduce((total, item) => {
    if (item.productId && item.productId.totalQuantity > 0) {
      return total + item.productId.price * item.quantity;
    }
    return total;
  }, 0);

  return totalPrice.toFixed(2);
};

const userCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).redirect("/");
    }

    const products = await Product.find({});
    let totalQuantity = 0;
    products.forEach((product) => {
      totalQuantity += product.totalQuantity;
    });

    const userCart = await Cart.findOne({ userId }).populate("items.productId");
    if (!userCart) {
      return res.render("userCart", {
        cartItems: [],
        totalPrice: 0,
        totalQuantity,
        products,
      });
    }
    const items = userCart.items || [];

    const totalPrice = calculateTotalPrice(items);
    console.log("user cart", userCart.items);

    res.render("userCart", {
      cartItems: userCart.items,
      totalPrice,
      totalQuantity,
      products,
    });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.userId;
    const productId = req.params.productId;
    const newQuantity = req.body.quantity;
    const product = await Product.findById(productId);

    if (newQuantity > product.totalQuantity) {
      return res.status(400).json({
        error: "Invalid quantity. Not enough Stock.",
      });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId, "items.productId": productId },
      { $set: { "items.$.quantity": newQuantity } },
      { new: true }
    ).populate("items.productId");

    const updatedProduct = updatedCart.items.find(
      (item) => item.productId._id.toString() === productId
    );
    console.log(updatedCart.items);
    res.json({
      message: "Quantity updated successfully",
      updatedProduct: {
        _id: updatedProduct.productId._id,
        price: updatedProduct.productId.price,
        cartItems: updatedCart.items,
      },
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const userCheckout = async (req, res) => {
  let userId = req.session.userId;
  const userCart = await Cart.findOne({ userId }).populate("items.productId");
  const Usercollections = await UserCollection.findById(userId);
  const coupons = await Coupons.find();

  const order = await orders.findOne({ customer: userId });
  const items = userCart.items || [];

  totalPrice = calculateTotalPrice(
    items.filter((item) => item.productId.totalQuantity > 0)
  );
  console.log("Total ", totalPrice);
  req.session.updatedTotalPrice = totalPrice;
  console.log("req.session.updatedTotalPrice", req.session.updatedTotalPrice);

  let availableCoupons = [];
  let isCouponAvailable = false;

  for (const coupon of coupons) {
    if (coupon.expiry < new Date()) {
      await Coupons.updateOne(
        { code: coupon.code },
        { $set: { isExpired: true, isActive: false } }
      );
    }

    if (
      coupon.discountType === "First Purchase" &&
      coupon.isActive &&
      !coupon.isExpired
    ) {
      if (!order) {
        availableCoupons.push(coupon);
      }
    } else if (
      coupon.minimumCartAmount <= totalPrice &&
      coupon.isActive &&
      !coupon.isExpired
    ) {
      availableCoupons.push(coupon);
    }
  }

  try {
    if (req.session.user) {
      console.log("coupons....", availableCoupons);
      res.render("userCheckout", {
        Usercollections,
        // updatedTotalPrice,
        totalPrice,
        userCart,
        availableCoupons,
        isCouponAvailable,
      });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error);
  }
};

const validateCoupon = async (req, res) => {
  const {
    couponCode,
    totalAmount,
    checkoutTotalInput,
    // discountedTotal,
    discountedValue,
    checkoutTotal,
  } = req.body;
  console.log("reqqqq", req.body);
  try {
    const userId = req.session.userId;
    const userCart = await Cart.findOne({ userId }).populate("items.productId");
    const items = userCart.items;

    const totalPrice = calculateTotalPrice(
      items.filter((item) => item.productId.totalQuantity > 0)
    );
    const coupon = await Coupons.findOne({ code: couponCode });

    if (couponCode === "" || (coupon && coupon.code !== couponCode)) {
      const discountedValue = 0;
      const discountedTotal = 0;

      res.status(200).json({
        isEmpty: true,
        message: "Coupon is valid. Discount applied successfully",
        discountedTotal,
        discountedValue,
      });
    } else if (!coupon) {
      // Coupon not found
      res.status(404).json({ isValid: false, message: "Coupon not found" });
    } else {
      const discountPercentage = coupon.discountValue;

      // If coupon is valid, apply the discount
      if (!isNaN(discountPercentage) && !isNaN(totalAmount)) {
        const discountValue = (discountPercentage / 100) * totalAmount;
        console.log("Discount", discountValue);
        console.log("Discount%", discountPercentage);
        const checkoutTotal = totalAmount - discountValue;
        console.log("checkoutTotal", checkoutTotal);
        const discountedTotal = 0;
        console.log("req.session before", req.session);
        req.session.updatedTotalPrice = checkoutTotal;
        req.session.coupon = coupon._id;
        req.session.save();
        console.log("req.session after", req.session);
        console.log("coupon", req.session.updatedTotalPrice);

        res.status(200).json({
          isValid: true,
          message: "Coupon is valid. Discount applied successfully",
          checkoutTotal,
          discountValue,
        });

        const parsedCheckoutTotalInput = parseFloat(
          req.session.updatedTotalPrice
        ).toFixed(2);
        console.log(parsedCheckoutTotalInput);
        console.log(discountedTotal);

        if (!isNaN(parsedCheckoutTotalInput)) {
          req.session.updatedTotalPrice = parsedCheckoutTotalInput;
          req.session.save();
        } else {
          console.error("Invalid checkoutTotalInput value");
        }
      } else {
        // Invalid discount or total amount
        const discountValue = 0;
        const discountedTotal = 0;
        res.status(200).json({
          isValid: false,
          message: "Coupon is valid. Discount applied successfully",
          discountedTotal,
          discountValue,
        });
      }
    }
  } catch (error) {
    console.error("Error handling Coupon data:", error);
    res.status(500).json({ isValid: false, message: "Internal Server Error" });
  }
};

const cancelCoupon = async (req, res) => {
  const { totalAmount } = req.body;
  req.session.updatedTotalPrice = totalAmount;
  delete req.session.coupon;
  res.status(200).json({
    success: true,
  });
};

const handleCheckOut = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await UserCollection.findById(userId);
    const userCart = await Cart.findOne({ userId }).populate("items.productId");
    const items = userCart.items;
    const addressIndex = req.body.selectedAddress;
    const updatedTotalPrice = req.session.updatedTotalPrice;
    const userAddresses = user.address[addressIndex];
    const { paymentMethod, totalPrice } = req.body;

    if (paymentMethod === "walletPayment") {
      const userWallet = await wallet.findOne({ userId });
      if (userWallet.balance < totalPrice) {
        return res.status(400).send("Insufficient balance in wallet.");
      }

      userWallet.balance -= updatedTotalPrice;
      console.log("walleatt", req.session.updatedTotalPrice);
      userWallet.transactionHistory.push({
        transaction: "Money Deducted",
        amount: updatedTotalPrice,
      });

      await userWallet.save();

      const newOrder = new orders({
        customer: userId,
        address: {
          mobile: userAddresses.mobile,
          houseName: userAddresses.houseName,
          street: userAddresses.street,
          city: userAddresses.city,
          pincode: userAddresses.pincode,
          state: userAddresses.state,
        },
        items: items
          .filter((item) => item.productId.totalQuantity > 0)
          .map((item) => ({
            product: item.productId._id,
            quantity: item.quantity,
          })),
        totalAmount: updatedTotalPrice,
        OrderStatus: "Order Placed",
        paymentMethod: paymentMethod,
        couponApplied: req.session.coupon || "",
        orderId: generateOrderId(),
      });

      if (req.session.coupon) {
        newOrder.couponApplied = req.session.coupon;
        await newOrder.save();
        delete req.session.coupon;
      } else {
        await newOrder.save();
      }
      for (const item of items) {
        if (item.productId.totalQuantity > 0) {
          item.productId.totalQuantity -= item.quantity;
          await item.productId.save();
        }
      }
    }
    if (paymentMethod === "COD") {
      const newOrder = new orders({
        customer: userId,
        address: {
          mobile: userAddresses.mobile,
          houseName: userAddresses.houseName,
          street: userAddresses.street,
          city: userAddresses.city,
          pincode: userAddresses.pincode,
          state: userAddresses.state,
        },
        items: items
          .filter((item) => item.productId.totalQuantity > 0)
          .map((item) => ({
            product: item.productId._id,
            quantity: item.quantity,
          })),
        totalAmount: updatedTotalPrice,
        OrderStatus: "Order Placed",
        paymentMethod: paymentMethod,

        orderId: generateOrderId(),
      });
      if (req.session.coupon) {
        newOrder.couponApplied = req.session.coupon;
        await newOrder.save();
        delete req.session.coupon;
      } else {
        await newOrder.save();
      }

      for (const item of items) {
        if (item.productId.totalQuantity > 0) {
          item.productId.totalQuantity -= item.quantity;
          await item.productId.save();
        }
      }
    }

    res.redirect("/userSuccess");
  } catch (error) {
    console.log(error);

    res.status(500).send("Internal Server Error");
  }
};

const createOrder = async (req, res) => {
  const userId = req.session.userId;

  let {
    paymentOption,
    // updatedTotalPrice,
    totalAmount,
    currency,
    razorpay_order_id,
    razorpay_signature,
  } = req.body;
  try {
    const amount = totalAmount * 100; // Amount in paise
    if (paymentOption === "onlinePayment") {
      const options = {
        amount: totalAmount * 100,
        currency: currency || "INR",
        receipt: "receipt_order_1",
        notes: {},
      };
      const order = await instance.orders.create(options);
      return res.json({ order, paymentOption, amount, currency });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    console.log("verify");
    const userId = req.session.userId;
    const {
      payment,
      order,
      paymentOption,
      selectedMobile,
      selectedHouseName,
      selectedStreet,
      selectedCity,
      selectedPincode,
      selectedState,
      paymentMethod,
    } = req.body;
    console.log("reqqqq", req.body.order.order.amount);
    const userCart = await Cart.findOne({ userId }).populate("items.productId");
    const items = userCart.items;
    let userWallet = await wallet.findOne({ userId });
    const user = await UserCollection.findById(userId);
    const userAddresses = user.address;
    const inStockItems = items.filter(
      (item) => item.productId.totalQuantity > 0
    );

    const categories = await Category.find();
    const hasItemWithQuantity = items.some(
      (item) => item.productId.totalQuantity > 0
    );
    console.log("req.body", req.body);
    const hmac = crypto
      .createHmac("sha256", "CAsjacYIhSgXaOzUGy1nlZXN")
      .update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id)
      .digest("hex");
    console.log("hmac", hmac);
    console.log("signature", payment.razorpay_signature);
    if (hmac === payment.razorpay_signature) {
      console.log("hmac true");
      const userId = req.session.userId;
      let totalAmount = order.amount;
      if (!hasItemWithQuantity) {
        console.log("hmac false");
        return res.render("checkOutPage", {
          user,
          userAddresses,
          totalPrice,
          items,
          categories,
          errorMessage: "Selected item must be in available",
        });
      }
      for (const item of inStockItems) {
        const productId = item.productId._id;
        const quantityToReduce = item.quantity;

        await Product.updateOne(
          { _id: productId },
          { $inc: { totalQuantity: -quantityToReduce } }
        );
      }
      console.log("before save");
      const newOrder = new orders({
        customer: userId,
        address: {
          mobile: selectedMobile,
          houseName: selectedHouseName,
          street: selectedStreet,
          city: selectedCity,
          pincode: selectedPincode,
          state: selectedState,
        },
        items: items
          .filter((item) => item.productId.totalQuantity > 0)
          .map((item) => ({
            product: item.productId._id,
            quantity: item.quantity,
          })),

        totalAmount: req.body.order.order.amount / 100,
        OrderStatus: "Order Placed",
        paymentMethod: paymentOption,

        orderId: generateOrderId(),
      });
      if (req.session.coupon) {
        newOrder.couponApplied = req.session.coupon;
        await newOrder.save();
        delete req.session.coupon;
      } else {
        await newOrder.save();
      }
      console.log("verify end");
      return res.json({ status: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server on verifying" });
  }
};

const retryPayment = async (req, res) => {
  try {
      // Retrieve the order ID from the request parameters
      const orderId = req.params.orderId;

      // Render the retryPayment view and pass the orderId to the template
      res.render("retryPayment", { orderId });
  } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
  }
}



   


const userOrderPlaced = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.userId;
      const page = parseInt(req.query.page) || 1; // Get page number from query parameter, default to 1 if not provided
      const limit = 10; // Number of orders per page
      const skip = (page - 1) * limit;

      // Retrieve the user's cart and populate the items with product information
      const userCart = await Cart.findOne({ userId }).populate("items.productId");
      
      // Initialize items to an empty array as a fallback in case userCart is null
      const items = userCart ? userCart.items : [];

      // Increment the popularity of each product in the items
      for (const item of items) {
        const productId = item.productId;
        // Find the product by its ID
        const product = await Product.findById(productId);
        if (product) {
          // Increment the popularity field
          product.popularity += 1;
          // Save the updated product back to the database
          await product.save();
        }
      }

      // Retrieve the total number of orders and user orders for the current page
      const totalOrders = await orders.countDocuments({ customer: userId });
      const userOrders = await orders
        .find({ customer: userId })
        .populate([
          { path: "items.product" },
          { path: "couponApplied" }, // Populate coupon details
        ])
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit);

      // Determine if there are no orders yet
      const noOrdersYet = userOrders.length === 0;

      // Render the 'userOrderPlaced' view and pass the necessary data
      res.render("userOrderPlaced", {
        items,
        userOrders,
        userId,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        noOrdersYet, // Pass the flag to the template
      });
    } else {
      // Redirect to the home page if the user is not logged in
      res.redirect("/");
    }
  } catch (error) {
    console.log(error);
    // Handle any errors and respond appropriately
    res.status(500).send("An error occurred while processing your request.");
  }
};

const orderDetails = async (req, res) => {
  try {
    const userId = req.session.userId;
    const orderId = req.params.orderId;
    const userOrders = await orders
      .findOne({ orderId })
      .populate("items.product")
      .populate("couponApplied"); // Populate coupon details
    console.log(userOrders);

    const userCart = await Cart.findOne({ userId }).populate("items.productId");
    const items = userCart ? userCart.items : [];

    if (!userOrders) {
      return res.status(404).send("Order not found");
    }

    const firstOrder = userOrders;

    const customerName = firstOrder.customer.name;
    const deliveryAddress = `${firstOrder.address.houseName}, ${firstOrder.address.street}, ${firstOrder.address.city}, ${firstOrder.address.state}, ${firstOrder.address.pincode}`;
    const paymentMethod = firstOrder.paymentMethod;
    const totalAmount = userOrders.totalAmount;

    // Extract coupon details
    const couponApplied = userOrders.couponApplied;

    res.render("userOrderDetails", {
      orderId,
      items,
      userOrders,
      userId,
      customerName,
      deliveryAddress,
      totalAmount,
      paymentMethod,
      couponApplied, // Pass coupon details to the view
    });
  } catch (error) {
    console.log(error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const userId = req.session.userId;

    const order = await orders.findById(orderId).populate("items.product");

    for (const item of order.items) {
      if (item.product.totalQuantity > 0) {
        item.product.totalQuantity += item.quantity;
        await item.product.save();
      }
    }

    order.OrderStatus = "Cancelled";

    await order.save();
    let userWallet = await wallet.findOne({ userId: userId });
    if (!userWallet) {
      userWallet = new wallet({
        userId: order.customer,
        balance: 0,
        transactionHistory: [],
      });
      await userWallet.save();
    }

    userWallet.balance += order.totalAmount;
    userWallet.transactionHistory.push({
      transaction: "Money Added",
      amount: order.totalAmount,
    });
    await userWallet.save();

    res.redirect("/userOrderPlaced");
  } catch (error) {
    console.log(error);

    res.status(500).send("Internal Server Error");
  }
};

const userSuccess = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.userId;

      const latestOrder = await orders
        .findOne({ customer: userId })
        .sort({ orderDate: -1 })
        .populate("items.product");

      res.render("userSuccess", { latestOrder, userId });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error);

    res.status(500).send("Internal Server Error");
  }
};

function generateOrderId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000);
}

const addToCart = async (req, res) => {
  try {
    console.log("inside add to cart");
    const productId = req.params.id;
    const userId = req.session.userId;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    let userCart = await Cart.findOne({ userId });

    if (!userCart) {
      userCart = await Cart.create({ userId });
    }

    const existingItem = userCart.items.find((item) =>
      item.productId.equals(productId)
    );

    if (existingItem) {
      console.log("Product is already in the cart.");
    } else {
      userCart.items.push({ productId, quantity: 1 });
    }

    await userCart.save();

    return res.redirect("/userCart");
  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const removeFromCart = async (req, res) => {
  const productId = req.params.productId;
  const userId = req.session.userId;

  try {
    const cart = await Cart.findOne({ userId: userId });

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex !== -1) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
    }

    res.redirect("/userCart");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Profile

const userProfile = async (req, res) => {
  try {
    const userId = req.session.userId;

    const userToken = randomstring.generate();

    await UserCollection.findByIdAndUpdate(userId, { userToken });

    const Usercollection = await UserCollection.findById(userId);

    if (req.session.user) {
      res.render("userProfile", { Usercollection, userToken });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const showChangePassword = async (req, res) => {
  try {
    res.render("resetPassword", { message: "" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const handleResetPassword = async (req, res) => {
  try {
    const userId = req.session.userId;

    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await UserCollection.findById(userId);

    if (newPassword !== confirmPassword) {
      return res.render("resetPassword", {
        message: "Passwords do not match",
      });
    }
    if (user.password !== currentPassword) {
      return res.render("userForgetPass", {
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.redirect("/userProfile?message=Successfully%20Changed%20Password");
  } catch (error) {
    console.error(error);
    res.render("resetPassword", { message: "An error occurred" });
  }
};

const registerPass = (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    res.render("userProfile");
  }
};

const userAddress = async (req, res) => {
  try {
    console.log("Inside the address save");
    const userId = req.session.userId;
    const { mobile, houseName, street, city, pinCode, state } = req.body;
    console.log(req.body);

    const mobileNumber = parseInt(mobile, 10);

    const updatedUser = await UserCollection.findByIdAndUpdate(
      userId,
      {
        $push: {
          address: {
            mobile: mobile,
            houseName: houseName,
            street: street,
            city: city,
            pincode: pinCode,
            state: state,
          },
        },
      },
      { new: true }
    );

    res.redirect("/userProfile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const addAddressPage = async (req, res) => {
  console.log(req.session.userId);
  let userId = req.session.userId;

  const Usercollections = await UserCollection.findById(userId);
  try {
    if (req.session.user) {
      res.render("userAddressEdit", { Usercollections });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error);
  }
};

const addAddress = async (req, res) => {
  try {
    console.log("Inside the address save");
    const userId = req.session.userId;
    const { mobile, houseName, street, city, pinCode, state } = req.body;
    console.log(req.body);

    const mobileNumber = parseInt(mobile, 10);

    const updatedUser = await UserCollection.findByIdAndUpdate(
      userId,
      {
        $push: {
          address: {
            mobile: mobileNumber,
            houseName: houseName,
            street: street,
            city: city,
            pincode: pinCode,
            state: state,
          },
        },
      },
      { new: true }
    );

    res.redirect("/userProfile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const addAddressToCart = async (req, res) => {
  try {
    console.log("Inside the address save");
    const userId = req.session.userId;
    const { mobile, houseName, street, city, pinCode, state } = req.body;
    console.log(req.body);

    const mobileNumber = parseInt(mobile, 10);

    const updatedUser = await UserCollection.findByIdAndUpdate(
      userId,
      {
        $push: {
          address: {
            mobile: mobile,
            houseName: houseName,
            street: street,
            city: city,
            pincode: pinCode,
            state: state,
          },
        },
      },
      { new: true }
    );

    res.redirect("/userProfile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const addAddressToCartPage = async (req, res) => {
  console.log(req.session.userId);
  let userId = req.session.userId;

  const Usercollections = await UserCollection.findById(userId);
  try {
    if (req.session.user) {
      res.render("userAddressEdit", { Usercollections });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error);
  }
};

const userProfileEdit = (req, res) => {
  try {
    res.render("userAddressEdit");
  } catch (error) {}
};

const editaddress = async (req, res) => {
  console.log(req.session.userId);
  let userId = req.session.userId;
  let addressIndex = req.query.addressIndex;
  console.log("addressIndex", addressIndex);
  const Usercollections = await UserCollection.findById(userId);
  try {
    if (req.session.user) {
      res.render("editaddress", {
        address: Usercollections.address[addressIndex],
        addressIndex,
      });
    } else {
      res.redirect("/");
    }
  } catch (error) {}
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    let addressIndex = req.body.addressIndex;

    const updatedUser = await UserCollection.findByIdAndUpdate(
      userId,
      {
        $unset: {
          [`address.${addressIndex}`]: 1,
        },
      },
      { new: true }
    );

    updatedUser.address = updatedUser.address.filter(
      (address) => address !== null && address !== undefined
    );

    await updatedUser.save();

    res.json({
      message: "Address deleted successfully",
      updatedUser: {
        address: updatedUser.address,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { deleteAddress };

const saveEditAddress = async (req, res) => {
  try {
    console.log("Inside the address save");
    const userId = req.session.userId;
    let addressIndex = req.body.addressIndex;
    console.log("addressIndex", addressIndex);
    const { mobile, houseName, street, city, pinCode, state } = req.body;
    console.log(req.body);

    const mobileNumber = parseInt(mobile, 10);

    const updatedUser = await UserCollection.findByIdAndUpdate(
      userId,
      {
        $set: {
          [`address.${addressIndex}`]: {
            mobile: mobile,
            houseName: houseName,
            street: street,
            city: city,
            pincode: pinCode,
            state: state,
          },
        },
      },
      { new: true }
    );

    res.redirect("/userProfile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const wishlistCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).redirect("/");
    }

    const userCart = await Cart.findOne({ userId }).populate("items.productId");
    if (!userCart) {
      return res.render("wishlist", { cartItems: [], totalPrice });
    }
    const items = userCart.items || [];
    const totalPrice = calculateTotalPrice(items);

    res.render("wishlist", { cartItems: userCart.items, totalPrice });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const otpVerification = async (req, res) => {
  const enteredOTP = req.body.otp;
  const storedOTP = req.session.otp;

  if (enteredOTP === storedOTP) {
    const user1 = new UserCollection(req.session.userData);
    const userData = await user1.save();

    req.session.userData = null;
    req.session.otp = null;
    req.session.user = true / res.redirect("/login");
  } else {
    res.render("otp", {
      email: req.session.userData.email,
      errorMessage: "Invalid OTP",
    });
  }
};




const checkAndExpireOffers = async () => {
  try {
      console.log("in checking expirty")
      const expiredOffers = await offerSchema.find({
          isActive: true,
          endDate: { $lte: new Date() },
      });
      console.log('expiredOffers',expiredOffers)

      for (const offer of expiredOffers) {
          offer.isActive = false;
          await offer.save();

          if (offer.discountOn === 'category' && offer.selectedCategory) {
              const categoryId = offer.selectedCategory;
              const productsInCategory = await productSchema.find({ productCategory: categoryId });
              console.log("productsInCategory",productsInCategory)

              for (const product of productsInCategory) {
                  product.price = product.originalPrice;
                  product.originalPrice = 0;
                  product.discount = 0;
                  await product.save();
              }
          } else if (offer.discountOn === 'product' && offer.selectedProducts) {
              const productId = offer.selectedProducts;
              const product = await productSchema.findOne({ _id: productId });

              product.price = product.originalPrice;
              product.originalPrice = 0;
              product.discount = 0;
              await product.save();
          }
      }
  } catch (error) {
      console.error('Error checking and expiring offers:', error);
  }
};

const showOffers = async (req,res)=>{
  const allOffers = await offerSchema.find().populate('selectedCategory').populate('selectedProducts')
  let updateMessage = req.query.successMessage || ""
  try {
      await offerManagementController.checkAndExpireOffers();
      res.render('Admin/offerManagement',{allOffers,message:"",updateMessage})
  } catch (error) {
      console.error("Error during coupon showing:", error);
  res.status(500).send('Internal Server Error');
}
  
}


const generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId; // Order ID is received as a string
    const invoiceData = await orders.findOne({ orderId }).populate('customer').populate("items.product").populate('couponApplied');

    if (!invoiceData) {
      throw new Error('Order not found');
    }


    const doc = new PDFDocument();

    doc.font('Helvetica-Bold');
    doc.fontSize(18);

    const fileName = `invoice_${orderId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    // Title
    doc.text('Invoice', { align: 'center' });

    // Customer Information
    doc.fontSize(12).font('Helvetica');
    doc.moveDown().text('Bill To:');
    doc.text(`${invoiceData.customer.name}`);
    doc.text(`Address: ${invoiceData.address.houseName}`);
    doc.text(`${invoiceData.address.street},${invoiceData.address.city},${invoiceData.address.pincode},${invoiceData.address.state}`);
    doc.text(`Email: ${invoiceData.customer.email}`);
    doc.moveDown();
    doc.moveDown()

    // Products Table Header
    doc.fontSize(14).font('Helvetica-Bold');
    doc.moveDown();
    doc.text('Product', { align: 'left' });
    doc.moveUp();
    doc.text('Quantity', { align: 'center' });
    doc.moveUp();
    doc.text('Price(Rs)', { align: 'right' });
    doc.moveUp();

    // Products Table Body
    doc.fontSize(12).font('Helvetica');
    invoiceData.items.forEach(item => {
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();
      doc.text(item.product.productName, { align: 'left' });
      doc.moveUp();
      doc.text(item.quantity, { align: 'center' });
      doc.moveUp();
      doc.text(item.product.price, { align: 'right' });
      doc.moveUp();
    });

    // Coupon Details
    doc.fontSize(14).font('Helvetica');
    doc.moveDown()
    doc.moveDown()
    doc.moveDown()
    
// Check if a coupon was applied
if (invoiceData.couponApplied) {
  // Add text to the PDF with the coupon code
  doc.text(`Coupon Applied: ${invoiceData.couponApplied.code}`);
}
if (invoiceData.couponApplied) {
  // Add text to the PDF with the coupon code
  doc.text(`Coupon Applied: ${invoiceData.couponApplied.discountValue}`);
}
      
      
    

    // Invoice Total
    doc.fontSize(14).font('Helvetica-Bold');
    doc.moveDown()
    doc.moveDown()
    doc.moveDown()
   
    doc.text(`Total Amount: Rs.${invoiceData.totalAmount.toFixed(2)}`);

    // Invoice Footer
    doc.moveDown().text('Thank you for your purchase!. Team Elixr Cellars', { align: 'center' });
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating the invoice');
  }
};












const userLogout = (req, res) => {
  req.session.user = false;
  console.log(" user session ends");
  res.redirect("/");
};

module.exports = {
  // Login & Signup
  userLoginData,
  registerPass,
  userLogin,
  resetPassword,
  resetOtp,
  verifyOtp,
  postResetPassword,
  userSignup,
  showChangePassword,
  handleResetPassword,
  changePassword,
  changingPassword,
  registerUser,
  otp,
  otpVerification,
  resendOtp,
  userLogout,
  // Home & Shop
  userHome,
  userContact,
  userAbout,
  userProfile,
  userProfileEdit,
  
  addAddressToCart,
  addAddressToCartPage,
  addAddressPage,
  addAddress,
  userAddress,
  editaddress,
  saveEditAddress,
  deleteAddress,
  // Shop
  searchProduct,
  createOrder,
  categoryFilter,
  wishlistCart,
  userShop,
  userProductDetails,
  addToCart,
  userCart,
  updateQuantity,
  removeFromCart,
  // Checkout
  userCheckout,
  verifyPayment,
  handleCheckOut,
  userWallet,
  processPayment,
  retryPayment,
  userOrderPlaced,
  orderDetails,
  userSuccess,
  cancelOrder,
  // Coupon
  validateCoupon,
  cancelCoupon,
  // Offers
  checkAndExpireOffers,
  showOffers,
  // Report
  
  generateInvoice,


};







 
 




 

 









