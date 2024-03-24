

const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const UserCollection = require('../Model/userModel');
const Product = require('../Model/productsModel')
const Cart = require('../Model/cartModel');
const orders = require('../Model/orderModel')
const wallet = require('../Model/walletModel')
const Category = require('../Model/categoryModel');
const mongoose = require('mongoose');

const Razorpay = require('razorpay');
const crypto = require("crypto");
require('dotenv').config();
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });


const userLogin = async (req, res) => {
    if (req.session.user) {
        res.redirect('/');
    } else {
        res.render('userlogin', { passwordError: '' });
    }
};

const userLoginData = async (req, res) => {
    try {

        const { userEmail, password } = req.body
        console.log(userEmail)
        const user = await UserCollection.findOne({ email: userEmail })
        if (user && !user.isBlocked) {
            if (user.email == userEmail && user.password == password) {
                req.session.user = true;
                req.session.userId = user._id
                res.redirect('/')
            } else {
                res.render('userlogin', { passwordError: 'Invalid passWord' })
            }

        } else {
            res.render('userlogin', { passwordError: 'Invalid User' })
        }

    } catch (error) {
        console.log(error)
    }
}



// Shop
const userHome = async (req, res) => {
    try {
        let productId = req.params.id
        const randomProducts = await Product.aggregate([{ $sample: { size: 4 } }]);
        const products = await Product.findById(productId)

        res.render('userHome', { products, randomProducts })
    } catch (error) {
        console.error('Error', error)
        res.status(500).send('Internal server Error')
    }

}


const userProductDetails = async (req, res) => {
    try {
        let productId = req.params.id
        const product = await Product.findById(productId)

        res.render('userProductDetails', { product })
    } catch (error) {
        console.error('Error', error)
        res.status(500).send('Internal server Error')
    }

}

// About
const userAbout = (req, res) => {
    res.render('userAbout')
}

// Generate OTP
const generateOTP = () => {
    return randomstring.generate({
        length: 6,
        charset: 'numeric'
    });
};

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'puobyt@gmail.com',
        pass: 'nipo nwem rxhc eevm'
    }
});

