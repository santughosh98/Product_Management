const userModel = require("../models/userModels")
const jwt = require("jsonwebtoken")
const aws = require("../aws/s3")


const { isValidMail, isValid, isValidName, isValidRequestBody, isValidfild, isValidMobile, isValidPassword } = require("../validator/validation")



const createUser = async function (req, res) {
    try {
        const address = req.body.address
        let data = req.body
        let { fname, lname, email, phone, password } = data
        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "body cant't be empty Please enter some data." }) }
        if (!isValid(fname)) { return res.status(400).send({ status: false, message: "fname is required" }) }
        if (!isValidName.test(fname)) { return res.status(400).send({ status: false, message: "please enter valid fname" }) }

        if (!isValid(lname)) { return res.status(400).send({ status: false, message: "lname is required" }) }
        if (!isValidName.test(lname)) { return res.status(400).send({ status: false, message: "please enter valid lname" }) }

        if (!isValid(email)) { return res.status(400).send({ status: false, message: "email is required" }) }
        if (!isValidMail.test(email)) { return res.status(400).send({ status: false, message: "please enter email in valid format" }) }
        let duplicateEmail = await userModel.findOne({ email })
        if (duplicateEmail) { return res.status(400).send({ status: false, message: `${email} email is aleardy exist` }) }

        let files = req.files
        // if(!files) {return res.status(400).send({status: false, message: "profileImage is required"})}
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let uploadedFileURL = await aws.uploadFile(files[0])
            res.status(201).send({ msg: "file uploaded succesfully", data: uploadedFileURL })
        }
        else {
            res.status(400).send({ msg: "Please add profile image" })
        }

        let profileImage = uploadedFileURL


        if (!isValid(phone)) { return res.status(400).send({ status: false, message: "phone is required" }) }
        if (!isValidMobile.test(phone)) { return res.status(400).send({ status: false, message: "please enter phone in valid format" }) }
        let duplicatePhone = await userModel.findOne({ phone })
        if (duplicatePhone) { return res.status(400).send({ status: false, message: `${phone} phone no is aleardy registered` }) }

        if (!isValidPassword(password)) return res.status(406).send({ status: false, message: "enter valid password  ", ValidPassWord: "passWord in between(8-15)& must be contain ==> upperCase,lowerCase,specialCharecter & Number" })

        if (!isValid(address)) { return res.status(400).send({ status: false, message: "address is required" }) }

        if (!isValid(address.shipping)) { return res.status(400).send({ status: false, message: "please enter your shipping address" }) }

        if (!isValid(address.shipping.street)) { return res.status(400).send({ status: false, message: "please enter your shipping street" }) }

        if (!isValid(address.shipping.city)) { return res.status(400).send({ status: false, message: "please enter your shipping city" }) }

        if (!isValid(address.shipping.pincode)) { return res.status(400).send({ status: false, message: "please enter your shipping pincode" }) }

        if (address.shipping.pincode) {

            if (!(/^[1-9][0-9]{5}$/).test(address.pincode)) return res.status(400).send({ status: false, message: "please enter valied pincode " })
        }

        if (!isValid(address.billing)) { return res.status(400).send({ status: false, message: "please enter your billing address" }) }

        if (!isValid(address.billing.street)) { return res.status(400).send({ status: false, message: "please enter your billing street" }) }

        if (!isValid(address.billing.city)) { return res.status(400).send({ status: false, message: "please enter your billing city" }) }

        if (!isValid(address.billing.pincode)) { return res.status(400).send({ status: false, message: "please enter your shipping pincode" }) }

        if (address.billing.pincode) {

            if (!(/^[1-9][0-9]{5}$/).test(address.billing.pincode)) return res.status(400).send({ status: false, message: "please enter valied pincode " })
        }

        let users = { fname, lname, email, profileImage, phone, password, address }

        const userCreation = await userModel.create(users)
        res.status(201).send({ status: true, message: "Success", data: userCreation })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}








const login = async function (req, res) {
    try {
        let data = req.body
        let save = req.params

        if (object.keys(save).length > 0) {
            return res.status(400).send({ status: false, message: "this is not valid place for input" })
        }

        if (Object.keys(data).length == 0 && Object.keys(data).length > 2) {
            return res.status(400).send({ status: false, message: "this is not valid request" })

        }
        const { email, password } = data
        if (!email) { return res.status(404).send({ status: false, message: "email is mandatory" }) }

        if (!password) {
            return res.status(404).send({ status: false, message: "password is mandatory" })
        }

        const loginUser = await userModel.findOne({ email: email, password: password })
        if (!loginUser) {
            return res.status(400).send({ status: false, message: "Email or Password is incorrect.Please recheck it" })
        }
        let token = await jwt.sign({ id: loginUser._id.toString() }, "functionupiswaywaycoolproject5group9", { expiresIn: '2hr' })
        res.header({ "x-api-key": token })
        return res.status(201).send({ status: true, message: "login Successful", data: { token: token, userId: loginUser._id } })
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
}







module.exports = { createUser, login }