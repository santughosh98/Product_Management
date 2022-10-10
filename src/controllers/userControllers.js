const userModel = require("../models/userModels")
const jwt = require("jsonwebtoken")
const aws = require("../aws/s3")


const createUser = async function (req, res){
    try {
        let data = req.body
        let {fname, lname, email,phone, password} = data
        
    } catch (error) {
        
    }
}