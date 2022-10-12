const isValidMail = (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);

const isValidName = /^[a-zA-Z. ]{3,20}$/

const isValid = (value) => {
    if (typeof value === "undefined" || value === null || value === "number") return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

const isValidfild = (value) => {
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

const isValidRequestBody = (value) => {
    return Object.keys(value).length > 0
}

const isValidMobile = /^[6-9]{1}[0-9]{9}$/;

const isValidPassword = function (value) {
    if (/^[\s]*[0-9a-zA-Z@#$%^&]{8,15}[\s]*$/.test(value)) return true;              //(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-])
    return false;
};


const isValidSizes = (size) => {
    const validSize = size.split(",").map(x => x.trim())
    let givenSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
    for (let i = 0; i < validSize.length; i++) {
        if (!givenSizes.includes(validSize[i])) {
            return false
        }
    }
    return true
}



module.exports = {
    isValidMail, isValid, isValidName, isValidRequestBody, isValidfild, isValidMobile, isValidPassword, isValidSizes
}