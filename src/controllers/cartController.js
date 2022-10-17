const productModel = require("../models/productModel")
const userModel = require("../models/userModels")
const cartModel = require("../models/cartModel")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")



//Validation
const { isValid, isValidName, strRegex, isValidRequestBody, isValidfild, isValidPrice, isValidMobile, priceValid } = require("../validator/validation")



const createCart = async function (req, res) {
    try {
        const userId = req.params.userId
        let data = req.body

        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter a correct userId" })

        let { productId, quantity, cartId } = data;

        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "body cant't be empty Please enter some data for update." }) }

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please provide valid Product Id!" });

        const findUser = await userModel.findOne({ _id: userId, isDeleated: false });

        if (!findUser) {
            return res.status(404).send({ status: false, message: `User doesn't exist by ${userId}!` });
        }

        const findProduct = await productModel.findById({ _id: productId });

        if (!findProduct) {
            return res.status(404).send({ status: false, message: `Product doesn't exist by ${productId}!` });
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


const getCartDetails = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter a correct userId" })

        const findCartUser = await cartModel.findOne({ userId })
        if (!findCartUser) { return res.status(404).send({ status: false, message: `${userId}cart not found` }) }

        res.status(200).send({ status: true, message: " Cart Details", data: findCartUser })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `${userId}please enter a correct userId` })

        const findCartUser = await cartModel.findOne({ userId })
        if (!findCartUser) { return res.status(404).send({ status: false, message: `${userId}cart not found` }) }

        let deletion = await cartModel.findOneAndUpdate({ userId },
            {
                $set:
                {
                    items: [],
                    totalPrice: 0,
                    totalItems: 0
                }
            },
            { new: true })

        res.status(200).send({ status: true, message: "Cart has been deleted sucessfully" })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



module.exports = { createCart, getCartDetails, deleteCart }


























































































































































































