const productModel = require("../models/productModel")
const aws = require("../aws/s3")
const mongoose = require("mongoose")



const { isValid, isValidName, isValidRequestBody, isValidfild, isValidSizes, isValidMobile, priceValid } = require("../validator/validation")



const createProduct = async function (req, res) {
    try {
        let data = req.body
        // let data = JSON.parse(JSON.stringify(req.body));  // for form data

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = data

        // validation for empty body
        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "body cant't be empty Please enter some data." }) }

        // s3 use
        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            uploadedFileURL = await aws.uploadFile(files[0])
        }

        let productImage = uploadedFileURL
        if (!isValid(productImage)) { return res.status(400).send({ status: false, message: "productImage is required" }) }

        //validation for title
        if (!isValid(title)) return res.status(400).send({ status: false, message: "Title is required" });
        if (!isValidName.test(title)) return res.status(400).send({ status: false, message: "Please provide valid title-name of the prodduct" });
        // uniqueness of the title
        let duplicateTitle = await productModel.findOne({ title })
        if (duplicateTitle) {
            return res.status(400).send({ status: false, message: "Product title already exists" });
        }

        //validation for description
        if (!isValid(description)) return res.status(400).send({ status: false, message: "Description is required " });

        //validation for price
        if (!isValidfild(price)) return res.status(400).send({ status: false, message: "Price is required " });
        if (price <= 0) return res.status(400).send({ status: false, message: "Price cannot be zero" });

        //validations for currencyId
        if (!isValid(currencyId)) return res.status(400).send({ status: false, message: "CurrencyId is required" });
        if (!(currencyId == "INR")) return res.status(400).send({ status: false, message: "CurrencyId shoould be INR" });

        // validations for currencyFormat
        if (!isValid(currencyFormat)) return res.status(400).send({ status: false, message: "currencyFormat is required" });
        if (!(currencyFormat == "₹")) return res.status(400).send({ status: false, message: "CurrencyFormat should be '₹'" });

        if (isFreeShipping || isFreeShipping === "") {
            // if (!isValid(isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping is required" });
            if (isFreeShipping !== true || false) return res.status(400).send({ status: false, message: "please enter isFreeShipping in correct format" });   /// this is not done
        }

        // validations for availableSize
        // availableSizes = JSON.parse(availableSizes)
        if (!isValid(availableSizes)) return res.status(400).send({ status: false, message: "Product Sizes is required" });
        availableSizes = availableSizes.toUpperCase().split(',');

        let existingSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
        for (i = 0; i < availableSizes.length; i++) {
            if (!(existingSize.includes(availableSizes[i]))) {
                return res.status(400).send({ status: false, message: `Size should be in ${['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']}` })
            }
        }
        if (!isValid(style)) { return res.status(400).send({ status: false, message: "style is required" }); }

        if (installments == "") {
            if (!isValid(installments)) { return res.status(400).send({ status: false, message: "please enter installements" }) }
        }
        if (isDeleted === true || isDeleted === "") { return res.status(400).send({ status: false, message: "isDeleted must be false" }) }

        const product = { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage, isDeleted }

        const productCreation = await productModel.create(product)
        res.status(201).send({ status: true, message: "Sucessfully Creation", data: productCreation })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}




const getProduct = async function (req, res) {
    try {
        let data = req.query
        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "query cant't be empty Please enter some data." }) }

        const filter = { isDeleted: false }
        {
            const { title, availableSizes, price } = data


            if (title) {
                filter['title'] = title
            }


            if (availableSizes) {
                filter['availableSizes'] = availableSizes
            }

            if (price) {
                filter['price'] = price
            }
            if (price === null) { return res.status(400).send({ status: false, message: "please enter price value" }) }
            if (price === "string") { return res.status(400).send({ status: false, message: "please enter price value in number" }) }// not done
        }

        const product = await productModel.find(filter).select({ title: 1, description: 1, price: 1, currencyId: 1, currencyFormat: 1, isFreeShipping: 1, style: 1, availableSizes: 1, installments: 1, isDeleted: 1 })
        //.sort({price: [$lte: 2000, $gte: 500]})

        if (!isValidRequestBody(product)) { return res.status(400).send({ status: false, message: "not found" }) }

        res.status(200).send({ status: true, message: "done", data: product })


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}





