const userModel = require("../models/userModels")
const jwt = require("jsonwebtoken")
const aws = require("../aws/s3")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")


const { isValidMail, isValid, isValidName, isValidRequestBody, isValidfild, isValidMobile, isValidPassword } = require("../validator/validation")



/*--------------------------------------------------------CreateUser----------------------------------------------------*/

const createUser = async function (req, res) {
    try {
        let data = req.body
        let { fname, lname, email, phone, password, address } = data
        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "body cant't be empty Please enter some data." }) }
        if (!isValid(fname)) { return res.status(400).send({ status: false, message: "fname is required" }) }
        if (!isValidName.test(fname)) { return res.status(400).send({ status: false, message: `${fname}please enter valid fname` }) }

        if (!isValid(lname)) { return res.status(400).send({ status: false, message: "lname is required" }) }
        if (!isValidName.test(lname)) { return res.status(400).send({ status: false, message: `${lname}please enter valid lname` }) }

        if (!isValid(email)) { return res.status(400).send({ status: false, message: "email is required" }) }
        if (!isValidMail.test(email)) { return res.status(400).send({ status: false, message: "please enter email in valid format" }) }
        let duplicateEmail = await userModel.findOne({ email })
        if (duplicateEmail) { return res.status(404).send({ status: false, message: `${email} email is aleardy exist` }) }

        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            uploadedFileURL = await aws.uploadFile(files[0])
        }

        let profileImage = uploadedFileURL
        if (!isValid(profileImage)) { return res.status(400).send({ status: false, message: "profileImage is required" }) }

        if (!isValid(phone)) { return res.status(400).send({ status: false, message: "phone is required" }) }
        if (!isValidMobile.test(phone)) { return res.status(400).send({ status: false, message: "please enter phone in valid format" }) }
        let duplicatePhone = await userModel.findOne({ phone })
        if (duplicatePhone) { return res.status(404).send({ status: false, message: `${phone} phone no is aleardy registered` }) }

        if (!isValid(password)) { return res.status(400).send({ status: false, message: "password is required" }) }
        if (!isValidPassword(password)) return res.status(406).send({ status: false, message: "enter valid password  ", ValidPassWord: "passWord in between(8-15)& must be contain ==> upperCase,lowerCase,specialCharecter & Number" })

        if (!isValid(address)) { return res.status(400).send({ status: false, message: "address is required" }) }

        address = JSON.parse(address)

        if (!isValid(address.shipping)) { return res.status(400).send({ status: false, message: "please enter your shipping address" }) }

        if (!isValid(address.shipping.street)) { return res.status(400).send({ status: false, message: "please enter your shipping street" }) }

        if (!isValid(address.shipping.city)) { return res.status(400).send({ status: false, message: "please enter your shipping city" }) }

        if (!isValid(address.shipping.pincode)) { return res.status(400).send({ status: false, message: "please enter your shipping pincode" }) }

        if (address.shipping.pincode) {

            if (!/^[1-9][0-9]{5}$/.test(address.shipping.pincode)) return res.status(400).send({ status: false, message: "please enter valid pincode " })
        }

        if (!isValid(address.billing)) { return res.status(400).send({ status: false, message: "please enter your billing address" }) }

        if (!isValid(address.billing.street)) { return res.status(400).send({ status: false, message: "please enter your billing street" }) }

        if (!isValid(address.billing.city)) { return res.status(400).send({ status: false, message: "please enter your billing city" }) }

        if (!isValid(address.billing.pincode)) { return res.status(400).send({ status: false, message: "please enter your shipping pincode" }) }

        if (address.billing.pincode) {

            if (!(/^[1-9][0-9]{5}$/).test(address.billing.pincode)) return res.status(400).send({ status: false, message: "please enter valied pincode " })
        }

        const salt = await bcrypt.genSalt(10)
        password = await bcrypt.hash(password, salt)

        let users = { fname, lname, email, profileImage, phone, password, address }

        const userCreation = await userModel.create(users)
        res.status(201).send({ status: true, message: "Success", data: userCreation })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}





/*----------------------------------------------------Login------------------------------------------------------------*/

const login = async function (req, res) {
    try {
        let data = req.body

        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "body cant't be empty Please enter some data." }) }

        const { email, password } = data
        if (!isValid(email)) { return res.status(400).send({ status: false, message: "email is required" }) }
        if (!isValidMail.test(email)) { return res.status(400).send({ status: false, message: "please enter email in valid format" }) }

        if (!isValid(password)) { return res.status(400).send({ status: false, message: "password is required" }) }
        if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "enter valid password  ", ValidPassWord: "passWord in between(8-15)& must be contain ==> upperCase,lowerCase,specialCharecter & Number" })


        const loginUser = await userModel.findOne({ email: email })
        if (!loginUser) {
            return res.status(400).send({ status: false, message: "Email is incorrect.Please recheck it" })
        }

        let passwordCheck = await bcrypt.compare(password, loginUser.password)
        //request body password and bcrypt hash password not match
        if (!passwordCheck) return res.status(400).send({ status: false, message: "password is not correct!" })

        let token = await jwt.sign({ id: loginUser._id.toString() }, "functionupiswaywaycoolproject5group9", { expiresIn: '2hr' })
        res.header({ "x-api-key": token })
        return res.status(201).send({ status: true, message: "login Successful", data: { token: token, userId: loginUser._id } })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}