// Send OTP via email
const sendOTP = (email, otp, req) => {
    const mailOptions = {
        from: 'puobyt@gmail.com',
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP for registration is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

const registerUser = (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('usersignup');
    }
};

const userSignup = async (req, res) => {
    try {
        let user1 = {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        };

        const email = req.body.email;

        const userCheck = await UserCollection.findOne({ email: email });

        if (userCheck) {
            res.render('usersignup', { regerstrationMessage: "Email Already exists" });
        } else {
            const otp = generateOTP();
            sendOTP(email, otp, req);


            req.session.userData = user1;
            req.session.otp = otp;

            res.redirect('/otp');
        }
    } catch (error) {
        res.render('usersignup', { regerstrationMessage: "Registration Successful, please verify your email" });
        console.log(error);
    }
};

const otp = (req, res) => {
    res.render('otp', { email: req.session.userData.email, errorMessage: "" });
};





const userShop = async (req, res) => {
    try {
        console.log("Try working");
        let sortQuery = {};
        const categories = await Category.find();

        const sortBy = req.query.sortBy;
        switch (sortBy) {
            case 'price_asc':
                sortQuery = { price: 1 };
                break;
            case 'price_desc':
                sortQuery = { price: -1 };
                break;
            case 'name_asc':
                sortQuery = { productName: 1 };
                break;
            case 'name_desc':
                sortQuery = { productName: -1 };
                break;
            case 'popularity_desc':
                sortQuery = { popularity: -1 };
                break;
            default:
                break;
        }

        const products = await Product.find().sort(sortQuery);
        res.render('userShop', { products,categories });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const categoryFilter = async (req, res) => {
    try {
        
        

        
        const category = req.query.category;
        console.log(category)
        const categories = await Category.findById(category).populate('products');
        console.log(categories.products)

        
        let categoryQuery = {};

        
        // if (category) {
        //     // Assuming your `Category` model has a field named `products`
        //     // that contains an array of product IDs associated with the category
        //     categoryQuery = { products: mongoose.Types.ObjectId(category) };
        // }

        // Fetch products based on the category query
        // const products = await Product.find(categoryQuery);

        // Render the 'userShop' view with the filtered products and all categories
        res.render('userShop', { products:categories.products, categories:categories.products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};








const searchProduct = async (req, res) => {
    try {
        console.log("search working")
        let products;

        const query = req.query.query || '';
        const category = req.query.category || '';


        const filter = {
            productName: { $regex: new RegExp(`^${query}`, 'i') },
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
        res.render('userShop', { products, categories });

    } catch (error) {
        console.log(error);
    }
};

const userContact = (req, res) => {
    try {

        res.render('userContact')

    } catch (error) {
        console.log(error)
    }
}



const userWallet = async (req, res) => {
    try {
        const userId = req.session.userId;

        const userWallet = await wallet.findOne({ userId })
        console.log("userWallet", userWallet.transactionHistory);

        res.render('userWallet', { userWallet })

    } catch (error) {
        console.log(error)
    }
}

const processPayment = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { paymentMethod, totalPrice } = req.body;

        
        // Deduct the total price from the user's wallet balance
        const userWallet = await wallet.findOneAndUpdate(
            { userId },
            { $inc: { balance: -totalPrice } },
            { new: true }
        );

       
        const newTransaction = {
            transaction: "Money Deducted",
            amount: totalPrice
        };

        userWallet.transactionHistory.push(newTransaction);
        await userWallet.save();

        // Redirect or respond based on the success of payment process
        res.redirect('/checkout/success'); 
    } catch (error) {
        console.log(error);
        // Handle error response
        res.status(500).send("Internal Server Error");
    }
}





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
            return res.status(401).redirect('/');
        }

        const products = await Product.find({});
        let totalQuantity = 0;
        products.forEach(product => {
            totalQuantity += product.totalQuantity;
        });

        const userCart = await Cart.findOne({ userId }).populate('items.productId');
        if (!userCart) {
            return res.render('userCart', { cartItems: [], totalPrice: 0, totalQuantity ,products });
        }
        const items = userCart.items || [];
        
        const totalPrice = calculateTotalPrice(items);
        console.log("user cart", userCart.items)

        res.render('userCart', { cartItems: userCart.items, totalPrice,totalQuantity,products});
    } catch (error) {
        console.error('Error fetching user cart:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


const updateQuantity = async (req, res) => {
    try {
        const userId = req.session.userId;
        const productId = req.params.productId;
        const newQuantity = req.body.quantity;

        if (newQuantity < 1 || newQuantity > 5) {
            return res.status(400).json({ error: "Invalid quantity. Please choose a quantity between 1 and 5." });
        }


        const updatedCart = await Cart.findOneAndUpdate(
            { userId, "items.productId": productId },
            { $set: { "items.$.quantity": newQuantity } },
            { new: true }
        ).populate("items.productId");


        const updatedProduct = updatedCart.items.find(item => item.productId._id.toString() === productId);
        console.log(updatedCart.items)
        res.json({
            message: "Quantity updated successfully",
            updatedProduct: {
                _id: updatedProduct.productId._id,
                price: updatedProduct.productId.price,
                cartItems: updatedCart.items
            },

        });
    } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const userCheckout = async (req, res) => {

    let userId = req.session.userId;
    const userCart = await Cart.findOne({ userId }).populate('items.productId');
    const Usercollections = await UserCollection.findById(userId)
    try {
        if (req.session.user) {
            const items = userCart.items || [];
            const totalPrice = calculateTotalPrice(items);
            console.log(userCart)
            res.render("userCheckout", { Usercollections, totalPrice, userCart })

        }
        else {
            res.redirect('/')
        }
    } catch (error) {
        console.log(error)
    }
}






const handleCheckOut = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await UserCollection.findById(userId);
        const userCart = await Cart.findOne({ userId }).populate('items.productId');
        const items = userCart.items;
        const addressIndex = req.body.selectedAddress;

        const userAddresses = user.address[addressIndex];
        const { paymentMethod, totalPrice } = req.body;

        if (paymentMethod === 'walletPayment') {
            // Check if user has sufficient balance
            const userWallet = await wallet.findOne({ userId });
            if (userWallet.balance < totalPrice) {
                return res.status(400).send("Insufficient balance in wallet.");
            }

            // Deduct the total price from user's wallet balance
            userWallet.balance -= totalPrice;

            // Add transaction history for money deduction
            userWallet.transactionHistory.push({
                transaction: "Money Deducted",
                amount: totalPrice
            });
            // Save the updated wallet
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
                                .filter(item => item.productId.totalQuantity > 0)
                                .map(item => ({
                                    product: item.productId._id,
                                    quantity: item.quantity
                                })),
                            totalAmount: totalPrice,
                            OrderStatus: 'Order Placed',
                            paymentMethod: paymentMethod,
                            orderId: generateOrderId(),
                        });
                
                
                        await newOrder.save();
                
                
                        for (const item of items) {
                            if (item.productId.totalQuantity > 0) {
                                item.productId.totalQuantity -= item.quantity;
                                await item.productId.save();
                            }
                        }

        }
        if (paymentMethod === 'COD'){
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
                    .filter(item => item.productId.totalQuantity > 0)
                    .map(item => ({
                        product: item.productId._id,
                        quantity: item.quantity
                    })),
                totalAmount: totalPrice,
                OrderStatus: 'Order Placed',
                paymentMethod: paymentMethod,
                orderId: generateOrderId(),
            });
    
    
            await newOrder.save();
    
    
            for (const item of items) {
                if (item.productId.totalQuantity > 0) {
                    item.productId.totalQuantity -= item.quantity;
                    await item.productId.save();
                }
            }

        }

        

        // Redirect to success page
        res.redirect('/userSuccess');
    } catch (error) {
        console.log(error);
        // Handle the error as needed
        res.status(500).send("Internal Server Error");
    }
};





