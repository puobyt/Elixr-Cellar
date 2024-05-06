
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

const admin_router = express.Router();
const adminController = require("../Controllers/adminController");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/productImg");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

admin_router.get("/admin", adminController.adminLogin);

admin_router.post("/admin", adminController.adminVerification);

admin_router.get("/adminhome", adminController.adminHome);


admin_router.get("/adminDashboard", adminController.adminDashboard);

admin_router.get("/admincategory", adminController.adminCategory);

admin_router.get("/addCategory", adminController.addCategoryPage);

admin_router.post("/addCategory", adminController.addCategory);

admin_router.get("/removeCategory/:category", adminController.removeCategory);

admin_router.get("/adminEditCategory/:id", adminController.adminEditCategory);
admin_router.post(
  "/adminEditCategory/:id",
  adminController.adminEditCategoryPost
);

admin_router.get("/adminInventory", adminController.adminInventory);

admin_router.get(
  "/listUnlistCategory/:cateId",
  adminController.listUnlistCategory
);
admin_router.get(
  "/listUnlistProduct/:productId",
  adminController.listUnlistProduct
);

admin_router.get(
  "/adminProductDetails/:id",
  adminController.adminProductDetails
);

admin_router.get("/adminEditProduct/:id", adminController.adminEditProduct);
admin_router.post(
  "/adminEditProduct/:id",
  adminController.upload.fields([
    { name: "gameImages1", maxCount: 1 },
    { name: "gameImages2", maxCount: 1 },
    { name: "gameImages3", maxCount: 1 },
    { name: "gameImages4", maxCount: 1 },
  ]),
  adminController.adminEditProductPost
);

admin_router.post("/remove-image", adminController.removeImage);

admin_router.get("/addProduct", adminController.addProductPage);

admin_router.post(
  "/addProduct",
  adminController.upload.array("newImages", 4),
  adminController.addProduct
);

admin_router.get("/customerDashBoard", adminController.customerDashBoard);
admin_router.get("/blockUser/:userId", adminController.blockUser);
admin_router.get("/unblockUser/:userId", adminController.unblockUser);

admin_router.get("/adminOrdersDash", adminController.adminOrdersDash);
admin_router.post("/order-management-update/:orderId", adminController.changeOrderStatus);
admin_router.post('/send-cancel-notification', adminController.sendCancelNotification);

admin_router.get(
  "/adminCouponsDiscounts",
  adminController.adminCouponsDiscounts
);
admin_router.get("/addCoupons", adminController.addCouponsGet);
admin_router.get("/addCoupons", adminController.addCoupons);
admin_router.post("/addCoupons", adminController.addCoupons);
admin_router.get("/adminEditCoupon/:id", adminController.editCouponsGet);
admin_router.post("/adminEditCoupon/:id", adminController.editCoupons);

admin_router.post("/deleteCoupon", adminController.deleteCoupon);

admin_router.get("/adminOffers", adminController.adminOffers);
admin_router.get("/addOffers", adminController.addOffersGet);
admin_router.get("/addOffers", adminController.addOffers);
admin_router.post("/addOffers", adminController.addOffers);
admin_router.post("/deleteOffers", adminController.deleteOffers);

admin_router.get("/addUser", adminController.addUser);

admin_router.post("/addUser", adminController.addUserFunction);

admin_router.get("/editUser", adminController.editUser);

admin_router.post("/editUser", adminController.editUserFunction);

admin_router.get("/deleteUser", adminController.userDelete);



admin_router.get('/sales-report/download/:filter/:selectedValue/pdf', adminController.generatePdfReport);

// Add a route for Excel download
admin_router.get('/sales-report/download/:filter/:selectedValue/excel', adminController.generateExcelReport);



admin_router.get("/adminlogout", adminController.adminLogout);

module.exports = admin_router;
