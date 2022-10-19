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
        //request userId from path params
        const userId = req.params.userId;
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });

        //Destructuring
        const { cartId, productId, removeProduct } = req.body

        //request body validation => request body must not be empty
        if (!isValidRequestBody(req.body)) { return res.status(400).send({ status: false, message: "Please provide something to update!" }) }

        // CartId Validation => cardId is mandatory
        if (!isValid(cartId)) return res.status(400).send({ status: false, message: "Please enter cartId!" })
        //cartId must be a valid objcetId
        if (!mongoose.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please enter valid cartId!" })

        let findCart = await cartModel.findOne({ cartId: cartId })
        if (!findCart) { return res.status(404).send({ status: false, message: "Cart Id mot found in DB! " }) }

        //DB call => find cart from carttModel by cartId
        let cart = await cartModel.findOne({ userId: userId })
        //cart not found in DB
        if (!cart) { return res.status(400).send({ status: false, message: "Cart does not exist in the DB! " }) }
        //cart is blank
        if (cart.items.length == 0) { return res.status(400).send({ status: false, message: "Nothing left to update!" }) }

        //productId validation => productId is mandatory
        if (!isValid(productId)) return res.status(400).send({ status: false, message: "Please enter productId!" })
        //productId must be a valid objcetId
        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please enter valid productId!" })
        //DB call => find product from productModel by productId
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        //product not found in the DB
        if (!product) { return res.status(404).send({ status: false, message: "Product not found!" }) }

        //remove product validation => remove product must be 0 or 1
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

            //DB call and Update => update product details by requested body parameters 
            let updatedProduct = await cartModel.findByIdAndUpdate({ _id: cartId }, { items: cartItems, totalPrice: allPrice, totalItems: allItems }, { new: true })
            //Successfull upadate products in cart details return response to body
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

        res.status(204).send({ status: true, message: "Sucess" })  //204 for No content

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



module.exports = { createCart, updateCart, getCartDetails, deleteCart }


























































































































































































