const UserCollection = require("../Model/userModel");
const AdminCollection = require("../Model/adminModel");

const categories = require("../Model/categoryModel");
const products = require("../Model/productsModel");
const users = require("../Model/userModel");
const orders = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");
const offer = require("../Model/offerModel");
const wallet = require("../Model/walletModel");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");
const sharp = require('sharp');





const mongoose = require("mongoose");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/productImg");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
      fieldSize: 1024 * 1024 * 10 // Adjust the field size limit as needed (e.g., 10 MB)
  }
});



// Admin Login
const adminLogin = (req, res) => {
  if (req.session.admin) {
    res.redirect("/adminhome");
  } else {
    res.render("adminlogin");
  }
};



// Admin validation
const adminVerification = async (req, res) => {
  try {
    email = req.body.email;
    let adminExists = await AdminCollection.findOne({ email: email });
    if (
      req.body.email == adminExists.email &&
      req.body.password == adminExists.password
    ) {
      req.session.admin = req.body.email;
      console.log("Admin session created");
      res.redirect("/adminhome");
    } else {
      res.render("adminlogin", { wrong: "Wrong Username or Password" });
    }
  } catch (error) {
    console.log(error);
  }
};

// Admin HomePage
const adminHome = async (req, res) => {
  if (req.session.admin) {
      try {
          let search = "";
          if (req.query.search) {
              search = req.query.search;
          }
          
          // Fetch user data based on search query
          const userData = await UserCollection.find({
              $or: [
                  { name: { $regex: "^" + search + ".*", $options: "i" } },
                  { email: { $regex: "^" + search + ".*", $options: "i" } },
              ],
          });
          
          // Fetch popular products
          const popular = await products.find({ isListed: true })
              .sort({ popularity: -1 })
              .limit(5);
          
          // Render the view with both user data and popular products
          res.render("adminhome", { details: userData, popular: popular });
      } catch (error) {
          console.log(error.message);
          res.status(500).send("Internal server error");
      }
  } else {
      res.redirect("/admin");
  }
};


// Admin add user page
const addUser = (req, res) => {
  if (req.session.admin) {
    res.render("addUserAdmin");
  } else {
    res.redirect("/admin");
  }
};

