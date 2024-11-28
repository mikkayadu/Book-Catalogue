const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all books
router.get('/', async (req, res) => {
    try {
        let query = `
            SELECT b.*, g.name as genre_name 
            FROM books b 
            LEFT JOIN genres g ON b.genre_id = g.id
        `;
        const params = [];

        if (req.query.genre) {
            query += ' WHERE g.id = $1';
            params.push(req.query.genre);
        }

        const { rows: books } = await db.query(query, params);
        const { rows: genres } = await db.query('SELECT * FROM genres ORDER BY name');

        console.log('Found books:', books.length);
        console.log('Found genres:', genres.length);
        
        res.render('books', { books, genres });
    } catch (err) {
        console.error('Error in /books route:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET new book form
router.get('/new', async (req, res) => {
    try {
        const { rows: genres } = await db.query('SELECT * FROM genres ORDER BY name');
        console.log('Loading add book form with genres:', genres.map(g => g.name));
        res.render('add_book', { genres });
    } catch (err) {
        console.error('Error loading add book form:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST new book
router.post('/', async (req, res) => {
    try {
        const { title, author, price, genre_id, copies_left } = req.body;
        console.log('Received book data:', req.body);

        const { rows } = await db.query(
            'INSERT INTO books (title, author, price, genre_id, copies_left) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, author, price, genre_id, copies_left || 1]
        );

        res.redirect('/books');
    } catch (err) {
        console.error('Error creating book:', err);
        const { rows: genres } = await db.query('SELECT * FROM genres ORDER BY name');
        res.render('add_book', { 
            genres,
            error: err.message,
            book: req.body
        });
    }
});

// GET book details
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT b.*, g.name as genre_name 
             FROM books b 
             LEFT JOIN genres g ON b.genre_id = g.id 
             WHERE b.id = $1`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).render('error', { message: 'Book not found' });
        }

        const book = rows[0];
        console.log('Found book:', book.title);
        res.render('book_details', { book });
    } catch (err) {
        console.error('Error in /books/:id route:', err);
        res.status(500).render('error', { message: err.message });
    }
});

// GET edit book form
router.get('/:id/edit', async (req, res) => {
    try {
        const { rows: [book] } = await db.query(
            `SELECT b.*, g.name as genre_name 
             FROM books b 
             LEFT JOIN genres g ON b.genre_id = g.id 
             WHERE b.id = $1`,
            [req.params.id]
        );

        if (!book) {
            return res.status(404).render('error', { message: 'Book not found' });
        }

        const { rows: genres } = await db.query('SELECT * FROM genres ORDER BY name');
        res.render('edit_book', { book, genres });
    } catch (err) {
        console.error('Error loading edit book form:', err);
        res.status(500).render('error', { message: err.message });
    }
});

// PUT update book
router.put('/:id', async (req, res) => {
    try {
        const { title, author, price, genre_id, copies_left } = req.body;
        const { rows } = await db.query(
            `UPDATE books 
             SET title = $1, author = $2, price = $3, genre_id = $4, copies_left = $5 
             WHERE id = $6 
             RETURNING *`,
            [title, author, price, genre_id, copies_left, req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).render('error', { message: 'Book not found' });
        }

        res.redirect(`/books/${req.params.id}`);
    } catch (err) {
        console.error('Error updating book:', err);
        const { rows: genres } = await db.query('SELECT * FROM genres ORDER BY name');
        const { rows: [book] } = await db.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
        res.render('edit_book', {
            book: { ...book, ...req.body },
            genres,
            error: err.message
        });
    }
});

// DELETE book
router.delete('/:id', async (req, res) => {
    try {
        const { rows } = await db.query('DELETE FROM books WHERE id = $1 RETURNING *', [req.params.id]);
        
        if (rows.length === 0) {
            const error = { message: 'Book not found' };
            return req.accepts('json') 
                ? res.status(404).json(error)
                : res.status(404).render('error', error);
        }

        // Return different responses based on what the client accepts
        if (req.accepts('json')) {
            res.json({ 
                success: true, 
                message: 'Book deleted successfully',
                id: req.params.id 
            });
        } else {
            res.redirect('/books');
        }
    } catch (err) {
        console.error('Error deleting book:', err);
        const error = { 
            message: 'Error deleting book',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        };
        
        if (req.accepts('json')) {
            res.status(500).json(error);
        } else {
            res.status(500).render('error', error);
        }
    }
});

module.exports = router;
