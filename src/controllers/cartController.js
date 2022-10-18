const productModel = require("../models/productModel")
const userModel = require("../models/userModels")
const cartModel = require("../models/cartModel")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")



//Validation
const { isValid, isValidName, strRegex, isValidRequestBody, isValidfild, isValidPrice, isValidMobile, priceValid, isEmpty, validQuantity } = require("../validator/validation")


const createCart = async (req, res) => {
    try {
        let data = req.body;
        if (!isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

        let userId = req.params.userId;
        if (!mongoose.isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId Id" });

        let { productId, cartId, quantity } = data;
        if (!isEmpty(productId))
            return res.status(400).send({ status: false, message: "productId required" });
        if (!mongoose.isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid productId" });

        if (!quantity) { quantity = 1 }

        quantity = Number(quantity);
        if (typeof quantity !== "number")
            return res.status(400).send({ status: false, message: "quantity must be a number" });
        if (quantity < 1)
            return res.status(400).send({ status: false, message: "quantity cannot be less then 1" });

        if (cartId) {                                       // checking cartId
            if (!mongoose.isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: "Invalid cartId" });
        }

        let checkUser = await userModel.findOne({ _id: userId });
        if (!checkUser)
            return res.status(404).send({ status: false, message: "User does not exists" });

        if (cartId) {
            var findCart = await cartModel.findOne({ _id: cartId });
            if (!findCart)
                return res.status(404).send({ status: false, message: "Cart does not exists" });
        }

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!checkProduct)
            return res.status(404).send({ status: false, message: "No products found or product has been deleted" });

        let checkCart = await cartModel.findOne({ userId: userId });
        if (!checkCart && findCart) {
            return res.status(403).send({ status: false, message: "Cart does not belong to this user" });
        }
        if (checkCart) {
            if (cartId) {
                if (checkCart._id.toString() != cartId)
                    return res.status(403).send({ status: false, message: "Cart does not belong to this user" });
            }
            let ProdIdInCart = checkCart.items;
            let uptotal = checkCart.totalPrice + checkProduct.price * Number(quantity);
            let productId = checkProduct._id.toString();
            for (let i = 0; i < ProdIdInCart.length; i++) {
                let productfromitem = ProdIdInCart[i].productId.toString();

                //updates previous product i.e QUANTITY
                if (productId == productfromitem) {
                    let previousQuantity = ProdIdInCart[i].quantity;
                    let updatedQuantity = previousQuantity + quantity;
                    ProdIdInCart[i].quantity = updatedQuantity;
                    checkCart.totalPrice = uptotal;
                    await checkCart.save();
                    return res.status(200).send({ status: true, message: "Success", data: checkCart });
                }
            }
            //adds new product
            checkCart.items.push({ productId: productId, quantity: Number(quantity) });
            let total = checkCart.totalPrice + checkProduct.price * Number(quantity);
            checkCart.totalPrice = total;
            let count = checkCart.totalItems;
            checkCart.totalItems = count + 1;
            await checkCart.save();
            return res.status(200).send({ status: true, message: "Success", data: checkCart });
        }

        let calprice = checkProduct.price * Number(quantity);           // 1st time cart
        let obj = {
            userId: userId,
            items: [{ productId: productId, quantity: quantity }],
            totalPrice: calprice,
        };
        obj["totalItems"] = obj.items.length;
        let result = await cartModel.create(obj);
        return res.status(201).send({ status: true, message: "Success", data: result });
    } catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
};

// =========> Update Users Cart Api <============
const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        if (!userId) {
            return res
                .status(400)
                .send({ status: false, message: "userid is required" });
        }
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({
                status: false,
                message: "please enter valid user Id",
            });
        }
        //if userid exist in user model
        let user = await userModel.findById(userId);
        if (!user) {
            return res
                .status(400)
                .send({ status: false, message: "user dont exist" });
        }

        let data = req.body;
        let { productId, cartId, removeProduct } = data;
        if (!isValidRequestBody(data)) {
            return res.status(400).send({
                status: false,
                message: "please provide Cart details",
            });
        }
        if (!isEmpty(productId)) {
            return res.status(400).send({
                status: false,
                messege: "please provide productId",
            });
        }
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({
                status: false,
                message: "Invalid productId! Please provide a valid productId",
            });
        }
        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!findProduct) {
            return res
                .status(404)
                .send({ status: false, message: "product not found." });
        }
        if (findProduct.isDeleted === true) {
            return res.status(400).send({ status: false, msg: "product is deleted" });
        }

        //validation for cart ID
        if (!isEmpty(cartId)) {
            return res.status(400).send({
                status: false,
                messege: "please provide cartId",
            });
        }

        if (!mongoose.isValidObjectId(cartId)) {
            return res.status(400).send({
                status: false,
                message: "invalid cartId! Please provide a valid cartId",
            });
        }
        //check if the cart is already exist or not
        const findCart = await cartModel.findOne({ userId: userId });
        if (!findCart) {
            return res.status(404).send({
                status: false,
                message: "cart not found.",
            });
        }
        if (findCart._id != cartId) {
            return res.status(400).send({
                status: false,
                message: "CartId does't belong to this user!",
            });
        }
        //validation for remove product
        if (!isEmpty(removeProduct)) {
            return res.status(400).send({
                status: false,
                messege: "please provide items to delete",
            });
        }
        if (isNaN(Number(removeProduct))) {
            return res.status(400).send({
                status: false,
                message: "removeProduct should be a valid number",
            });
        }
        if (removeProduct < 0 || removeProduct > 1) {
            return res.status(400).send({
                status: false, 
                message: "removeProduct should be 0 or 1",
            });
        }
        let findQuantity = findCart.items.find(
            (x) => x.productId.toString() === productId
        );

        if (removeProduct == 0) {
            let itemsarr = findCart.items
            if (itemsarr.length == []) {
                return res.status(400).send({ status: false, message: "No products to remove cart is empty" });
            }
            let totalAmount =
                findCart.totalPrice - findProduct.price * findQuantity.quantity;
            let quantity = findCart.totalItems - 1;
            let newCart = await cartModel.findOneAndUpdate(
                { _id: cartId },
                {
                    $pull: { items: { productId: productId } },
                    $set: { totalPrice: totalAmount, totalItems: quantity },
                },
                { new: true }
            );

            return res.status(200).send({
                status: true,
                message: "the product has been removed from the cart",
                data: newCart,
            });
        }

        if (removeProduct == 1) {
            let itemsarr = findCart.items
            if (itemsarr.length == []) {
                return res.status(400).send({ status: false, message: "No products found to reduce with given productid in cart" });
            }
            let totalAmount = findCart.totalPrice - findProduct.price;
            let items = findCart.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].productId.toString() === productId) {
                    items[i].quantity = items[i].quantity - 1;
                    if (items[i].quantity == 0) {
                        var noOfItems = findCart.totalItems - 1;
                        let newCart = await cartModel.findOneAndUpdate(
                            { _id: cartId },
                            {
                                $pull: { items: { productId: productId } },
                                $set: { totalPrice: totalAmount, totalItems: noOfItems },
                            },
                            { new: true }
                        );
                        return res.status(200).send({
                            status: true,
                            message: "the product has been removed from the cart",
                            data: newCart,
                        });
                    }
                }
            }
            let updatedData = await cartModel.findOneAndUpdate(
                { _id: cartId },
                { totalPrice: totalAmount, items: items },
                { new: true }
            );
            return res.status(200).send({
                status: true,
                message: "product in the cart updated successfully.",
                data: updatedData,
            });
        }
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



module.exports = { createCart, updateCart, getCartDetails, deleteCart }


























































































































































































