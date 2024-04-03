 const UserCollection = require("../Model/userModel");
const AdminCollection = require("../Model/adminModel");

const categories = require("../Model/categoryModel");
const products = require("../Model/productsModel");
const users = require("../Model/userModel");
const orders = require("../Model/orderModel");
const Coupon = require("../Model/couponModel");
const offer= require( "../Model/offerModel") ; 
const path = require("path");
const fs = require("fs");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/productImg");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage, field: "image" });

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
      const userData = await UserCollection.find({
        $or: [
          { name: { $regex: "^" + search + ".*", $options: "i" } },
          { email: { $regex: "^" + search + ".*", $options: "i" } },
        ],
      });

      res.render("adminhome", { details: userData });
    } catch (error) {
      console.log(error.message);
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
  if (req.session.admin)
    try {
      const Products = await products.find();
      res.render("adminInventory", { Products });
    } catch (error) {
      console.error("Error", error);
      res.status(500).send("Internal server Error");
    }
};

const listUnlistCategory = async (req, res) => {
  try {
    const cateId = req.params.cateId;
    const category = await categories.findById(cateId);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    category.isListed = !category.isListed;
    await category.save();

    res.redirect("/adminCategory");
  } catch (error) {
    console.error("Error", error);
    res.status(500).send("Internal server Error");
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
    console.log("Stuck in deleting existing image");
    console.log(existingImagePath);
    const fullPath = path.join(
      "C:\\Users\\puoby\\OneDrive\\Wine .Co First week project\\public\\",
      existingImagePath
    );

    if (typeof existingImagePath === "string") {
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
      console.error("Image path is not a string. Unable to remove image.");
      res
        .status(400)
        .json({ error: "Image removal failed. Image path is not a string." });
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

    res
      .status(400)
      .json({
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
  if (req.session.admin)
    try {
     
      const { productName, productDes, productCat, productDate, price, stock } =
        req.body;
      console.log("req.files", req.files);
      const files = req.files;

      const imagePaths = files.map((file) => "productImg/" + file.filename);
      console.log("image path", imagePaths);
    

     
      const newProduct = new products({
        productName: productName,
        productCategory: productCat,
        description: productDes,
        ManufactureDate: productDate,
        totalQuantity: stock,
        price,
        image: imagePaths,
      });

      let savedProd = await newProduct.save();

      await categories.findOneAndUpdate(
        { category: productCat },
        { $push: { products: savedProd._id } },
        { new: true }
      );

      res.redirect("/adminInventory");
    } catch (error) {
      if (error.code === 11000) {
        console.error("Product already exists");
        let category = await categories.find();
        return res.render("addProduct", {
          category,
          mess: "Product already exists",
        });
      }

      console.error(error);
      res.status(500).send("Internal Server Error");
    }
};

// Customer Dashboard
const customerDashBoard = async (req, res) => {
  if (req.session.admin)
    try {
      let User = await users.find();
      res.render("adminCustomerDash", { User });
    } catch (error) {
      console.log(error);
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

// admin Orders Dashboard
// const adminOrdersDash = async (req, res) => {
//     if (req.session.admin)
//     try {
//         const userId = req.session.userId;
//         const userOrders = await orders.find().populate('items.product').sort({ orderDate: -1 });

//         res.render('adminOrdersDash', { userOrders, userId })

//     } catch (error) {
//         console.log(error)
//     }
// }

const adminOrdersDash = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/login'); // Redirect to login page if not logged in as admin
        }

        const userId = req.session.userId;
        const userOrders = await orders.find().populate('items.product').sort({ orderDate: -1 });
        
        res.render('adminOrdersDash', { userOrders, userId });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};


// Route to handle changing order status

    const changeOrderStatus = async (req, res) => {
        try {
            const orderId = req.body.orderId;
            const newStatus = req.body.newStatus;
    
            // Update order status in the database
            const updatedOrder = await orders.findByIdAndUpdate(orderId, { OrderStatus: newStatus }, { new: true });
    
            if (!updatedOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
    
            // Send response
            res.json({ success: true, message: 'Order status updated successfully', updatedOrder });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Failed to update order status' });
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

const addOffersGet = (req, res) => {
  if (req.session.admin)
    try {
      res.render("addOffers", {});
    } catch (error) {
      console.log("Error", error);
      res.status(500).send("Internal Server Error");
    }
};

const addOffers = async (req, res) => {
  try {
    const { code, discountValue, discountType, expiry, minimumCartAmount } =
      req.body;

    const existingOffer = await offer.findOne({ code: code.toUpperCase() });
    if (existingOffer) {
      return res.render("addOffers", { mess: "Offer already exists" });
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
      return res.render("addOffers", {
        mess: "Please enter valid discount value and cart amount.",
      });
    }

    const newOffer = new offer({
      code: code.toUpperCase(),
      discountValue: discountValue,
      discountType: discountType,
      expiry: expiry,
      minimumCartAmount: minimumCartAmount,
      status: "Active",
    });

    await newOffer.save();

    const offers = await offer.find();

    res.render("adminOffers", {
      offer: offers,
      mess: "Offer added successfully",
    });
  } catch (error) {
    console.log("Error", error);
    res.status(500).send("Internal Server Error");
  }
};



// Admin Logout
const adminLogout = (req, res) => {
  req.session.admin = false;
  console.log(" Admin session ends");
  res.redirect("/admin");
};

module.exports = {
  upload,
  adminLogin,
  adminVerification,
  adminHome,
  adminLogout,
  addUser,
  addUserFunction,
  editUser,
  editUserFunction,
  userDelete,
  adminCategory,
  removeCategory,
  adminEditCategory,
  adminEditCategoryPost,
  adminDashboard,
  adminInventory,
  listUnlistCategory,
  listUnlistProduct,
  adminProductDetails,
  adminEditProduct,
  removeImage,
  adminEditProductPost,
  addProductPage,
  addProduct,
  customerDashBoard,
  blockUser,
  unblockUser,
  addCategoryPage,
  addCategory,
  adminOrdersDash,
  changeOrderStatus,
  adminCouponsDiscounts,
  addCoupons,
  addCouponsGet,
  deleteCoupon,
  adminOffers,
  addOffersGet,
  addOffers,
};
