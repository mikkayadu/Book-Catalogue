const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Book = require('../models/book');
const Genre = require('../models/genre');
const connectDB = require('../config/database');

describe('Book API Tests', () => {
    let mongoServer;
    let testGenre;
    
    beforeAll(async () => {
        // Create an in-memory MongoDB server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Connect to the in-memory database
        await connectDB(mongoUri);
        
        // Create a test genre
        testGenre = await Genre.create({
            name: 'Test Genre',
            description: 'Genre for testing'
        });
    }, 10000); // Increase timeout to 10 seconds

    afterAll(async () => {
        // Clean up and close connections
        await mongoose.disconnect();
        await mongoServer.stop();
    }, 10000);

    beforeEach(async () => {
        // Clear books before each test
        await Book.deleteMany({});
    });

    describe('POST /books', () => {
        it('should create a new book', async () => {
            const bookData = {
                title: 'Test Book',
                author: 'Test Author',
                price: 29.99,
                genre_id: testGenre._id,
                copies_left: 5
            };

            const response = await request(app)
                .post('/books')
                .send(bookData);

            expect(response.status).toBe(201);
            expect(response.body.title).toBe(bookData.title);
            expect(response.body.author).toBe(bookData.author);
            expect(response.body.price).toBe(bookData.price);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/books')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /books', () => {
        it('should return all books', async () => {
            await Book.create([
                {
                    title: 'Book 1',
                    author: 'Author 1',
                    price: 19.99,
                    genre_id: testGenre._id,
                    copies_left: 3
                },
                {
                    title: 'Book 2',
                    author: 'Author 2',
                    price: 29.99,
                    genre_id: testGenre._id,
                    copies_left: 5
                }
            ]);

            const response = await request(app)
                .get('/books');

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2);
        });

        it('should filter books by genre', async () => {
            await Book.create({
                title: 'Genre Test Book',
                author: 'Test Author',
                price: 19.99,
                genre_id: testGenre._id,
                copies_left: 3
            });

            const response = await request(app)
                .get(`/books?genre=${testGenre._id}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].genre_id.toString()).toBe(testGenre._id.toString());
        });
    });

    describe('GET /books/:id', () => {
        it('should return a specific book', async () => {
            const book = await Book.create({
                title: 'Test Book',
                author: 'Test Author',
                price: 19.99,
                genre_id: testGenre._id,
                copies_left: 3
            });

            const response = await request(app)
                .get(`/books/${book._id}`);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe(book.title);
        });

        it('should return 404 for non-existent book', async () => {
            const response = await request(app)
                .get(`/books/${new mongoose.Types.ObjectId()}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /books/:id', () => {
        it('should update a book', async () => {
            const book = await Book.create({
                title: 'Original Title',
                author: 'Original Author',
                price: 19.99,
                genre_id: testGenre._id,
                copies_left: 3
            });

            const response = await request(app)
                .put(`/books/${book._id}`)
                .send({
                    title: 'Updated Title',
                    price: 29.99
                });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Updated Title');
            expect(response.body.price).toBe(29.99);
        });
    });

    describe('DELETE /books/:id', () => {
        it('should delete a book', async () => {
            const book = await Book.create({
                title: 'Book to Delete',
                author: 'Test Author',
                price: 19.99,
                genre_id: testGenre._id,
                copies_left: 3
            });

            const response = await request(app)
                .delete(`/books/${book._id}`);

            expect(response.status).toBe(204);

            const deletedBook = await Book.findById(book._id);
            expect(deletedBook).toBeNull();
        });
    });
});
