const { pool, initializeDatabase } = require('./config/database');

const genres = [
    { name: 'Horror', description: 'Works intended to scare or startle' },
    { name: 'Adventure', description: 'Stories involving exciting journeys or quests' },
    { name: 'Self-Help', description: 'Books designed to improve personal growth' },
    { name: 'Cooking', description: 'Books with recipes and culinary techniques' },
    { name: 'Travel', description: 'Books about exploring and discovering new places' },
    { name: 'Philosophy', description: 'Explorations of thought and existence' },
    { name: 'Psychology', description: 'Books about the human mind and behavior' },
    { name: 'Children', description: 'Books aimed at young readers' },
    { name: 'Drama', description: 'Serious narratives dealing with human emotion' },
    { name: 'Classic', description: 'Timeless works that have shaped literature' }
];

const books = [
    {
        title: 'It',
        author: 'Stephen King',
        price: 14.99,
        genre: 'Horror',
        copies_left: 5
    },
    {
        title: 'Into the Wild',
        author: 'Jon Krakauer',
        price: 11.99,
        genre: 'Adventure',
        copies_left: 8
    },
    {
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        price: 18.99,
        genre: 'Self-Help',
        copies_left: 15
    },
    {
        title: 'Salt, Fat, Acid, Heat',
        author: 'Samin Nosrat',
        price: 29.99,
        genre: 'Cooking',
        copies_left: 10
    },
    {
        title: 'Lonely Planet: Ultimate Travel',
        author: 'Lonely Planet',
        price: 22.99,
        genre: 'Travel',
        copies_left: 12
    },
    {
        title: 'Meditations',
        author: 'Marcus Aurelius',
        price: 9.99,
        genre: 'Philosophy',
        copies_left: 20
    },
    {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        price: 16.99,
        genre: 'Psychology',
        copies_left: 7
    },
    {
        title: 'The Gruffalo',
        author: 'Julia Donaldson',
        price: 6.99,
        genre: 'Children',
        copies_left: 30
    },
    {
        title: 'Hamlet',
        author: 'William Shakespeare',
        price: 8.99,
        genre: 'Drama',
        copies_left: 25
    },
    {
        title: 'Moby Dick',
        author: 'Herman Melville',
        price: 12.99,
        genre: 'Classic',
        copies_left: 9
    }
];

async function seedDatabase() {
    try {
        // Initialize database (create tables)
        await initializeDatabase();

        // Clear existing data
        await pool.query('DELETE FROM books');
        await pool.query('DELETE FROM genres');
        console.log('Existing data cleared');

        // Insert genres
        for (const genre of genres) {
            await pool.query(
                'INSERT INTO genres (name, description) VALUES ($1, $2)',
                [genre.name, genre.description]
            );
        }
        console.log('Genres inserted');

        // Get genre IDs
        const { rows: genreRows } = await pool.query('SELECT id, name FROM genres');
        const genreMap = {};
        genreRows.forEach(genre => {
            genreMap[genre.name] = genre.id;
        });

        // Insert books
        for (const book of books) {
            const genreId = genreMap[book.genre];
            await pool.query(
                'INSERT INTO books (title, author, price, genre_id, copies_left) VALUES ($1, $2, $3, $4, $5)',
                [book.title, book.author, book.price, genreId, book.copies_left]
            );
        }
        console.log('Books inserted');

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
}

// Run the seeding
seedDatabase();
