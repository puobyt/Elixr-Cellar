


const UserCollection = require('../Model/userModel')
const AdminCollection = require('../Model/adminModel')

const categories = require('../Model/categoryModel')
const products = require('../Model/productsModel')
const users = require('../Model/userModel')
const orders = require('../Model/orderModel')
const coupon = require('../Model/couponModel')

const multer = require('multer');




const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/productImg');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});



const upload = multer({ storage: storage, field: 'image' });



//Admin Login
const adminLogin = (req, res) => {
    if (req.session.admin) {
        res.redirect('/adminhome')
    }
    else {

        res.render('adminlogin')
    }
}


// Admin validation
const adminVerification = async (req, res) => {
    try {
        email = req.body.email
        let adminExists = await AdminCollection.findOne({ email: email })
        if (req.body.email == adminExists.email && req.body.password == adminExists.password) {
            req.session.admin = req.body.email
            console.log('Admin session created')
            res.redirect('/adminhome')
        }
        else {
            res.render('adminlogin', { wrong: 'Wrong Username or Password' })
        }

    } catch (error) {
        console.log(error)
    }

}

// Admin HomePage
const adminHome = async (req, res) => {
    if (req.session.admin) {
        try {
            let search = ''
            if (req.query.search) {
                search = req.query.search
            }
            const userData = await UserCollection.find(
                {

                    $or: [
                        { name: { $regex: '^' + search + '.*', $options: 'i' } },
                        { email: { $regex: '^' + search + '.*', $options: 'i' } }
                    ]

                })

            res.render('adminhome', { details: userData })
        }
        catch (error) {
            console.log(error.message)
        }
    }
    else {

        res.redirect('/admin')
    }
}

// Admin add user page
const addUser = (req, res) => {
    if (req.session.admin) {
        res.render('addUserAdmin')
    }
    else {
        res.redirect('/admin')
    }
}

// Admin add user functionality
const addUserFunction = async (req, res) => {
    let user1
    try {

        user1 = new UserCollection({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        })
        const email = req.body.email

        const userCheck = await UserCollection.findOne({ email: email })
        if (email === userCheck.email) {
            res.render('addUserAdmin', { regerstrationMessage: "Email Already exists" })
        }

    } catch (error) {
        res.render('addUserAdmin', { regerstrationMessage: "Successfully Added" })
        user1.save()
        console.log(error)
    }
}

// User Edit page
let id
const editUser = async (req, res) => {
    if (req.session.admin) {
        try {

            id = req.query.id
            const userData = await UserCollection.findById({ _id: id })


            if (userData) {
                res.render('updateUserAdmin', { User: userData })


            } else {
                res.render('/adminhome')
            }

        } catch (error) {
            console.log(error.message)
        }

    }
    else {
        res.redirect('/admin')
    }
}
// User Edit Function

const editUserFunction = async (req, res) => {

    try {

        //console.log(id)
        if (req.session.admin) {

            const updateUser = await UserCollection.findByIdAndUpdate({ _id: id }, { $set: { name: req.body.name, email: req.body.email, password: req.body.password } })
            res.redirect('/adminhome')

        }
        else {
            res.redirect('/admin')
        }
    } catch (error) {

        console.log(error.message)
    }
}
// User Delete
const userDelete = async (req, res) => {
    if (req.session.admin) {
        try {

            let userid = req.query.id

            const deleteUser = await UserCollection.findByIdAndDelete({ _id: userid })
            res.redirect('/adminhome')

        } catch (error) {
            console.log(error.message)
        }
    } else {
        res.redirect('/admin')
    }
}






// Dashboard
const adminDashboard = async (req, res) => {
    res.render('adminDashboard')
}

// Category
const adminCategory = async (req, res) => {
    console.log("Inside1")
    try {

        const Category = await categories.find()
        res.render('adminCategory', { Category })

    } catch (error) {
        console.error('Error toggling user block status:', error);
        res.status(500).send('Internal Server Error');
    }
}

