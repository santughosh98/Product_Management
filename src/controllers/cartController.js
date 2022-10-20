const productModel = require("../models/productModel")
const userModel = require("../models/userModels")
const cartModel = require("../models/cartModel")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")



//Validation
const { isValid, isValidRequestBody } = require("../validator/validation")


const createCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let { productId, cartId } = data

        var isValid = mongoose.Types.ObjectId.isValid(userId)
        if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid User Id" })

        let isUser = await userModel.findById(userId)
        if (!isUser) return res.status(404).send({ status: false, message: "user not found" })

        if (!isValidRequestBody(data))
            return res.status(400).send({ status: false, msg: "Enter Cart Details" })

        if (!cartId) {
            let cart = await cartModel.findOne({ userId: userId })
            if (cart) return res.status(400).send({ status: false, message: "Enter the Cart Id" })
            if (!productId) return res.status(400).send({ status: false, message: "Enter the Product Id" })

            var isValid = mongoose.Types.ObjectId.isValid(productId)
            if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Product Id" })

            var product = await productModel.findOne({ _id: productId, isDeleted: false, })
            if (!product) return res.status(404).send({ status: false, message: "Product not found" })

            let items = [{ productId: productId, quantity: 1 }]

            let dataAdded = { items: items, totalPrice: product.price, totalItems: 1, userId: userId }
            let saveData = await cartModel.create(dataAdded)
            res.status(201).send({ status: true, message: "Product has been added to the Cart", data: saveData })
        }
        else {
            var isValid = mongoose.Types.ObjectId.isValid(cartId)
            if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Cart Id" })

            let cart = await cartModel.findById(cartId)
            if (!cart) return res.status(404).send({ status: false, message: "Cart not found" })

            let UserIdn = cart.userId.toString()
            if (UserIdn != userId) return res.status(403).send({ status: false, message: "Wrong user Id" })

            if (!productId) return res.status(400).send({ status: false, message: "Enter the Product Id" })

            var isValid = mongoose.Types.ObjectId.isValid(productId)
            if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Product Id" })

            var product = await productModel.findOne({ isDeleted: false, _id: productId })
            if (!product) return res.status(404).send({ status: false, message: "Product not found" })


            let totalPrice = product.price + cart.totalPrice
            let items = cart.items
            if (items.quantity < 1) {
                return res.status(400).send({ status: false, message: "Your Card is Empty" })
            }

            for (let i = 0; i < items.length; i++) {
                if (items[i].productId.toString() == productId) {
                    cart.items[i].quantity += 1;
                    cart.totalPrice = totalPrice

                    cart.save()
                    return res.status(200).send({ status: true, message: "Success", data: cart })
                }
            }
            let sum = 0


            let newArray = [{ productId: productId, quantity: 1 }]
            items = [...items, ...newArray]
            for (let i = 0; i < items.length; i++) {
                sum += items[i].quantity
            }
            let obj = { totalPrice: totalPrice, totalItems: sum, userId: userId, items: items }
            let updatedData = await cartModel.findOneAndUpdate({ _id: cartId }, obj, { new: true })

            res.status(200).send({ status: true, message: "Success", data: updatedData })
        }

    } catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
};

// =========> Update Users Cart Api <============
const updateCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });

        const { cartId, productId, removeProduct } = req.body

        if (!isValidRequestBody(req.body)) { return res.status(400).send({ status: false, message: "Please provide something to update!" }) }

        if (!isValid(cartId)) return res.status(400).send({ status: false, message: "Please enter cartId!" })

        if (!mongoose.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please enter valid cartId!" })

        let findCart = await cartModel.findById(cartId)
        if (!findCart) { return res.status(404).send({ status: false, message: "Cart Id mot found in DB! " }) }

        let cart = await cartModel.findOne({ userId: userId })

        if (!cart) { return res.status(400).send({ status: false, message: "Cart does not exist in the DB! " }) }

        if (cart.items.length == 0) { return res.status(400).send({ status: false, message: "Nothing left to update!" }) }

        if (!isValid(productId)) return res.status(400).send({ status: false, message: "Please enter productId!" })

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please enter valid productId!" })

        let product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) { return res.status(404).send({ status: false, message: "Product not found!" }) }

        if (!(removeProduct == 1 || removeProduct == 0)) {
            return res.status(400).send({ status: false, message: "please mention 1 or 0 only in remove product" })
        }

        //declare variables
        let cartItems
        let productQuantity
        let productItems
        let allPrice
        let allItems

        //if removeProduct equal to 1
        if (removeProduct == 1) {
            cartItems = cart.items
            // array of items
            for (let i = 0; i < cartItems.length; i++) {
                if (cartItems[i].productId == productId) {
                    // decreasing quantity of product -1
                    productQuantity = cartItems[i].quantity - 1
                    cartItems[i].quantity = productQuantity
                    // updated total price after remove the product from cart
                    allPrice = cart.totalPrice - product.price;

                    if (cartItems[i].quantity == 0) {
                        cartItems.splice(i, 1)
                        //decrease the product count on successfull remove product
                        // only  if item quantity will become zero, totalItems will -1
                        productItems = cart.totalItems - 1
                        allItems = productItems
                    }
                    break;
                }
            }
            // if there will be no item in cart 
            if (cartItems.length == 0) { allPrice = 0; allItems = 0 };

            let updatedProduct = await cartModel.findByIdAndUpdate({ _id: cartId }, { items: cartItems, totalPrice: allPrice, totalItems: allItems }, { new: true })
            return res.status(200).send({ status: true, message: "Success", data: updatedProduct })

        }

        //if removeProduct equal to 0
        if (removeProduct == 0) {
            cartItems = cart.items
            // array of items
            for (let i = 0; i < cartItems.length; i++) {
                if (cartItems[i].productId == productId) {
                    //deducting products price from total price
                    allPrice = cart.totalPrice - (product.price * cartItems[i].quantity)
                    // decreasing totalItems quantity by 1     
                    allItems = cart.totalItems - 1
                    // deleting product from items array            
                    cartItems.splice(i, 1)
                    break;
                }
            }

        }
        // if items array will become empty
        if (cartItems.length == 0) { allPrice = 0; allItems = 0 };
        //DB call and Update => update product details by requested body parameters         
        let updatedProduct = await cartModel.findByIdAndUpdate({ _id: cartId }, { items: cartItems, totalPrice: allPrice, totalItems: allItems }, { new: true })

        return res.status(200).send({ status: true, message: "Success", data: updatedProduct })

    } catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
};




const getCartDetails = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter a correct userId" })

        const findCartUser = await cartModel.findOne({ userId })
        if (!findCartUser) { return res.status(404).send({ status: false, message: `${userId}cart not found` }) }

        res.status(200).send({ status: true, message: " Sucess", data: findCartUser })
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

        res.status(204).send({ status: true, message: "Sucess" })  //204 for No content

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



module.exports = { createCart, updateCart, getCartDetails, deleteCart }