const createOrder = async(req,res)=>{
    const userId = req.session.userId;
    let { paymentOption, totalAmount, currency,razorpay_order_id, razorpay_signature } = req.body;
    try {
        
        const amount = totalAmount*100
        if(paymentOption==="onlinePayment"){
            const options = {
                amount: totalAmount * 100, // Amount in paise
                currency: currency || 'INR',
                receipt: 'receipt_order_1',
                notes: {},
              };
            const order = await instance.orders.create(options);
            return res.json({order,paymentOption,amount,currency}); 
        }
    } catch (error) {
        console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
    }
}

const verifyPayment = async(req,res)=>{
    try {
        console.log("verify");
    const userId = req.session.userId;
      const {payment,order,paymentOption, selectedMobile, selectedHouseName, selectedStreet, selectedCity, selectedPincode, selectedState, paymentMethod } = req.body;
      const userCart = await Cart.findOne({ userId }).populate('items.productId');
      const items = userCart.items;
      let userWallet = await wallet.findOne({userId})
    const user = await UserCollection.findById(userId);
    const userAddresses = user.address;
    const inStockItems = items.filter(item => item.productId.totalQuantity > 0);
    const updatedTotalPrice = req.session.updatedTotalPrice;
    const categories = await Category.find()
    const hasItemWithQuantity = items.some(item => item.productId.totalQuantity > 0);
    console.log("req.body",req.body)
    const hmac = crypto
      .createHmac("sha256", "CAsjacYIhSgXaOzUGy1nlZXN")
      .update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id)
      .digest("hex");
      console.log("hmac",hmac)
      console.log("signature",payment.razorpay_signature)
      if(hmac===payment.razorpay_signature){
        console.log("hmac true")
        const userId = req.session.userId;
        let totalAmount=order.amount
        if (!hasItemWithQuantity) {
            console.log("hmac false")
            return res.render('checkOutPage', { user, userAddresses, totalPrice, items, categories, errorMessage: 'Selected item must be in available' });
          }
        for (const item of inStockItems) {
            const productId = item.productId._id;
            const quantityToReduce = item.quantity;
      
            // Update product quantity in the database
            await Product.updateOne({ _id: productId }, { $inc: { totalQuantity: -quantityToReduce } });
        }
        console.log("before save")
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
            .filter(item => item.productId.totalQuantity > 0)
            .map(item => ({
              product: item.productId._id,
              quantity: item.quantity
            })),
           
            totalAmount: updatedTotalPrice,
            OrderStatus: 'Order Placed',
            paymentMethod: paymentOption,
            orderId: generateOrderId(),
          });
          console.log("new order",newOrder)
          await newOrder.save();
          console.log("verify end");
        return res.json({ status: true})
      }


    } catch (error) {
        console.log(error);
    res.status(500).json({ error: "Internal server on verifying" });
    }
}