const getProductsById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!mongoose.isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "userId is invalid!" }) }

        let findProductId = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProductId) { return res.status(404).send({ status: false, message: "product details is not found" }) }

        res.status(200).send({ status: true, message: " product found sucessfully", data: findProductId })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        const data = req.body
        if (!productId) { return res.status(400).send({ status: false, message: "plese enter id in params" }) }

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "please enter a correct productId" })

        let findUserId = await productModel.findOne({ _id: productId })
        if (!findUserId) { return res.status(404).send({ status: false, message: "product details not found" }) }

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = data

        // validation for empty body
        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "body cant't be empty Please enter some data." }) }

        // s3 use
        let files = req.files
        let uploadedFileURL
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            uploadedFileURL = await aws.uploadFile(files[0])
        }

        let productImage = uploadedFileURL
        //  if (!isValid(productImage)) { return res.status(400).send({ status: false, message: "productImage is required" }) }

        if (typeof title === "string") {
            if (!isValid(title)) { return res.status(400).send({ status: false, message: "title is required for update" }) }
            if (!isValidName.test(title)) { return res.status(400).send({ status: false, message: `${title}please enter valid title` }) }
        }

        let duplicateEmail = await productModel.findOne({ title })
        if (duplicateEmail) { return res.status(404).send({ status: false, message: `${title} productName is aleardy exist` }) }

        // if (!isValid(description)) { return res.status(400).send({ status: false, message: "description is required for update" }) }


        if (typeof price === "string") {
            if (!isValid(price)) { return res.status(400).send({ status: false, message: "price is required for update" }) }
            if (price === null) { return res.status(400).send({ status: false, message: "price  " }) }
            if (!(/^[1-9]{1,5}$/).test(price)) {

                return res.status(400).send({ status: false, msg: "please Enter valid Price and it's length should be 8-15" })
            }

        }

        if (currencyId) {

            if (!isValid(currencyId)) { return res.status(400).send({ status: false, message: "currencyId is required for update" }) }

            if ((currencyId == "INR")) return res.status(400).send({ status: false, message: "CurrencyId shoould be INR" });

        }

        if (currencyFormat) {
            if (!isValid(currencyFormat)) return res.status(400).send({ status: false, message: "currencyFormat is required for update" });
            if (!(currencyFormat == "₹")) return res.status(400).send({ status: false, message: "CurrencyFormat should be '₹'" });
        }

        if (isFreeShipping || isFreeShipping === "") {
            if (!(isFreeShipping === "true" || "false")) { return res.status(400).send({ status: false, message: "please enter isFreeShipping in correct format for update" }) }
        }

        // validations for availableSize
        // availableSizes = JSON.parse(availableSizes)
        if (availableSizes) {
            if (!isValid(availableSizes)) return res.status(400).send({ status: false, message: "please provide avilable Sizes" });
            availableSizes = availableSizes.toUpperCase().split(',');

            let existingSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            for (i = 0; i < availableSizes.length; i++) {
                if (!(existingSize.includes(availableSizes[i]))) {
                    return res.status(400).send({ status: false, message: `Size should be in ${['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']}` })
                }
            }
        }

        if (style) {
            if (!isValid(style)) { return res.status(400).send({ status: false, message: "style is required for update" }); }
        }

        if (installments == "") {
            if (!isValid(installments)) { return res.status(400).send({ status: false, message: "please enter installements correctly" }) }
        }

        let updatedProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, {
            $set: {
                title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted
            },
        }, { new: true })

        return res.status(200).send({ status: true, message: "product updated sucessfully", data: updatedProduct })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        let save = req.body

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "please enter a correct productId" })

        if (Object.keys(save).length > 0) {
            return res.status(400).send({ status: false, message: "no entery here" })
        }
        console.log(productId);
        let product = await productModel.findById(productId)
        console.log(product);
        if (!product) {
            return res.status(404).send({ status: false, message: "invalid productId" })
        }
        if (product.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "product is already deleted" })
        }
        let savedata = await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: Date.now() } })
        return res.status(200).send({ status: true, message: "product data delete successfully" })
    } catch (err) {
        return res.status(500).send({ status: true, message: err.message })
    }
}







module.exports = { createProduct, getProduct, getProductsById, updateProduct, deleteProduct }