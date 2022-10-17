const isValidMail = (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);

const isValidName = /^[a-zA-Z. ]{3,20}$/

const priceValid =  (/^[\s][0-9]{1,6}[\s]$/)

const isValid = (value) => {
    if (typeof value === "undefined" || value === null || typeof value === "number" || typeof value === "boolean") return false
    if (typeof value === "string" && value.trim().length === 0) return false
    if (typeof value === "object" && Object.keys(value).length === 0) return false
    return true
}

const isValidfild = (value) => {
    if (typeof value === "undefined" || value === null || typeof value === "boolean") return false;
    if (typeof value === "number" && value.toString().trim().length === 0) return false
    return true;
}

const isEmpty = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
  };

const isValidRequestBody = (value) => {
    if( Object.keys(value).length === 0) return false
    return true
}

const isValidPrice = function (price) {
    let priceRegex = /^([0-9]{0,2}((.)[0-9]{0,2}))$/
    return priceRegex.test(price)
  }

const strRegex = (value) => {
    let strRegex = /^[A-Za-z\s]{0,}[\.,'-]{0,1}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}$/;
    if (strRegex.test(value))
      return true;
  }

const isValidMobile = /^[6-9]{1}[0-9]{9}$/;


const isValidPassword = function (value) {
    if (/^[\s]*[0-9a-zA-Z@#$%^&]{8,15}[\s]*$/.test(value)) return true;              //(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-])
    return false;
};



module.exports = {
    isValidMail, isValid, isValidName, isEmpty, isValidPrice, isValidRequestBody, isValidfild, isValidMobile, isValidPassword, priceValid, strRegex
}