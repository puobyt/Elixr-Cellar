const express = require('express')

const admin_router = express.Router();
const adminController = require('../Controllers/adminController')

const multer = require('multer');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/productImg');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});




const upload = multer({ storage: storage });


// ...

admin_router.route('/adminEditProduct/:id')
    .get(adminController.adminEditProduct)
    .post(upload.array([
        { name: 'replaceImage0', maxCount: 1 },
        { name: 'replaceImage1', maxCount: 1 },
        { name: 'replaceImage2', maxCount: 1 },
    ]), adminController.adminEditProductPost);



admin_router.get('/admin', adminController.adminLogin)

admin_router.post('/admin', adminController.adminVerification)

admin_router.get('/adminhome', adminController.adminHome)

admin_router.get('/adminDashboard', adminController.adminDashboard)

admin_router.get('/admincategory', adminController.adminCategory)

admin_router.get('/addCategory', adminController.addCategoryPage)

admin_router.post('/addCategory', adminController.addCategory)

admin_router.get('/removeCategory/:category', adminController.removeCategory)


admin_router.get('/adminEditCategory/:id', adminController.adminEditCategory)
admin_router.post('/adminEditCategory/:id', adminController.adminEditCategoryPost)


admin_router.get('/adminInventory', adminController.adminInventory)

admin_router.get('/listUnlistCategory/:cateId', adminController.listUnlistCategory)
admin_router.get('/listUnlistProduct/:productId', adminController.listUnlistProduct)

admin_router.get('/adminProductDetails/:id', adminController.adminProductDetails)

admin_router.get('/adminEditProduct/:id', adminController.adminEditProduct)
admin_router.post('/adminEditProduct/:id',upload.array('images',3), adminController.adminEditProduct)

// admin_router.post('/adminEditProduct/:id',adminController.upload.array('images', 3),adminController.adminEditProductPost)

admin_router.get('/addProduct', adminController.addProductPage)

admin_router.post('/addProduct', adminController.upload.array('images', 3), adminController.addProduct);


admin_router.get('/customerDashBoard', adminController.customerDashBoard)
admin_router.get('/blockUser/:userId', adminController.blockUser);
admin_router.get('/unblockUser/:userId', adminController.unblockUser);

admin_router.get('/adminOrdersDash', adminController.adminOrdersDash)



admin_router.get('/adminCouponsDiscounts', adminController.adminCouponsDiscounts)
admin_router.get('/addCoupons', adminController.addCouponsGet)
admin_router.get('/addCoupons', adminController.addCoupons)
admin_router.post('/addCoupons', adminController.addCoupons)




admin_router.get('/addUser', adminController.addUser)

admin_router.post('/addUser', adminController.addUserFunction)

admin_router.get('/editUser', adminController.editUser)

admin_router.post('/editUser', adminController.editUserFunction)

admin_router.get('/deleteUser', adminController.userDelete)

admin_router.get('/adminlogout', adminController.adminLogout)






module.exports = admin_router