const userOrderPlaced = async (req, res) => {
    try {

        if (req.session.user) {
            const userId = req.session.userId;
            const userCart = await Cart.findOne({ userId }).populate('items.productId');
            const items = userCart.items;

            const userOrders = await orders.find({ customer: userId }).populate('items.product').sort({ orderDate: -1 });



            res.render('userOrderPlaced', { items, userOrders, userId });
        } else {
            res.redirect('/')
        }
    } catch (error) {
        console.log(error)
    }
}

const orderDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orderId = req.params.orderId;
        const userOrders = await orders.findOne({orderId}).populate('items.product')
        const userCart = await Cart.findOne({ userId }).populate('items.productId');
        const items = userCart ? userCart.items : [];

         if (!userOrders) {
          
            return res.status(404).send('Order not found');
        }

       
        const firstOrder = userOrders; 
       

        const customerName = firstOrder.customer.name; 
        const deliveryAddress = `${firstOrder.address.houseName}, ${firstOrder.address.street}, ${firstOrder.address.city}, ${firstOrder.address.state}, ${firstOrder.address.pincode}`;
        const paymentMethod = firstOrder.paymentMethod;
        const totalAmount=userOrders.totalAmount

        res.render('userOrderDetails', { items, userOrders, userId, customerName, deliveryAddress, totalAmount, paymentMethod });


    } catch (error) {
        console.log(error)
    }
}

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        const userId = req.session.userId


        const order = await orders.findById(orderId);

        // // Check if the order exists and if it's associated with the current user
        // if (!order || order.customer !== userId) {
        //     return res.status(404).send("Order not found");
        // }

        // // Restore product stock for each item in the canceled order
        // for (const item of order.items) {
        //     const product = await Product.findById(item.product);
        //     if (product) {
        //         // Increment the product stock by the quantity canceled
        //         product.stock += item.quantity;
        //         await product.save();
        //     }
        // }


        order.OrderStatus = 'Cancelled';


        await order.save();
        let userWallet = await wallet.findOne({ userId: userId })
        if (!userWallet) {
            userWallet = new wallet({
                userId: order.customer,
                balance: 0,
                transactionHistory: []
            })
            await userWallet.save();
        }


        userWallet.balance += order.totalAmount;
        userWallet.transactionHistory.push({
            transaction: 'Money Added',
            amount: order.totalAmount,
        });
        await userWallet.save();


        res.redirect('/userOrderPlaced');
    } catch (error) {
        console.log(error);

        res.status(500).send("Internal Server Error");
    }
};


const userSuccess = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.userId;

            const latestOrder = await orders.findOne({ customer: userId }).sort({ orderDate: -1 }).populate('items.product');




            res.render('userSuccess', { latestOrder, userId });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log(error);

        res.status(500).send('Internal Server Error');
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
            return res.status(400).json({ error: 'Product ID is required.' });
        }


        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }


        let userCart = await Cart.findOne({ userId });

        if (!userCart) {
            userCart = await Cart.create({ userId });
        }

        //  if the product is already in the cart
        const existingItem = userCart.items.find(item => item.productId.equals(productId));

        if (existingItem) {

            console.log("Product is already in the cart.");
        } else {

            userCart.items.push({ productId, quantity: 1 });
        }


        await userCart.save();

        return res.redirect('/userShop');
    } catch (error) {
        console.error('Error adding product to cart:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const removeFromCart = async (req, res) => {
    const productId = req.params.productId;
    const userId = req.session.userId;

    try {



        const cart = await Cart.findOne({ userId: userId });


        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);


        if (itemIndex !== -1) {
            cart.items.splice(itemIndex, 1);
            await cart.save();
        }

        res.redirect('/userCart');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
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

            res.render('userProfile', { Usercollection, userToken });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const showChangePassword = async (req, res) => {
    try {


        res.render("resetPassword", { message: "", });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
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



            return res.render("resetPassword", {
                message: "Current password is incorrect",
            });
        }


        user.password = newPassword;
        await user.save();


        res.redirect('/userProfile?message=Successfully%20Changed%20Password');
    } catch (error) {
        console.error(error);
        res.render("resetPassword", { message: "An error occurred" });
    }
};






const registerPass = (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('userProfile');
    }
};


