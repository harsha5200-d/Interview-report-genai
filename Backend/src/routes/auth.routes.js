const {Router} = require("express")
const authController = require("../controller/auth.controller")
const authMiddleware = require("../middleware/auth.middleware")


const authRouter = Router();

/** 
 *  @route POST /api/auth/register
 *  @desc Register a new user
 *  @access Public
 */

authRouter.post("/register", authController.registerUserController);

/** 
 * @route POST /api/auth/login
 *  @desc Login a user
 *  @access Public
 */

authRouter.post("/login", authController.LoginUserController);
 // Implementation for user login

/** 
 * @route GET /api/auth/logout
 * @description clear token from user cookie and add token in the blacklist
 * @access public
 */
authRouter.get("/logout",authController.logoutUserController)
/**
 * @route GET/api/auth/get-me
 * @description get the current logged in user details 
 * @access private 
 */
authRouter.get("/get-me",authMiddleware.authUser,authController.getMeController)


module.exports = authRouter;

