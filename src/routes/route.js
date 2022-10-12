const express = require('express');
const router = express.Router();
const { createUser, login, getUserDetails, updateduser } = require("../controllers/userControllers")
const { authentication, authorization } = require("../middleware/auth")
const { createProduct, getProductsById } = require("../controllers/productController")



/*----------------------------------------------------User--------------------------------------------------------------*/
//create
router.post("/register", createUser)

//login
router.post("/login", login)

//get details
router.get("/user/:userId/profile", authentication, authorization, getUserDetails)

//update
router.put("/user/:userId/profile", authentication, authorization, updateduser)


/*------------------------------------------------Product---------------------------------------------------------------*/

//create product
router.post("/products", createProduct)

// get details
router.get("/products/:productId", getProductsById)










router.all("/*", (req, res) => { res.status(400).send({ status: false, message: "Endpoint is not correct plese provide a proper end-point" }) })



module.exports = router


