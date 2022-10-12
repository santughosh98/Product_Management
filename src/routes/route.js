const express = require('express');
const router = express.Router();
const { createUser, login, getUserDetails, updateduser } = require("../controllers/userControllers")
const {authentication, authorization} = require("../middleware/auth")



/*----------------------------------------------------User--------------------------------------------------------------*/
//create
router.post("/register", createUser)

//login
router.post("/login", login)

//get details
router.get("/user/:userId/profile", authentication, getUserDetails)

//update
router.put("/user/:userId/profile", authentication, authorization, updateduser)










router.all("/*", (req, res) => { res.status(400).send({ status: false, message: "Endpoint is not correct plese provide a proper end-point" }) })



module.exports = router


