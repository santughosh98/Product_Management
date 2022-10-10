const express = require('express');
const router = express.Router();
const { createUser, login } = require("../controllers/userControllers")



router.post("/register", createUser)
router.post("/login", login)










router.all("/*", (req, res) => { res.status(400).send({ status: false, message: "Endpoint is not correct plese provide a proper end-point" }) })



module.exports = router


