require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 1
};

// For debugging connection issues
console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('Pool Config:', { ...poolConfig, connectionString: 'HIDDEN' });

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        // Test the connection
        await client.query('SELECT NOW()');
        console.log('Database connected successfully');

        // Create genres table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS genres (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create books table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS books (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                genre_id INTEGER REFERENCES genres(id),
                copies_left INTEGER DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database tables initialized successfully');
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    query: (text, params) => {
        console.log('Executing query:', text);
        return pool.query(text, params);
    },
    pool,
    initializeDatabase
};
