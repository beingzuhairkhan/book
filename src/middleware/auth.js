import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import logger from '../utils/logger.js'

export const verifyJWT = async (req ,res , next) => {
    logger.info("JWT verification endpoint hit...")
    try {
        const token = req.headers['authorization']?.split(' ')[1] || req.cookies?.accessToken ;
        if (!token) {
            logger.error("No token provided");
            return res.status(401).json({
                message: 'No token provided'
            });
        }
       // console.log("TOKEN" , token)
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.id ).select('-password -__v');
        // console.log("USER" , user)
        if (!user) {
            logger.error("User not found");
            return res.status(404).json({
                message: 'User not found'
            });
        }
        req.user = user;
        next();
    } catch (err) {
        logger.error(`JWT verification failed: ${err.message}`);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
}