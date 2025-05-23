import express from 'express'
import {
    createBook, getBooks, getBookById,
    submitReview, updateReview, deleteReview, searchBooks ,createManyBook
} from '../controllers/book.controller.js'
import { verifyJWT } from '../middleware/auth.js'

const router = express.Router()

router.post('/books/bulk', verifyJWT, createManyBook);
router.post('/books', verifyJWT, createBook);
router.get('/books', verifyJWT, getBooks);
router.get('/books/:id', verifyJWT, getBookById);
router.post('/books/:id/review', verifyJWT, submitReview);
router.put('/books/:id/review/:reviewId', verifyJWT, updateReview);
router.delete('/books/:id/review/:reviewId', verifyJWT, deleteReview);
router.get('/books/search', searchBooks);

export default router