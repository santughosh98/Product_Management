const productModel = require("../models/productModel")
const aws = require("../aws/s3")



const { isValid, isValidName, isValidRequestBody, isValidfild, isValidSizes, isValidMobile } = require("../validator/validation")



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
            // res.send the link back to frontend/postman
            uploadedFileURL = await aws.uploadFile(files[0])
        }

        let productImage = uploadedFileURL
        if (!isValid(productImage)) { return res.status(400).send({ status: false, message: "productimage is required" }) }

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
        if (!isValid(price)) return res.status(400).send({ status: false, message: "Price is required " });
        if (price <= 0) return res.status(400).send({ status: false, message: "Price cannot be zero" });
        if (!isValidMobile.test(price)) return res.status(400).send({ status: false, message: "Price should be Number" });

        //validations for currencyId
        if (!isValid(currencyId)) return res.status(400).send({ status: false, message: "CurrencyId is required" });
        if (!(currencyId == "INR")) return res.status(400).send({ status: false, message: "CurrencyId shoould INR" });

        // validations for currencyFormat
        if (!isValid(currencyFormat)) return res.status(400).send({ status: false, message: "currencyFormat is required" });
        if (!(currencyFormat == "₹")) return res.status(400).send({ status: false, message: "CurrencyFormat should be '₹'" });

        if (isFreeShipping || isFreeShipping == "") {
            if (!isValid(isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping is required" });

        }
        if (isFreeShipping !== true || false) return res.status(400).send({ status: false, message: "please enter isFreeShipping in correct format" });


        // validations for availableSize
        if (!isValid(availableSizes)) return res.status(400).send({ status: false, message: "Product Sizes is required" });
        availableSizes = availableSizes.toUpperCase().split(',');

        let existingSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
        for (i = 0; i < availableSizes.length; i++) {
            if (!(existingSize.includes(availableSizes[i]))) {
                return res.status(400).send({ status: false, message: `Size should be in ${['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']}` })
            }
        }
        if(!isValid(style)){return res.status(400).send({ status: false, message: "style is required" });}

        if(installments == ""){
            if(!isValid(installments)){return res.status(400).send({ status: false, message: "please enter installements" })}
        }
        if(isDeleted === true || isDeleted === ""){return res.status(400).send({ status: false, message: "isDeleted must be false" }) }

        const product = {title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted}

        const productCreation = await productModel.create(product)
        res.status(201).send({status: true, message: "Sucessfully Creation", data: productCreation})

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








module.exports = { createProduct, getProductsById }