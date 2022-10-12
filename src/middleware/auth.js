const jwt = require("jsonwebtoken");
const userModels = require("../models/userModels");


const authentication = async function (req, res, next) {
    try {

        let token = req.headers["Authorization"] || req.headers["authorization"];

        if (!token) return res.status(401).send({ status: false, message: "Missing authentication token in request" });

        let Bearer = token.split(' ');

        let decodedToken = jwt.verify(Bearer[1], "functionupiswaywaycoolproject5group9")
        // req.decodedToken = decodedToken.userId;
        console.log(decodedToken);

        next();

    } catch (error) {
        if (error.message == 'invalid token') return res.status(401).send({ status: false, message: "invalid token" });

        if (error.message == "jwt expired") return res.status(401).send({ status: false, message: "please login one more time, token is expired" });

        if (error.message == "invalid signature") return res.status(401).send({ status: false, message: "invalid signature" });

        return res.status(500).send({ status: false, message: error.message });
    }
};



const authorization = async function (req, res, next) {
    try {
        const decodedToken = req.decodedToken
        const userId = req.params.userId


        if (!userId) {
            return res.status(400).send({ status: false, message: " userId is required" })
        }
        // const userData = await userModels.findOne({ _id: userId})
        // if(!userData){ return res.status(404).send({status: false, message: " userId is not found"})}

        if (decodedToken.userId !== userId) {
            console.log(decodedToken);
            console.log(userId);
            return res.status(403).send({ status: false, message: "unauthorized access" })
        }
        else {
            next()
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}




module.exports = { authentication, authorization };