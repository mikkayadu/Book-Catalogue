const mongoose = require('mongoose')

const genreSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Genre name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

const Genre = mongoose.model('Genre', genreSchema)
module.exports = Genre
