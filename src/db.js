import mongoose from 'mongoose'
import logger from './utils/logger.js'
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        logger.info(`MongoDB Connected: ${conn.connection.host}`)
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.error(`Error: ${error.message}`.red.underline.bold)
        process.exit(1)
    }
}

export default connectDB