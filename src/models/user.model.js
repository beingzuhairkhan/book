import mongoose from 'mongoose';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken'
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        validate: {
            validator: function (v) {
                return emailRegex.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        },
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
},{ timestamps: true })

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
         this.password = await argon2.hash(this.password); 
        next();
    } catch (err) {
        next(err);
    }
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
   return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    throw error;  
  }
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        id: this._id,
        username: this.username,
        email: this.email
    },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
    )

}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id,
            username: this.username,
            email: this.email
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );
};


const User = mongoose.model('User', userSchema);
export default User;