/*------------------------------------------------GetUserDetails--------------------------------------------------------*/

const getUserDetails = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "userId is invalid!" }) }

        let findUserId = await userModel.findOne({ _id: userId })
        if (!findUserId) { return res.status(404).send({ status: false, message: "user details is not found" }) }

        res.status(200).send({ status: true, message: "User profile details", data: findUserId })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}





/*---------------------------------------------------Update-------------------------------------------------------------*/

const updateduser = async function (req, res) {
    try {
        let userId = req.params.userId
        const data = req.body
        if (!userId) {
            return res.status(400).send({ status: false, message: "plese enter id in params" })
        }
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter a correct userId" })

        let findUserId = await userModel.findOne({ _id: userId })
        if (!findUserId) { return res.status(404).send({ status: false, message: "user details not found" }) }

        let { fname, lname, email, profileImage, phone, password, address } = data
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, meassage: "body cant't be empty Please enter some data." })
        }

        if (!(fname || lname || email || profileImage || phone || password || address)) {
            return res.status(400).send({ status: false, message: "please input a valid params" })
        }
        if (fname) {
            if (!isValid(fname)) { return res.status(400).send({ status: false, message: "fname is required for update" }) }
            if (!isValidName.test(fname)) { return res.status(400).send({ status: false, message: `${fname}please enter valid fname` }) }
        }

        if (lname) {
            if (!isValid(lname)) { return res.status(400).send({ status: false, message: "lname is required for update" }) }
            if (!isValidName.test(lname)) { return res.status(400).send({ status: false, message: `${lname}please enter valid lname` }) }
        }

        if (email) {
            if (!isValid(email)) { return res.status(400).send({ status: false, message: "email is required for update" }) }
            if (!isValidMail.test(email)) { return res.status(400).send({ status: false, message: "please enter email in valid format" }) }
            let duplicateEmail = await userModel.findOne({ email })
            if (duplicateEmail) { return res.status(404).send({ status: false, message: `${email} email is aleardy exist` }) }
        }
        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            uploadedFileURL = await aws.uploadFile(files[0])
        }

        profileImage = uploadedFileURL
        // if (!isValid(profileImage)) { return res.status(400).send({ status: false, message: "profileImage is required for update" }) }

        if (phone) {
            if (!isValid(phone)) { return res.status(400).send({ status: false, message: "phone is required for update" }) }
            if (!isValidMobile.test(phone)) { return res.status(400).send({ status: false, message: "please enter phone in valid format" }) }
            let duplicatePhone = await userModel.findOne({ phone })
            if (duplicatePhone) { return res.status(404).send({ status: false, message: `${phone} phone no is aleardy registered` }) }
        }

        if (password) {
            if (!isValid(password)) { return res.status(400).send({ status: false, message: "password is required for update" }) }
            if (password === null) { return res.status(400).send({ status: false, message: "password " }) }

            if (!isValidPassword(password)) return res.status(406).send({ status: false, message: "enter valid password  ", ValidPassWord: "passWord in between(8-15)& must be contain ==> upperCase,lowerCase,specialCharecter & Number" })
            const salt = await bcrypt.genSalt(10)
            password = await bcrypt.hash(password, salt)
        }

        if (address) {
            if (!isValid(address)) { return res.status(400).send({ status: false, message: "address is required for update" }) }

            address = JSON.parse(address)

            if (address.shipping) {

                if (!isValid(address.shipping)) { return res.status(400).send({ status: false, message: "please enter your shipping address for update" }) }

                if (!isValid(address.shipping.street)) { return res.status(400).send({ status: false, message: "please enter your shipping street for update" }) }

                if (!isValid(address.shipping.city)) { return res.status(400).send({ status: false, message: "please enter your shipping city for update" }) }

                if (!isValid(address.shipping.pincode)) { return res.status(400).send({ status: false, message: "please enter your shipping pincode for update" }) }

                if (address.shipping.pincode) {

                    if (!/^[1-9][0-9]{5}$/.test(address.shipping.pincode)) return res.status(400).send({ status: false, message: "please enter valid pincode for update" })
                }
            }



            if (address.billing) {

                if (!isValid(address.billing)) { return res.status(400).send({ status: false, message: "please enter your billing address for update" }) }

                if (!isValid(address.billing.street)) { return res.status(400).send({ status: false, message: "please enter your billing street for update" }) }

                if (!isValid(address.billing.city)) { return res.status(400).send({ status: false, message: "please enter your billing city for update" }) }

                if (!isValid(address.billing.pincode)) { return res.status(400).send({ status: false, message: "please enter your shipping pincode for update" }) }

                if (address.billing.pincode) {

                    if (!(/^[1-9][0-9]{5}$/).test(address.billing.pincode)) return res.status(400).send({ status: false, message: "please enter valied pincode for update" })
                }
            }
        }




        let updateduser = await userModel.findOneAndUpdate({ _id: userId }, {
            $set: {
                fname: fname,
                lname: lname,
                email: email,
                profileImage: profileImage,
                phone: phone,
                password: password,
                address: address
            },
        }, { new: true })

        return res.status(200).send({ status: true, message: "User profile updated sucessfully", data: updateduser })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}






module.exports = { createUser, login, getUserDetails, updateduser }