// Add Category
const addCategoryPage = (req, res) => {
    res.render('addCategory', { mess: "" })
}

const addCategory = async (req, res) => {
    try {
        let categoryName = req.body.category;


        const existingCategory = await categories.findOne({ category: categoryName.toUpperCase() });

        if (existingCategory) {


            return res.render('addCategory', { mess: "Category already exists" })


        }

        const { category, products, isListed } = req.body;
        const newCategory = new categories({
            category: categoryName.toUpperCase(),
            products: products,
            isListed: isListed,
        });

        await newCategory.save();
        console.log("Category saved successfully");
        res.redirect('/admincategory');
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


            res.redirect('/admincategory');
        } else {

            res.status(404).json({ error: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const adminEditCategory = async (req, res) => {

    try {
        const cateId = req.params.id
        const category = await categories.findById(cateId.toUpperCase())

        res.render('adminEditCategory', { category, mess: "" })

    } catch (error) {
        console.log(error)
    }
}

const adminEditCategoryPost = async (req, res) => {
    try {
        const cateId = req.params.id;
        const Category = await categories.findById(cateId.toUpperCase())
        const { category } = req.body;
        const existingCategory = await categories.findOne({ category: category.toUpperCase() });
        if (existingCategory) {


            return res.render('adminEditCategory', { category: Category, mess: "Category already exists" })


        }

        const updatedCategory = await categories.findByIdAndUpdate(cateId, { category: category.toUpperCase() });

        if (updatedCategory) {
            console.log("Category updated successfully:", updatedCategory);
            res.redirect('/admincategory');
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
        const Products = await products.find()
        res.render("adminInventory", { Products })
    } catch (error) {
        console.error('Error', error)
        res.status(500).send('Internal server Error')
    }

}

const listUnlistCategory = async (req, res) => {
    try {
        const cateId = req.params.cateId;
        const category = await categories.findById(cateId)


        if (!category) {
            return res.status(404).send('Category not found');
        }


        category.isListed = !category.isListed;
        await category.save();

        res.redirect('/adminCategory');
    } catch (error) {
        console.error('Error', error);
        res.status(500).send('Internal server Error');
    }
};


const listUnlistProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await products.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }


        product.isListed = !product.isListed;
        await product.save();

        res.redirect('/adminInventory');
    } catch (error) {
        console.error('Error', error);
        res.status(500).send('Internal server Error');
    }
};

// Product Details
const adminProductDetails = async (req, res) => {
    try {
        let productId = req.params.id
        const product = await products.findById(productId)

        res.render('adminProductDetails', { product })
    } catch (error) {
        console.error('Error', error)
        res.status(500).send('Internal server Error')
    }

}
// Update Product
const adminEditProduct = async (req, res) => {
    try {
        const prodId = req.params.id
        const productIn = await products.findById(prodId)

        res.render('adminEditProduct', { productIn })

    } catch (error) {
        console.log(error)
    }
}


const adminEditProductPost = async (req, res) => {
    try {
        console.log('Received POST request to /adminEditProduct/:id');

        const prodId = req.params.id;
        console.log('Product ID:', prodId);
       



        const files = req.files.image;
        const deletedImages = req.body.deletedImages ? req.body.deletedImages.split(",") : [];

        if (files && Array.isArray(files)) {
            console.log('Received files:', files);

            const existingImages = req.body.existingImages ? req.body.existingImages.split(",") : [];
            console.log('Existing Images:', existingImages);

            const remainingImages = existingImages.filter((img, index) => !deletedImages.includes(index.toString()));
            console.log('Remaining Images:', remainingImages);

            const newImagePaths = files.map((file) => 'productImg/' + file.filename);
            console.log('New Image Paths:', newImagePaths);

            const combinedImages = [...remainingImages, ...newImagePaths].slice(0, 3);
            console.log('Combined Images:', combinedImages);

       

        }
      
        
        const { productName, productDes, productCat, productDate, stock, price } = req.body;

      
        const updatedProduct = await products.findByIdAndUpdate(
            prodId,
            {
                productName: productName,
                description: productDes,
                productCategory: productCat,
                ManufactureDate: productDate,
                totalQuantity: stock,
                price: price,
                image: combinedImages,
            },
            { new: true }
        );

        if (!updatedProduct) {
            console.log("Product not found or not updated");
            return res.status(404).send("Product not found or not updated");
        }

        // Delete selected images
        for (const deletedImageIndex of deletedImages) {
            const index = parseInt(deletedImageIndex, 10);
            if (!isNaN(index) && index >= 0 && index < updatedProduct.image.length) {
               
               
                updatedProduct.image.splice(index, 1);
            }
        }

      
        await updatedProduct.save();

        console.log("Product details updated successfully:", updatedProduct);
        res.redirect(`/adminProductDetails/${prodId}`);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};




// Add Product
const addProductPage = async (req, res) => {
    try {
        let category = await categories.find()
        res.render('addProduct', { category, mess: "" })
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

}

const addProduct = async (req, res) => {
    try {
        let category = await categories.find();
        const { productName, productDes, productCat, productDate, price, stock } = req.body;
        console.log('req.files', req.files)
        const files = req.files;
        const imagePaths = files.map((file) => 'productImg/' + file.filename);
        console.log("image path", imagePaths)



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

        res.redirect('/adminInventory');
    } catch (error) {

        if (error.code === 11000) {

            console.error("Product already exists");
            let category = await categories.find();
            return res.render('addProduct', { category, mess: "Product already exists" });
        }


        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Customer Dashboard
const customerDashBoard = async (req, res) => {
    try {
        let User = await users.find()
        res.render('adminCustomerDash', { User })
    } catch (error) {
        console.log(error)
    }


}

const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await users.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        user.isBlocked = true;
        await user.save();

        res.redirect('/customerDashBoard');
    } catch (error) {
        console.error('Error', error);
        res.status(500).send('Internal server Error');
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await users.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        user.isBlocked = false;
        await user.save();

        res.redirect('/customerDashBoard');
    } catch (error) {
        console.error('Error', error);
        res.status(500).send('Internal server Error');
    }
};

// admin Orders Dashboard
const adminOrdersDash = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userOrders = await orders.find().populate('items.product')



        res.render('adminOrdersDash', { userOrders, userId })

    } catch (error) {
        console.log(error)
    }
}

// admin Coupons & Discounts
const adminCouponsDiscounts = async (req, res) => {
    res.render('adminCouponsDiscounts')
}
const addCoupons = async (req, res) => {
    res.render('addCoupons')
}

// const addCoupons = async (req, res) => {
//     try {
//         var coupon = req.body.coupon;


//         const existingCoupon = await coupon.findOne({ coupon: code.toUpperCase() });

//         if (existingCoupon) {


//             return res.render('addCoupons', { mess: "Coupon already exists" })


//         }

//         const { coupon,discountValue,isListed } = req.body;
//         const newCoupon = new coupon({
//             coupon: code.toUpperCase(),
//             products: products,
//             discountValue: discountValue,  
//             isListed: isListed,
//         });

//         await newCoupon.save();
//         console.log("Coupon added successfully");
//         res.redirect('/adminCouponsDiscounts');
//     } catch (error) {
//         console.log("Error", error);
//         res.status(500).send("Internal Server Error");
//     }
// };



// Admin Logout
const adminLogout = (req, res) => {

    req.session.admin = false
    console.log(' Admin session ends')
    res.redirect('/admin');
}
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
    adminEditProductPost,
    addProductPage,
    addProduct,
    customerDashBoard,
    blockUser,
    unblockUser,
    addCategoryPage,
    addCategory,
    adminOrdersDash,
    adminCouponsDiscounts,
    addCoupons,
};