// Admin add user functionality
const addUserFunction = async (req, res) => {
  let user1;
  try {
    user1 = new UserCollection({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    const email = req.body.email;

    const userCheck = await UserCollection.findOne({ email: email });
    if (email === userCheck.email) {
      res.render("addUserAdmin", {
        regerstrationMessage: "Email Already exists",
      });
    }
  } catch (error) {
    res.render("addUserAdmin", { regerstrationMessage: "Successfully Added" });
    user1.save();
    console.log(error);
  }
};

// User Edit page
let id;
const editUser = async (req, res) => {
  if (req.session.admin) {
    try {
      id = req.query.id;
      const userData = await UserCollection.findById({ _id: id });

      if (userData) {
        res.render("updateUserAdmin", { User: userData });
      } else {
        res.render("/adminhome");
      }
    } catch (error) {
      console.log(error.message);
    }
  } else {
    res.redirect("/admin");
  }
};
// User Edit Function

const editUserFunction = async (req, res) => {
  try {
    if (req.session.admin) {
      const updateUser = await UserCollection.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
          },
        }
      );
      res.redirect("/adminhome");
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};
// User Delete
const userDelete = async (req, res) => {
  if (req.session.admin) {
    try {
      let userid = req.query.id;

      const deleteUser = await UserCollection.findByIdAndDelete({
        _id: userid,
      });
      res.redirect("/adminhome");
    } catch (error) {
      console.log(error.message);
    }
  } else {
    res.redirect("/admin");
  }
};
const customerDashBoard = async (req, res) => {
  if (req.session.admin) {
    try {
      const page = parseInt(req.query.page) || 1; // Current page number, defaulting to 1
      const limit = 8; // Items per page
      const skip = (page - 1) * limit; // Number of items to skip
      const count = await users.countDocuments(); // Total number of documents
      const totalPages = Math.ceil(count / limit); // Total number of pages

      // Query the database with pagination
      let User = await users.find().skip(skip).limit(limit);

      // Render the view with pagination data
      res.render("adminCustomerDash", { User, currentPage: page, totalPages });
    } catch (error) {
      console.log(error);
    }
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await users.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.isBlocked = true;
    await user.save();

    res.redirect("/customerDashBoard");
  } catch (error) {
    console.error("Error", error);
    res.status(500).send("Internal server Error");
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await users.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.isBlocked = false;
    await user.save();

    res.redirect("/customerDashBoard");
  } catch (error) {
    console.error("Error", error);
    res.status(500).send("Internal server Error");
  }
};

const adminOrdersDash = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/login"); // Redirect to login page if not logged in as admin
    }

    const page = parseInt(req.query.page) || 1; // Current page number, defaulting to 1
    const limit = 8; // Items per page
    const skip = (page - 1) * limit; // Number of items to skip
    const count = await orders.countDocuments(); // Total number of orders
    const totalPages = Math.ceil(count / limit); // Total number of pages

    // Query the database for the current page orders
    const userOrders = await orders
      .find()
      .skip(skip)
      .limit(limit)
      .populate("items.product")
      .sort({ orderDate: -1 });

    // Render the view with pagination data
    res.render("adminOrdersDash", {
      userOrders,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};



// Dashboard
const adminDashboard = async (req, res) => {
  res.render("adminDashboard");
};



// Category
const adminCategory = async (req, res) => {
  console.log("Inside1");
  if (req.session.admin)
    try {
      const Category = await categories.find();
      res.render("adminCategory", { Category });
    } catch (error) {
      console.error("Error toggling user block status:", error);
      res.status(500).send("Internal Server Error");
    }
};

// Add Category
const addCategoryPage = (req, res) => {
  if (req.session.admin) res.render("addCategory", { mess: "" });
};

const addCategory = async (req, res) => {
  try {
    let categoryName = req.body.category;

    const existingCategory = await categories.findOne({
      category: categoryName.toUpperCase(),
    });

    if (existingCategory) {
      return res.render("addCategory", { mess: "Category already exists" });
    }

    const { category, products, isListed } = req.body;
    const newCategory = new categories({
      category: categoryName.toUpperCase(),
      products: products,
      isListed: isListed,
    });

    await newCategory.save();
    console.log("Category saved successfully");
    res.redirect("/admincategory");
  } catch (error) {
    console.log("Error", error);
    res.status(500).send("Internal Server Error");
  }
};

const removeCategory = async (req, res) => {
  try {
    const cateId = req.params.category;

    const category = await categories.findById(cateId);

    if (category) {
      await categories.findByIdAndRemove(cateId);

      res.redirect("/admincategory");
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const adminEditCategory = async (req, res) => {
  try {
    const cateId = req.params.id;
    const category = await categories.findById(cateId.toUpperCase());

    res.render("adminEditCategory", { category, mess: "" });
  } catch (error) {
    console.log(error);
  }
};

const adminEditCategoryPost = async (req, res) => {
  try {
    const cateId = req.params.id;
    const Category = await categories.findById(cateId.toUpperCase());
    const { category } = req.body;
    const existingCategory = await categories.findOne({
      category: category.toUpperCase(),
    });
    if (existingCategory) {
      return res.render("adminEditCategory", {
        category: Category,
        mess: "Category already exists",
      });
    }

    const updatedCategory = await categories.findByIdAndUpdate(cateId, {
      category: category.toUpperCase(),
    });

    if (updatedCategory) {
      console.log("Category updated successfully:", updatedCategory);
      res.redirect("/admincategory");
    } else {
      console.log("Category not found or not updated");
      res.status(404).send("Category not found or not updated");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};



// Inventory
const adminInventory = async (req, res) => {
  try {
    if (req.session.admin) {
      const page = parseInt(req.query.page) || 1; // Get page number from query parameter, default to 1 if not provided
      const limit = 8; // Number of products per page
      const skip = (page - 1) * limit;

      const totalProducts = await products.countDocuments();
      const Products = await products.find().skip(skip).limit(limit);

      res.render("adminInventory", {
        Products,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
      });
    } else {
      res.redirect("/login"); // Redirect to login page or handle as appropriate
    }
  } catch (error) {
    console.error("Error", error);
    res.status(500).send("Internal server Error");
  }
};

const listUnlistCategory = async (req, res) => {
  try {
    // Retrieve the category ID from the request parameters
    const cateId = req.params.cateId;

    // Fetch the category from the database using the ID
    const category = await categories.findById(cateId);

    // Check if the category was found
    if (!category) {
      // Return a 404 status code if the category is not found
      return res.status(404).send("Category not found");
    }

    // Toggle the isListed property (list/unlist)
    category.isListed = !category.isListed;

    // Save the updated category to the database
    await category.save();

    // Redirect to the adminCategory page after updating
    res.redirect("/adminCategory");
  } catch (error) {
    // Log the error to the console
    console.error("Error:", error);

    // Send a 500 status code for internal server error
    res.status(500).send("Internal Server Error");
  }
};

const listUnlistProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await products.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    product.isListed = !product.isListed;
    await product.save();

    res.redirect("/adminInventory");
  } catch (error) {
    console.error("Error", error);
    res.status(500).send("Internal server Error");
  }
};

// Product Details
const adminProductDetails = async (req, res) => {
  if (req.session.admin)
    try {
      let productId = req.params.id;
      const product = await products.findById(productId);

      res.render("adminProductDetails", { product });
    } catch (error) {
      console.error("Error", error);
      res.status(500).send("Internal server Error");
    }
};

// Update Product
const adminEditProduct = async (req, res) => {
  if (req.session.admin)
    try {
      const prodId = req.params.id;
      const productIn = await products.findById(prodId);

      res.render("adminEditProduct", { productIn });
    } catch (error) {
      console.log(error);
    }
};

const adminEditProductPost = async (req, res) => {
  const prodId = req.params.id;
  const files = req.files; // Access uploaded files
  const { productName, productDes, productCat, productDate, stock, price } =
    req.body;
  let product = await products.findById(prodId);

  console.log(files);

  let gameImages = [];
  let existingImages = [];

  for (let i = 1; i <= 4; i++) {
    const fileKey = `gameImages${i}`;
    if (req.files[fileKey] && req.files[fileKey].length > 0) {
      gameImages[i - 1] = `/productImg/${req.files[fileKey][0].filename}`;
      existingImages.push(product.image[i - 1]);
    } else {
      gameImages[i - 1] = product.image[i - 1];
    }
  }

  existingImages.forEach((existingImagePath) => {
    if (typeof existingImagePath === 'string' && existingImagePath.trim() !== '') {
        console.log("Processing existing image path:", existingImagePath);

        const fullPath = path.join(
            "C:\\Users\\puoby\\OneDrive\\Wine .Co First week project\\public\\",
            existingImagePath
        );

        try {
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`Deleted file: ${fullPath}`);
            } else {
                console.log(`File not found: ${fullPath}`);
            }
        } catch (err) {
            console.error(`Error deleting file: ${fullPath}`, err);
        }
    } else {
        console.warn(`Skipping invalid image path: ${existingImagePath}`);
    }
});
  const updatedProduct = await products.findByIdAndUpdate(
    prodId,
    {
      productName: productName,
      description: productDes,
      productCategory: productCat,
      ManufactureDate: productDate,
      totalQuantity: stock,
      price: price,
      image: gameImages,
    },
    { new: true }
  );

  if (!updatedProduct) {
    console.log("Product not found or not updated");
  }

  res.redirect(`/adminProductDetails/${prodId}`);
};

const removeImage = async (req, res) => {
  const filePath =
    "C:\\Users\\puoby\\OneDrive\\Wine .Co First week project\\public\\";
  const productId = req.body.productId;
  const product = await products.findById(productId);
  try {
    const imageIndexToRemove = parseInt(req.body.imageIndexToRemove);
    console.log("Before 1st if");
    if (
      !isNaN(imageIndexToRemove) &&
      imageIndexToRemove >= 0 &&
      imageIndexToRemove < product.image.length
    ) {
      console.log("stucked in remove image", filePath);
      console.log(product.image[imageIndexToRemove]);
      const replacedImagePath = product.image[imageIndexToRemove].replace(
        /\//g,
        "\\"
      );

      console.log("Replaced Image Path:", replacedImagePath);
      const imagePathToRemove = path.join(filePath, replacedImagePath);

      console.log("Before second if");
      try {
        await fs.promises.access(imagePathToRemove);

        await fs.promises.unlink(imagePathToRemove);
        product.image[imageIndexToRemove] = "";

        await product.save();

        res.status(200).json({ message: "Image removed successfully." });
        return;
      } catch (err) {
        console.error(`Error removing image: ${err.message}`);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
    } else {
      console.log("Invalid image index provided.");
    }

    res.status(400).json({
      error: "Image removal failed. Invalid index or file not found.",
    });
  } catch (err) {
    console.error("Error removing image:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add Product
const addProductPage = async (req, res) => {
  try {
    let category = await categories.find();
    res.render("addProduct", { category, mess: "" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


const addProduct = async (req, res) => {
  if (req.session.admin) {
      try {
          const { productName, productDes, productCat, productDate, price, stock } = req.body;

          // Array to hold paths of cropped images
          const imagePaths = [];

          // Process each file
          if (req.files && req.files.length > 0) {
              for (const file of req.files) {
                  const originalPath = file.path; // The original file path
                  const croppedImagePath = path.join('public/productImg', `cropped_${file.filename}`);
                  
                  // Crop and resize the image using sharp
                  await sharp(originalPath)
                      .resize(300, 300, {
                          fit: sharp.fit.cover, // Use 'cover' fit strategy
                          position: sharp.strategy.attention // Focus attention-based cropping
                      })
                      .toFile(croppedImagePath);
                  
                  // Add the cropped image path to the array
                  imagePaths.push(croppedImagePath);
              }
          }

          // Create a new product object
          const newProduct = new products({
              productName,
              productCategory: productCat,
              description: productDes,
              manufactureDate: productDate,
              totalQuantity: stock,
              price,
              image: imagePaths,
          });

          // Save the new product to the database
          let savedProd = await newProduct.save();

          // Update the category with the new product ID
          await categories.findOneAndUpdate(
              { category: productCat },
              { $push: { products: savedProd._id } },
              { new: true }
          );

          // Redirect to admin inventory page
          res.redirect("/adminInventory");
      } catch (error) {
          // Handle duplicate key error
          if (error.code === 11000) {
              console.error("Product already exists");
              let category = await categories.find();
              return res.render("addProduct", {
                  category,
                  mess: "Product already exists",
              });
          }

          // Log and respond with internal server error
          console.error(error);
          res.status(500).send("Internal Server Error");
      }
  } else {
      // If not logged in as admin, redirect to login page
      res.redirect("/adminLogin");
  }
};





sendCancelNotification = async (req, res) => {
  try {
    const { orderId, userId } = req.body;

    const order = await orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const notificationMessage = `Order ${orderId} has been cancelled by user ${userId}`;

    console.log("Cancel notification sent to admin:", notificationMessage);

    res.status(200).json({ message: "Cancel notification sent to admin" });
  } catch (error) {
    console.error("Error sending cancel notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Route to handle changing order status

const changeOrderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.order_status;

  console.log("new status ", newStatus);

  try {
    let order = await orders.findById(orderId);
    let userWallet = await wallet.findOne({ userId: order.customer });
    if (!userWallet) {
      userWallet = new wallet({
        userId: order.customer,
        balance: 0,
        transactionHistory: [],
      });
      await userWallet.save();
    }
    console.log("after first if");
    if (newStatus === "Delivered") {
      order.deliveredAt = new Date();
      await order.save();
    }
    if (newStatus === "Cancelled" || newStatus === "Returned") {
      const orderAmount = order.totalAmount;
      userWallet.balance += orderAmount;
      userWallet.transactionHistory.push({
        transaction: "Money Added",
        amount: orderAmount,
      });
    }
    const updatedOrder = await orders.findByIdAndUpdate(
      orderId,
      { OrderStatus: newStatus },
      { new: true }
    );
    await userWallet.save();
    res.redirect("/adminOrdersDash");
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send("Internal Server Error");
  }
};

// admin Coupons & Discounts
const adminCouponsDiscounts = async (req, res) => {
  if (req.session.admin)
    try {
      const coupons = await Coupon.find();

      res.render("adminCouponsDiscounts", {
        coupons: coupons,
      });
    } catch (error) {
      console.log("Error", error);
      res.status(500).send("Internal Server Error");
    }
};

const addCouponsGet = (req, res) => {
  if (req.session.admin)
    try {
      res.render("addCoupons", {});
    } catch (error) {
      console.log("Error", error);
      res.status(500).send("Internal Server Error");
    }
};

const addCoupons = async (req, res) => {
  try {
    const { code, discountValue, discountType, expiry, minimumCartAmount } =
      req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.render("addCoupons", { mess: "Coupon already exists" });
    }

    // Form Validation
    if (
      isNaN(discountValue) ||
      isNaN(minimumCartAmount) ||
      discountValue >= 100 ||
      minimumCartAmount <= 0 ||
      discountValue < 0 ||
      minimumCartAmount < 0
    ) {
      return res.render("addCoupons", {
        mess: "Please enter valid discount value and cart amount.",
      });
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountValue: discountValue,
      discountType: discountType,
      expiry: expiry,
      minimumCartAmount: minimumCartAmount,
      status: "Active",
    });

    await newCoupon.save();

    const coupons = await Coupon.find();

    res.render("adminCouponsDiscounts", {
      coupons: coupons,
      mess: "Coupon added successfully",
    });
  } catch (error) {
    console.log("Error", error);
    res.status(500).send("Internal Server Error");
  }
};

const editCouponsGet = async (req, res) => {
  if (req.session.admin)
    try {
      const couponId = req.params.id;
      const coupon = await Coupon.findById(couponId);
      res.render("adminEditCoupon", { coupon });
    } catch (error) {
      console.log("Error", error);
      res.status(500).send("Internal Server Error");
    }
};

const editCoupons = async (req, res) => {
  try {
    const couponId = req.params.id;
    const { code, discountValue, discountType, expiry, minimumCartAmount } =
      req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon && existingCoupon._id.toString() !== couponId) {
      return res.render("addCoupons", {
        mess: "Coupon with this code already exists",
      });
    }

    // Form Validation
    if (
      isNaN(discountValue) ||
      isNaN(minimumCartAmount) ||
      discountValue >= 100 ||
      minimumCartAmount <= 0 ||
      discountValue < 0 ||
      minimumCartAmount < 0
    ) {
      return res.render("addCoupons", {
        mess: "Please enter valid discount value and cart amount.",
      });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      {
        code: code.toUpperCase(),
        discountValue: discountValue,
        discountType: discountType,
        expiry: expiry,
        minimumCartAmount: minimumCartAmount,
      },
      { new: true }
    );

    if (!updatedCoupon) {
      console.log("Error updating coupon");
      return res.status(404).send("Coupon not found");
    }

    const coupons = await Coupon.find();

    res.render("adminCouponsDiscounts", {
      coupons: coupons,
      mess: "Coupon updated successfully",
    });
  } catch (error) {
    console.log("Error", error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    await Coupon.findByIdAndDelete(couponId);
    res.redirect("/adminCouponsDiscounts"); // Redirect to coupons page after deletion
  } catch (error) {
    console.log("Error", error);
    res.status(500).send("Internal Server Error");
  }
};

const adminOffers = async (req, res) => {
  if (req.session.admin)
    try {
      const offers = await offer.find();
      res.render("adminOffers", {
        offer: offers,
      });
    } catch (error) {
      console.log("Error", error);
      res.status(500).send("Internal Server Error");
    }
};


const addOffersGet = async (req, res) => {
  const Products = await products.find();
  const Categories = await categories.find();
  res.render("addOffers", {
    products: Products,
    categories: Categories,
    message: "",
  });
};



const addOffers = async (req, res) => {
  const Products = await products.find();
  const Offer = await offer.find();
  const Categories = await categories.find();

  console.log("inside handle data");
  const {
    offerName,
    discountOn,
    discountValue,
    startDate,
    endDate,
    selectedCategory,
    selectedProducts,
  } = req.body;
  console.log(req.body);
  try {
    const existingNameOffer = await offer.findOne({ offerName });
    const existingCategoryOffer = await offer.findOne({ selectedCategory });
    let existingProductOffer;
    if (discountOn === "product") {
      existingProductOffer = await offer.findOne({ selectedProducts });
    } else {
      existingProductOffer = null;
    }

    console.log("existingNameOffer", existingNameOffer);
    console.log("existingCategoryOffer", existingCategoryOffer);
    console.log("existingProductOffer", existingProductOffer);

    if (existingNameOffer) {
      return res.render("addOffers", {
        products: Products,
        categories: Categories,
        message: "Duplicate Discount Name not allowed.",
      });
    }

    if (selectedCategory && existingCategoryOffer) {
      return res.render("addOffers", {
        products: Products,
        categories: Categories,
        message: "An offer for this category already exists.",
      });
    }

    if (selectedProducts && existingProductOffer) {
      return res.render("addOffers", {
        products: Products,
        categories: Categories,
        message: "An offer for this product already exists.",
      });
    }
    let modifiedSelectedCategory = selectedCategory;
    let modifiedSelectedProducts = selectedProducts;

    if (discountOn === "category") {
      // Initialize the selected category and products variables
      modifiedSelectedProducts = null;

      // Use the provided category ID directly for querying products
      modifiedSelectedCategory = selectedCategory;

      console.log("Selected category ID:", modifiedSelectedCategory);

      // Find all products that belong to the selected category
      const productsInCategory = await products.find({
        productCategory: modifiedSelectedCategory,
      });

      console.log("Products in category:", productsInCategory);

      // Update prices and discounts for each product in the selected category
      for (const product of productsInCategory) {
        const originalPrice = product.price;

        // Calculate the discounted price
        const discountedPrice =
          originalPrice - (originalPrice * discountValue) / 100;

        // Update product properties
        product.originalPrice = originalPrice;
        product.discount = discountValue;
        product.price = discountedPrice;

          // Save the updated product
  try {
    await product.save();
    console.log(`Updated product ${product._id}: original price ${originalPrice}, discounted price ${discountedPrice}`);
  } catch (error) {
    console.error(`Error saving product ${product._id}:`, error);
  }
}

      console.log("Products in category updated successfully");
    } else if (discountOn === "product") {
      modifiedSelectedCategory = null;
      modifiedSelectedProducts = selectedProducts;
      const product = await products.findOne({ _id: modifiedSelectedProducts });
      if (product) {
        const discountedPrice =
          product.price - (product.price * discountValue) / 100;
        console.log("inside for 2");
        product.originalPrice = product.price;
        product.discount = discountValue;
        product.price = discountedPrice;

        await product.save();
        console.log("After save");
      }
    }
    console.log("before new");

    const newOffer = new offer({
      offerName,
      discountOn,
      discountValue,
      startDate,
      endDate,
      selectedCategory: modifiedSelectedCategory,
      selectedProducts: modifiedSelectedProducts,
    });

    console.log("Save before");
    const savedOffer = await newOffer.save();
    console.log(savedOffer);
    res.redirect("/adminOffers");
  } catch (error) {
    console.error("Error during coupon creation:", error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteOffers = async (req, res) => {
  try {
    const offerId = req.body.offerId;
    await offer.findByIdAndDelete(offerId);
    res.redirect("/adminOffers"); // Redirect to Offers page after deletion
  } catch (error) {
    console.log("Error", error);
    res.status(500).send("Internal Server Error");
  }
};




const generatePdfReport = async (req, res) => {
  try {
    const { filter, selectedValue } = req.params;
    const [year, month] = selectedValue.split("-");
    const salesData = await fetchSalesData(filter, selectedValue);

    console.log("Dataa", salesData);

    if (!salesData || salesData.length === 0) {
      return res
        .status(404)
        .json({ error: "No data found for the selected filter and value" });
    }

    const pdfDoc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${filter}-${selectedValue}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.fontSize(12);
    let title = `Sales Report - ${filter}`;

    if (filter === "daily") {
      title += ` (${selectedValue})`;
    } else if (filter === "monthly") {
      title += ` (${year}-${month})`;
    } else if (filter === "yearly") {
      title += ` (${year})`;
    }

    pdfDoc.text(title, { align: "center", underline: true });
    pdfDoc.moveDown();
    let totalOrders = 0;
    let totalAmount = 0;
    salesData.forEach((entry) => {
      pdfDoc.moveDown();
      pdfDoc.text(`Order ID: ${entry.orderId}`);
      pdfDoc.text(`Customer: ${entry.customer.name}`);
      entry.items.forEach((item, itemIndex) => {
        pdfDoc.text(
          `Product${itemIndex + 1}: ${
            item.product ? item.product.productName : ""
          }`
        );
      });
      pdfDoc.text(`Total Amount: Rs:${entry.totalAmount}`);
      pdfDoc.text(`Order Date: ${entry.orderDate.toLocaleDateString()}`);
      totalOrders += 1;
      totalAmount += entry.totalAmount;
    });
    pdfDoc.moveDown();
    pdfDoc.moveDown();
    pdfDoc.moveDown();
    pdfDoc.text(`Total Orders: ${totalOrders}`);
    pdfDoc.text(`Total Amount: Rs:${totalAmount}`);
    pdfDoc.end();
  } catch (error) {
    console.error("Error generating PDF report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const generateExcelReport = async (req, res) => {
  const { filter, selectedValue } = req.params;
  try {
    const salesData = await fetchSalesData(filter, selectedValue);

    if (!salesData || salesData.length === 0) {
      return res
        .status(404)
        .json({ error: "No data found for the selected filter and value" });
    }

    // Convert the data to an array of objects
    const dataForExcel = salesData.map((entry) => ({
      "Order ID": entry.orderId,
      Customer: entry.customer.name,
      Products: entry.items
        .map((item) => (item.product ? item.product.productName : ""))
        .join(", "),
      "Total Amount": entry.totalAmount,
      "Order Date": entry.orderDate.toLocaleDateString(),
    }));

    // Calculate total orders and total amount
    let totalOrders = 0;
    let totalAmount = 0;

    salesData.forEach((entry) => {
      totalOrders += 1;
      totalAmount += entry.totalAmount;
    });

    // Append a row with totals to the data for Excel
    const totalsRow = {
      "Order ID": "Total Orders:",
      Customer: totalOrders,
      "Total Amount": totalAmount,
      "Order Date": "",
    };

    dataForExcel.push(totalsRow);

    // Create a workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel, {
      header: ["Order ID", "Customer", "Total Amount", "Order Date"],
    });

    const headerCellStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "FFFF00" } },
    };
    Object.keys(worksheet).forEach((key) => {
      if (key.startsWith("A1")) {
        worksheet[key].s = headerCellStyle;
      }
    });

    // Enable Shared Strings Table for styling
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

    // Enable Shared Strings Table for styling
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
      bookSST: true,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${filter}-${selectedValue}.xlsx`
    );

    // Send the buffer as the response
    res.end(excelBuffer);
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

async function fetchSalesData(filter, selectedValue) {
  try {
    let Orders;

    if (filter === "daily") {
      const startDate = new Date(selectedValue);
      const endDate = new Date(selectedValue);
      endDate.setDate(endDate.getDate() + 1);

      Orders = await orders
        .find({
          orderDate: { $gte: startDate, $lt: endDate },
        })
        .populate("customer")
        .populate("items.product");
    } else if (filter === "monthly") {
      const [year, month] = selectedValue.split("-");
      Orders = await orders
        .find({
          orderDate: {
            $gte: new Date(year, month - 1, 1),
            $lt: new Date(year, month, 1),
          },
        })
        .populate("customer")
        .populate("items.product");
    } else if (filter === "yearly") {
      Orders = await orders
        .find({
          orderDate: {
            $gte: new Date(selectedValue, 0, 1),
            $lt: new Date(Number(selectedValue) + 1, 0, 1),
          },
        })
        .populate("customer")
        .populate("items.product");

      console.log("Orders", Orders);
    }

    return Orders;
  } catch (error) {
    console.error("Error fetching sales data:", error);
    throw error;
  }
}

















// Admin Logout
const adminLogout = (req, res) => {
  req.session.admin = false;
  console.log(" Admin session ends");
  res.redirect("/admin");
};

module.exports = {

  // login
  adminLogin,
  adminVerification,
  adminHome,
  adminLogout,
// add user
  addUser,
  addUserFunction,
  editUser,
  editUserFunction,
  userDelete,
  blockUser,
  unblockUser,
// category
  adminCategory,
  removeCategory,
  adminEditCategory,
  addCategoryPage,
  addCategory,
  adminEditCategoryPost,
  listUnlistCategory,
  // dash
  adminDashboard,
  customerDashBoard,

// Products
  adminInventory,
  listUnlistProduct,
  adminProductDetails,
  adminEditProduct,
  upload,
  removeImage,
  adminEditProductPost,
  addProductPage,
  addProduct,
  // Orders
  changeOrderStatus,
  adminOrdersDash,
  sendCancelNotification,
  // Coupons
  adminCouponsDiscounts,
  addCoupons,
  addCouponsGet,
  editCouponsGet,
  editCoupons,
  deleteCoupon,
  // Offers
  adminOffers,
  addOffersGet,
  addOffers,
  deleteOffers,
  // Sales Report
  generateExcelReport,
  generatePdfReport,
 






};
