import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db.js'
import logger from './utils/logger.js'
import userRoutes from './routes/user.route.js'
import bookRoutes from './routes/book.route.js'
import helmet from 'helmet'
dotenv.config();


const app = express();
const PORT = process.env.PORT || 8000 ;

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(helmet());


app.get('/' , (req,res)=>{
    res.send('Hello World');
})
app.use('/api/v1/user' , userRoutes);
app.use('/api/v1/bookstore' , bookRoutes);
app.get(/(.*)/, (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Page not found'
  });
});
app.listen(PORT , ()=>{
    console.log(`Server is running on port ${PORT}`);
    logger.info(`Server is running on port ${PORT}`);
    connectDB();
})