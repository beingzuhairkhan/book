import joi from 'joi'

export const validateRegistration = (data) => {
    const schema = joi.object({
        username: joi.string().min(3).max(30).required(),
        email: joi.string().email().required(),
        password: joi.string().min(8).max(100).required(),
    })
    return schema.validate(data)
}

export const validateLogin = (data) => {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(8).max(100).required(),
    })
    return schema.validate(data)
}

export const validateBook = (data) => {
    const schema = joi.object({
        title: joi.string().min(3).max(100).required(),
        author: joi.string().min(3).max(100).required(),
        genre: joi.string().min(3).max(50).required(),
        description: joi.string().max(500),
        publishedYear: joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
    })
    return schema.validate(data)
}

export const validateReview = (data) => {
    const schema = joi.object({
        rating: joi.number().integer().min(1).max(5).required(),
        comment: joi.string().max(500),
    })
    return schema.validate(data)
}

export const validateUpdateReview = (data) => {
    const schema = joi.object({
        rating: joi.number().integer().min(1).max(5).required(),
        comment: joi.string().max(500),
    })
    return schema.validate(data)
}