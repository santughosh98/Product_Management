const cartModel = require("../models/cartModel")
const orderModel = require("../models/orderModel")
const userModel = require("../models/userModels")
const productModel = require("../models/productModel")
const mongoose = require("mongoose")




const { isValid, isValidRequestBody, isEmpty } = require("../validator/validation")



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

        let cartData = await cartModel.findOne({ _id: cartId })

        if (!cartData) { return res.status(404).send({ status: false, message: "cart not found" }) }

        if (cancellable) {
            if (typeof (cancellable != "boolean")) { return res.status(404).send({ status: false, message: "cancellable should be true or false only" }) }
        }

        if (status) {
            if (!["pending", "completed", "cancled"].includes(status)) {
                return res.status(400).send({ status: false, message: "status must be ['pending', 'completed', 'cancled']" })
            }
        }

        totalQuantity = 0;
        for (let i = 0; i < cartData.items.length; i++) {
            totalQuantity += cartData.items[i].quantity
        }

        const orderDetails = {
            userId: userId,
            items: cartData.items,
            totalPrice: cartData.totalPrice,
            totalItems: cartData.totalItems,
            totalQuantity: totalQuantity,
            cancellable: cancellable,
            status: status
        }

        await cartModel.findOneAndUpdate({ _id: cartId }, {
            $set: {
                items: [],
                totalPrice: 0,
                totalItems: 0,
            }
        }, { new: true })

        const orderSave = await orderModel.create(orderDetails)
        return res.status(201).send({ status: true, message: "sucess", data: orderSave })


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}




const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body

        const { orderId, status } = data

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "plese enter data in request body" })
        }
        if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please enter valid userId!" }) }

        let check = await userModel.findById(userId)
        if (!check) {
            return res.status(404).send({ status: false, message: "user is not found for this userId" })
        }
        if (!isValid(orderId)) return res.status(400).send({ status: false, message: "Please enter orderId!" })

        if (!mongoose.isValidObjectId(orderId)) { return res.status(400).send({ status: false, message: "Please enter valid orderId!" }) }

        const OrderFind = await orderModel.findById(orderId)
        if (!OrderFind) { return res.status(404).send({ status: false, message: "Please enter valid orderId!" }) }



        if (!isEmpty(status)) { return res.status(400).send({ status: false, message: "status must be parsent" }) }

        if (status) {
            if (!["pending", "completed", "cancled"].includes(status)) {
                return res.status(400).send({ status: false, message: "status must be ['completed', 'cancled']" })
            }
        }

        if (status === "pending") {
            if (OrderFind.status === "completed") {
                return res.status(400).send({ status: false, message: "order Can't be Updated  to pending because it is completed" })
            }
            if (OrderFind.status === "cancled") {
                return res.status(400).send({ status: false, message: "order Can't be Updated  to pending because it is cancled" })
            }
            if (OrderFind.status === "pending") {
                return res.status(400).send({ status: false, message: "order is already pending" })
            }
        }
        if (status === "completed") {
            if (OrderFind.status === "cancled") {
                return res.status(400).send({ status: false, message: "order Can't be Updated  to completed because it is cancled" })
            }
            if (OrderFind.status === "completed") {
                return res.status(400).send({ status: false, message: "order is already completed" })
            }

            const orderCheck = await orderModel.findOneAndUpdate({ _id: orderId }, {
                $set: {
                    items: [],
                    totalPrice: 0,
                    totalItems: 0,
                    totalQuantity: 0,
                    status
                }
            }, { new: true })
            return res.status(200).send({ status: true, message: "sucess", data: orderCheck })
        }

        if (status === "cancled") {
            if (OrderFind.cancellable === false) {
                return res.status(400).send({ status: false, message: "item can't be cancled because not cancellable" })
            }

            if (OrderFind.status === "cancled") {
                return res.status(400).send({ status: false, message: "order is already cancled" })
            }

            const orderCheckAfter = await orderModel.findOneAndUpdate({ _id: orderId }, {
                $set: {
                    items: [],
                    totalPrice: 0,
                    totalItems: 0,
                    totalQuantity: 0,
                    status
                }
            }, { new: true })

            return res.status(200).send({ status: true, message: "sucess", data: orderCheckAfter })

        }
    }
    catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}





module.exports = { createOrder, updateOrder }
