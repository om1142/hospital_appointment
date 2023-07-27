require('dotenv').config();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const varifying_token = process.env.SECRET;

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, varifying_token, async (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.status(500).render('login' , {err: 'Authentication Error'});
            } else {
                // console.log(req.params);
                const phone = req.params.phone;
                // console.log(res.locals.user);
                // console.log(phone);
                

                const fraud = await User.findOne({ phone: phone });
                // console.log(fraud);
                if (fraud && fraud.phone == res.locals.user.phone) {
                    next();
                }
                else {
                    //  console.log("Bhai Bhai");
                    res.status(500).render('login' , {err: 'Login Required'});
                }
                // next();
            }
        });
    } else {
        console.log("User not logged in");
        res.status(500).render('login' , {err: 'Login Required'});
    }
}

const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, varifying_token, async (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.locals.user = null;
                next();
            } else {
                let user = await User.findById(decodedToken.id);
                res.locals.user = user;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
}
module.exports = { requireAuth, checkUser };