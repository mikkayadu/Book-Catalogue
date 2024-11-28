const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const { initializeDatabase } = require('./config/database');

const app = express();

// Debug environment
// console.log('NODE_ENV:', process.env.NODE_ENV);
// console.log('Current working directory:', process.cwd());
// console.log('Environment variables:', {
//     DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
//     PORT: process.env.PORT
// });

// Initialize database without blocking server start
initializeDatabase()
    .then(() => {
        console.log('Database initialized successfully');
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
    });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const bookRoutes = require('./routes/books');
app.use('/books', bookRoutes);

// Home route
app.get('/', (req, res) => {
    res.redirect('/books');
});

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
    try {
        const { pool } = require('./config/database');
        await pool.query('SELECT NOW()');
        res.status(200).json({ 
            status: 'ok',
            database: 'connected',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error',
            database: 'disconnected',
            error: err.message,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Check if headers have already been sent
    if (res.headersSent) {
        return next(err);
    }

    // Check if it's an API request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(500).json({
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }

    // Render error page for regular requests
    res.status(500).render('error', {
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
const PORT = process.env.PORT || 3000;

// In development, we can listen to a port
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log('Press Ctrl+C to quit.');
    });
}

// For serverless environment
module.exports = app;
