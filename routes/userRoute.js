



const express = require('express');
const user_router = express.Router();
const userController = require('../Controllers/userController');


const requireLogin = (req, res, next) => {
  console.log("middleware")
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Public routes
user_router.get('/', userController.userHome);
user_router.get('/userShop', userController.userShop);
// Product Details Route
user_router.get('/userProductDetails/:id', userController.userProductDetails);
// About Route
user_router.get("/userAbout", userController.userAbout);
user_router.get('/search', userController.searchProduct)
user_router.get('/categoryfilter', userController.categoryFilter)
user_router.get('/userContact', userController.userContact)

// Login route
user_router.get('/login', userController.userLogin);
user_router.post('/loginData', userController.userLoginData)

// Signup routes
user_router.get('/signup', userController.registerUser);
user_router.post('/signup', userController.userSignup);
user_router.get('/otp', userController.otp);
user_router.post('/otp', userController.otpVerification);
user_router.get('/resetPassword', userController.resetPassword);
user_router.post('/postResetPassword',userController.postResetPassword)
user_router.get('/resetOtp', userController.resetOtp);
user_router.post('/verifyOtp', userController.verifyOtp);
user_router.get('/changePassword', userController.changePassword);
user_router.post('/changingPassword', userController.changingPassword);







// Secure routes (require login)
user_router.get('/userCart', requireLogin, userController.userCart);
user_router.post('/addToCart/:id', requireLogin, userController.addToCart);


user_router.post("/updateQuantity/:productId", requireLogin, userController.updateQuantity),
  user_router.get('/userProfile', requireLogin, userController.userProfile),
  user_router.get('/wishlist', requireLogin, userController.wishlistCart);



user_router.get('/resetPassword', requireLogin, userController.showChangePassword);
user_router.post('/resetPassword', requireLogin, userController.handleResetPassword);

user_router.get('/userAddress', requireLogin, userController.userAddress);

user_router.post('/userAddress', requireLogin, userController.userAddress);
user_router.get('/userAddressEdit', requireLogin, userController.addAddress)
user_router.post('/userAddressEdit', requireLogin, userController.saveEditAddress)
user_router.post('/deleteAddress', requireLogin, userController.deleteAddress)
user_router.post('/userAddressToCart', requireLogin, userController.addAddressToCart)
user_router.get('/addaddress', requireLogin, userController.addAddressToCartPage)
user_router.get('/editaddress', requireLogin, userController.editaddress)
user_router.post('/editaddress', requireLogin, userController. saveEditAddress)
//checkOut

user_router.get('/userCheckout', requireLogin, userController.userCheckout)

user_router.post('/userCheckout', requireLogin, userController.handleCheckOut)
user_router.post('/validateCoupon', requireLogin, userController.validateCoupon)
user_router.post('/cancelCoupon', requireLogin, userController.cancelCoupon)
user_router.post('/createOrder', requireLogin, userController.createOrder)
user_router.post('/verifyPayment',userController.verifyPayment)
user_router.get('/userOrderPlaced', requireLogin, userController.userOrderPlaced)

user_router.get('/userOrderDetails/:orderId', requireLogin,userController.orderDetails)
user_router.post('/cancelOrder', requireLogin, userController.cancelOrder);
user_router.get('/userWallet', requireLogin, userController.userWallet);

user_router.get('/removeFromCart/:productId', requireLogin, userController.removeFromCart);

user_router.get('/userSuccess', requireLogin, userController.userSuccess)















// Logout route
user_router.get('/logout', userController.userLogout);

module.exports = user_router;
