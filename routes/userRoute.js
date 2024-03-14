



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
user_router.get("/userAbout",userController.userAbout);
user_router.get('/search',userController.searchProduct)
user_router.get('/userContact',userController.userContact)

// Login route
user_router.get('/login', userController.userLogin);
user_router.post('/loginData',userController.userLoginData)

// Signup routes
user_router.get('/signup', userController.registerUser);
user_router.post('/signup', userController.userSignup);
user_router.get('/otp', userController.otp);
user_router.post('/otp', userController.otpVerification);






// Secure routes (require login)
user_router.get('/userCart', requireLogin, userController.userCart);
user_router.post('/addToCart/:id', requireLogin, userController.addToCart);


user_router.post("/updateQuantity/:productId",requireLogin,userController.updateQuantity),
user_router.get('/userProfile',requireLogin,userController.userProfile),
user_router.get('/wishlist',requireLogin, userController.wishlistCart);



user_router.get('/resetPassword', requireLogin, userController.showChangePassword);
user_router.post('/resetPassword', requireLogin, userController.handleResetPassword);


user_router.post('/userAddress',requireLogin, userController.userAddress);
user_router.get('/editaddress',requireLogin,userController.editaddress)
user_router.post('/editaddress',requireLogin,userController.saveEditAddress)
user_router.post('/deleteAddress',requireLogin,userController.deleteAddress)
user_router.post('/userAddressEdit',requireLogin,userController.addAddress)
user_router.get('/userAddressEdit',requireLogin,userController.addAddressPage)
//checkOut
user_router.get('/userCheckout',requireLogin,userController.userCheckout)
user_router.post('/userCheckout',requireLogin,userController.handleCheckOut)
user_router.get('/userOrderPlaced',requireLogin,userController.userOrderPlaced)
user_router.post('/userOrderPlaced',requireLogin,userController.userOrderPlaced)
user_router.get('/userOrderDetails',userController.orderDetails)
user_router.post('/cancelOrder',requireLogin, userController.cancelOrder);
user_router.get('/userWallet',requireLogin, userController.userWallet);

// user_router.post('/addToCart/:id',requireLogin,userController.addToCart)
user_router.get('/removeFromCart/:productId',requireLogin, userController.removeFromCart);

user_router.get('/userSuccess',requireLogin,userController.userSuccess)















// Logout route
user_router.get('/logout', userController.userLogout);

module.exports = user_router;
