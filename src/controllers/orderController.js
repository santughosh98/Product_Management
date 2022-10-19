const cartModel = require("../models/cartModel")
const orderModel = require("../models/orderModel")
const userModel = require("../models/userModels")
const productModel = require("../models/productModel")
const mongoose = require("mongoose")




const { isValid, isValidName, strRegex, isValidRequestBody, isValidfild, isValidPrice, isValidMobile, priceValid, isEmpty, validQuantity } = require("../validator/validation")



const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId

        const data = req.body

        if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "user Id not valid" }) }

        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser) { return res.status(404).send({ status: false, message: "user Id does not exist" }) }

        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "body cant be empty please enter some data" }) }

        let { cartId, totalQuantity, status, cancellable } = data

        if (!isEmpty(cartId)) { return res.status(400).send({ status: false, message: "cartId is required" }) }

        if (!mongoose.isValidObjectId(cartId)) { return res.status(400).send({ status: false, message: "cart Id in not valid" }) }

        let cartData = await cartModel.findOne({ _id: cartId, userId, }).select({ items: 1, totalPrice: 1, totalItems: 1 })

        if (!cartData) { return res.status(404).send({ status: false, message: "cart not found" }) }


        totalQuantity = 0;
        for (let i = 0; i < cartData.items.length; i++) {
            totalQuantity += cartData.items[i].quantity
            console.log(totalQuantity);
        }

        if (cancellable) {
            if (!(cancellable == false || cancellable == true)) {
                return res.status(400).send({ status: false, message: "cancellable should be true or false only" })
            }
        }

        if (status) {
            if (!["pending", "completed", "cancled"].includes(status)) {
                return res.status(400).send({ status: false, message: "status must be ['pending', 'completed', 'cancled']" })
            }
        }

        const orderDetails = {
            userId: userId,
            items: cartData.items,
            totalPrice: cartData.totalPrice,
            totalItems: cartData.totalItems,
            totalQuantity: totalQuantity,
            cancellable: cancellable
        }

        const orderSave = await orderModel.create(orderDetails)
        return res.status(201).send({ status: true, message: "Sucess", data: orderSave })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}




const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body

        const { orderId, status } = data
        console.log(orderId);

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "plese enter data in request body" })
        }
        if (!isValid(orderId)) return res.status(400).send({ status: false, message: "Please enter orderId!" })

        if (!mongoose.isValidObjectId(orderId)) { return res.status(400).send({ status: false, message: "Please enter valid orderId!" }) }

        let check = await userModel.findById(userId)
        if (!check) {
            return res.status(400).send({ status: false, message: "user is not found for this userId" })
        }

        if (!isEmpty(status)) { return res.status(400).send({ status: false, message: "status must be parsent" }) }

        if (status) {
            if (!["completed", "cancled"].includes(status)) {
                return res.status(400).send({ status: false, message: "status must be ['completed', 'cancled']" })
            }
        }

        let orderCheck = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })
        if (!orderCheck) {
            return res.status(404).send({ status: false, message: "order is not present for this orderId" })
        }

        if (orderCheck.cancellable == false) {
            return res.status(400).send({ status: false, message: "your order is already canceld" })
        }
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

        res.status(200).send({
            status: true, message: "success", data: deletion
        })
    }
    catch(error){
        return res.status(500).json({ status: false, message: error.message });
    }
}





module.exports = { createOrder, updateOrder }






































































































































































































































































