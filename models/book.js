const mongoose = require('mongoose')

const bookSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Book title is required'],
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Author name is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    genre_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
        required: [true, 'Genre is required']
    },
    copies_left: {
        type: Number,
        required: [true, 'Number of copies is required'],
        min: [0, 'Copies cannot be negative'],
        default: 1
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
})

// Update the updated_at timestamp before saving
bookSchema.pre('save', function(next) {
    this.updated_at = Date.now()
    next()
})

const Book = mongoose.model('Book', bookSchema)
module.exports = Book