const userAddress = async (req, res) => {
    try {
        console.log("Inside the address save");
        const userId = req.session.userId;
        const { mobile, houseName, street, city, pinCode, state } = req.body;
        console.log(req.body)

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

        res.redirect('/userProfile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




const addAddressPage = async (req, res) => {
    console.log(req.session.userId)
    let userId = req.session.userId;

    const Usercollections = await UserCollection.findById(userId)
    try {
        if (req.session.user) {
            res.render("userAddressEdit", { Usercollections })

        } else {
            res.redirect('/')
        }
    } catch (error) {
        console.log(error)
    }
}

const addAddress = async (req, res) => {

    try {
        console.log("Inside the address save");
        const userId = req.session.userId;
        const { mobile, houseName, street, city, pinCode, state } = req.body;
        console.log(req.body)

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

        res.redirect('/userProfile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
const addAddressToCart= async (req, res) => {

        try {
            console.log("Inside the address save");
            const userId = req.session.userId;
            const { mobile, houseName, street, city, pinCode, state } = req.body;
            console.log(req.body)
    
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
    
            res.redirect('/userProfile');
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    };

   const  addAddressToCartPage= async (req, res) => {
    console.log(req.session.userId)
    let userId = req.session.userId;

    const Usercollections = await UserCollection.findById(userId)
    try {
        if (req.session.user) {
            res.render("userAddressEdit", { Usercollections })

        } else {
            res.redirect('/')
        }
    } catch (error) {
        console.log(error)
    }
}





const userProfileEdit = (req, res) => {
    try {
        res.render('userAddressEdit')
    } catch (error) {

    }
}

const editaddress = async (req, res) => {
    console.log(req.session.userId)
    let userId = req.session.userId;
    let addressIndex = req.query.addressIndex
    console.log("addressIndex", addressIndex)
    const Usercollections = await UserCollection.findById(userId)
    try {
        if (req.session.user) {
            res.render("editaddress", { address: Usercollections.address[addressIndex], addressIndex })
        } else {
            res.redirect('/')
        }
    }
    catch (error) {

    }
}

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


        updatedUser.address = updatedUser.address.filter((address) => address !== null && address !== undefined);

        await updatedUser.save();

        res.json({
            message: 'Address deleted successfully',
            updatedUser: {
                address: updatedUser.address,

            },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { deleteAddress };



const saveEditAddress = async (req, res) => {
    try {
        console.log("Inside the address save");
        const userId = req.session.userId;
        let addressIndex = req.body.addressIndex
        console.log("addressIndex", addressIndex)
        const { mobile, houseName, street, city, pinCode, state } = req.body;
        console.log(req.body)

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

        res.redirect('/userProfile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

const wishlistCart = async (req, res) => {
    try {

        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).redirect('/');
        }


        const userCart = await Cart.findOne({ userId }).populate('items.productId');
        if (!userCart) {
            return res.render('wishlist', { cartItems: [], totalPrice });
        }
        const items = userCart.items || [];
        const totalPrice = calculateTotalPrice(items);


        res.render('wishlist', { cartItems: userCart.items, totalPrice });
    } catch (error) {
        console.error('Error fetching user cart:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
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
        req.session.user = true
            /
            res.redirect('/home')
    } else {

        res.render('otp', { email: req.session.userData.email, errorMessage: 'Invalid OTP' });
    }
};



const userLogout = (req, res) => {
    req.session.user = false;
    console.log(' user session ends');
    res.redirect('/');
};

module.exports = {
    addToCart,
    userLoginData,
    userContact,
    userCart,
    addAddressToCart,
    addAddressToCartPage,
    updateQuantity,
    removeFromCart,
    userCheckout,
    createOrder,
    verifyPayment,
    userProfile,
    showChangePassword,
    handleResetPassword,
    registerPass,
    addAddressPage,
    addAddress,
    userAddress,
    userProfileEdit,
    editaddress,
    saveEditAddress,
    deleteAddress,
    userShop,
    categoryFilter,
    userLogin,
    userSignup,
    userHome,
    userProductDetails,
    userAbout,
    registerUser,
    otp,
    otpVerification,
    userLogout,
    searchProduct,
    handleCheckOut,
    userOrderPlaced,
    orderDetails,
    userSuccess,
    cancelOrder,
    userWallet,
    processPayment,
    wishlistCart,
};