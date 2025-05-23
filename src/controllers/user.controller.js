import User from '../models/user.model.js'
import logger from '../utils/logger.js'
import { validateRegistration, validateLogin } from '../utils/validation.js'

export const registerUser = async (req, res) => {
    logger.info("Registration endpoint hit...")
    try {
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.error(error.details[0].message);
            return res.status(400).json({
                message: error.details[0].message
            })
        }
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({
            $or: [
                { email },
                { username }
            ]
        })
        if (existingUser) {
            logger.error("User already exists");
            return res.status(400).json({
                message: 'User already exists'
            })
        }
        const user = new User({
            username,
            email,
            password
        })
        await user.save();
        logger.info(`User registered: ${username}`);

        return res.status(201).json({
            message: 'User registered successfully',
            user
        });

    } catch (err) {
        logger.error(`Registration failed: ${err.message}`);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
}

export const loginUser =  async (req , res) => {
    logger.info("Login endpoint hit...")
    try{
        const { error } = validateLogin(req.body);
        if (error) {
            logger.error(error.details[0].message);
            return res.status(400).json({
                message: error.details[0].message
            })
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            logger.error("Invalid credentials");
            return res.status(401).json({
                message: 'Invalid credentials'
            })
        }
        const isMatch = await user.comparePassword(password);
         console.log("isMatch" , isMatch)
        if (!isMatch) {
            logger.error("Password does not match");
            return res.status(401).json({
                message: 'Password does not match'
            })
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        logger.info(`User logged in: ${user.username}`);
        return res.status(200).json({
            message: 'User logged in successfully',
            accessToken,
            refreshToken
        });

    }catch(err){
        logger.error(`Login failed: ${err.message}`);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }

}