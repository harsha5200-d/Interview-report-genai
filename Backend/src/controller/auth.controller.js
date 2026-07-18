const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const JWT = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blacklist.model");

/**
 * 
 * @name registerUserController 
 * @description Controller for handling user registration
 * @route POST /api/auth/register
 * @access Public
 */


async function registerUserController(req, res) {
    
    
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const isUserExist = await userModel.findOne({ $or: [{ email }, { username }] });

        if (isUserExist) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hash = await bcrypt.hash(password, 10);

        const newuser = new userModel({ username, email, password: hash });

        await newuser.save();

        const token = JWT.sign(
            {
                id: newuser._id,
                username: newuser.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "14d" }
        )

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/",
            maxAge: 14 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json(
            {
                message: "User registered successfully",
                user: {
                    _id: newuser._id,
                    username: newuser.username,
                    email: newuser.email,
                }
            })

    } 
    catch (error) {
    console.log(error);

    res.status(500).json({
        message: error.message
    });
}
}

// async function LoginUserController(req,res)
// {
//     const {email , password} = req.body;

//     const user = await userModel.findOne({email})

//     if(!user)
//     {
//         return res.status(400).json({
//             message : "Invalid email or Password"
//         })
//     }

//     const isPasswordMatch = await bcrypt.compare(password, user.password);

//     if(!isPasswordMatch)
//     {
//         return res.status(400).json({
//             message: "Invalid email or Password"
//         })
//     }

//     const token = JWT.sign(
//         {id : user._id, username : user.username},
//         process.env.JWT_SECRET,
//             { expiresIn : "14d"}
//     )

//     res.cookie("token", token)
//     res.status(200).json({
//         message : "User LoggedIn successfully",
//         user : {
//             _id : user._id,
//             username : user.username,
//             email : user.email
//         }
//     })
// }
async function LoginUserController(req, res) {

    try {

        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or Password"
            });
        }

        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Invalid email or Password"
            });
        }

        const token = JWT.sign(
            {
                id: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "14d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            path: "/",
            maxAge: 14 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "User LoggedIn successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: error.message
        });

    }

}



async function logoutUserController(req,res)
{
    const token = req.cookies.token

    if(token)
    {
        await tokenBlackListModel.create({token})
    }

    res.clearCookie("token", { path: "/", sameSite: "none", secure: true });

    res.status(200).json({
        message:"User Logged Out Successfully"
    })
}

/**
 * 
 * @name getMeController 
 * @description get the current logged in user details
 * @access private 
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "user details fetched successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}


module.exports = {
    registerUserController,
    LoginUserController,
    logoutUserController,
    getMeController
}