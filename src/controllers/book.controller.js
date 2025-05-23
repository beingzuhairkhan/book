import User from '../models/user.model.js'
import Book from '../models/book.model.js'
import Review from '../models/review.model.js'
import { validateBook, validateReview, validateUpdateReview } from '../utils/validation.js'
import logger from '../utils/logger.js'
import mongoose from 'mongoose'

export const createManyBook = async (req, res) => {
  try {
    const { books } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({
        message: 'No books provided for insertion'
      });
    }

    const userId = req.user._id;

    // Attach createdBy to each book
    const newBooks = books.map(book => ({
      ...book,
      createdBy: userId
    }));

    // Insert books into DB
    const insertedBooks = await Book.insertMany(newBooks);

    logger.info(`Books created: ${insertedBooks.length}`);

    return res.status(201).json({
      message: 'Books created successfully',
      books: insertedBooks
    });

  } catch (err) {
    logger.error(`Failed to create books: ${err.message}`);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message
    });
  }
};

export const createBook = async (req, res) => {
  logger.info("Create book endpoint hit...")
  try {
    const { error } = validateBook(req.body);
    if (error) {
      logger.error(error.details[0].message);
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    const { title, author, genre, description, publishedYear } = req.body;
    const userId = req.user._id;
     console.log("userId" , userId) 

    const book = new Book({
      title,
      author,
      genre,
      description,
      publishedYear,
      createdBy: userId
    });

    await book.save();
    logger.info(`Book created: ${title}`);

    return res.status(201).json({
      message: 'Book created successfully',
      book
    });
  } catch (err) {
    logger.error(`Book creation failed: ${err.message}`);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message
    });
  }
}


export const getBooks = async (req, res) => {
  logger.info("Get books endpoint hit...")
  try {
    const { author, genre, page = 1, limit = 10 } = req.query;
    const filters = {};
    if (author) {
      filters.author = new RegExp(author, 'i');
    }
    if (genre) {
      filters.genre = new RegExp(genre, 'i');
    }
    // paginated books
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const books = await Book.find(filters)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    const totalBooks = await Book.countDocuments(filters);
    const totalPages = Math.ceil(totalBooks / parseInt(limit));
    logger.info(`Books retrieved: ${books.length}`);
    return res.status(200).json({
      message: 'Books retrieved successfully',
      books,
      pagination: {
        totalBooks,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (err) {
    logger.error(`Failed to get books: ${err.message}`);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message
    });
  }
}


export const getBookById = async (req, res) => {
  logger.info("Get book by ID endpoint hit...");

  try {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn("Invalid book ID format.");
      return res.status(400).json({ message: "Invalid book ID" });
    }

    // Fetch book
    const book = await Book.findById(id).populate('createdBy', 'username email');
    if (!book) {
      logger.warn("Book not found");
      return res.status(404).json({ message: "Book not found" });
    }

    // Fetch reviews
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find({ book: id })
      .populate('reviewer', 'username email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalReviews = await Review.countDocuments({ book: id });

    // Calculate average rating
    const ratings = await Review.aggregate([
      { $match: { book: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: '$book',
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const averageRating = ratings[0]?.avgRating || 0;

    // Final response
    return res.status(200).json({
      message: "Book fetched successfully",
      book,
      averageRating: averageRating.toFixed(1),
      reviews: {
        total: totalReviews,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / limit),
        data: reviews
      }
    });

  } catch (err) {
    logger.error(`Failed to get book by ID: ${err.message}`);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message
    });
  }
};

export const submitReview = async (req, res) => {
  logger.info("Submit review endpoint hit...");

  try {
    const { error } = validateReview(req.body);
    if (error) {
      logger.error(error.details[0].message);
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id: bookId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      book: bookId,
      reviewer: userId
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this book" });
    }

    // Create review
    const review = new Review({
      book: bookId,
      reviewer: userId,
      rating,
      comment
    });

    await review.save();
    logger.info(`Review submitted for book: ${book.title}`);

    return res.status(201).json({
      message: 'Review submitted successfully',
      review
    });

  } catch (err) {
    logger.error(`Failed to submit review: ${err.message}`);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message
    });
  }
};

export const updateReview = async (req, res) => {

  logger.info("Update review endpoint hit...");
  try {
    const { error } = validateUpdateReview(req.body);
    if (error) {
      logger.error(error.details[0].message);
      return res.status(400).json({
        message: error.details[0].message
      });
    }
    const userId = req.user._id;
    console.log("Params" , req.params)
    const { id:bookId, reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const review = await Review.findOne({
      _id: reviewId,
      book: bookId,
      reviewer: userId
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    logger.info(`Review updated for book: ${book.title}`);
    return res.status(200).json({
      message: 'Review updated successfully',
      review
    });

  } catch (err) {
    logger.error(`Failed to update review: ${err.message}`);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message
    });
  }

}

export const deleteReview = async (req, res) => {
  logger.info("Delete review endpoint hit...");
  try {
    const { id:bookId, reviewId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const review = await Review.findOne({
      _id: reviewId,
      book: bookId,
      reviewer: userId,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found " });
    }

    await Review.findByIdAndDelete(reviewId);

    logger.info(`Review deleted for book: ${book.title}`);
    return res.status(200).json({
      message: 'Review deleted successfully',
    });
  } catch (err) {
    logger.error(`Failed to delete review: ${err.message}`);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

export const searchBooks = async (req, res) => {
  logger.info("Search books endpoint hit...");

  try {
    const { query } = req.query;

    if (!query?.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const regex = new RegExp(query.trim(), 'i');
    const books = await Book.find({
      $or: [
        { title: { $regex: regex } },
        { author: { $regex: regex } },
      ]
    }).sort({ createdAt: -1 });

    if (books.length === 0) {
      return res.status(404).json({ message: 'No books found' });
    }

    logger.info(`Books found: ${books.length}`);
    return res.status(200).json({
      message: 'Books retrieved successfully',
      books
    });

  } catch (err) {
    logger.error(`Failed to search books: ${err.message}`);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message
    });
  }
};
