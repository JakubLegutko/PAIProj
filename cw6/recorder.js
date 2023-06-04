const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));
const PORT = 20150;
const apiUrl = "https://data.bn.org.pl/api/networks";
const clear = false;
// Connection to MongoDB
mongoose.connect('mongodb://localhost:20151', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
// Clear the database collections at server start
if (clear) {
  mongoose.connection.once('open', async () => {
    try {
      // Clear the Book collection
      await Book.deleteMany({});
      console.log('Book collection cleared.');

      // Clear the Author collection
      await Author.deleteMany({});
      console.log('Author collection cleared.');
    } catch (error) {
      console.error('Error clearing database collections:', error);
    }
  });
}
// Define bookSchema with auto-incrementing myID
const bookSchema = new mongoose.Schema({
  myID : {type : Number, unique : true},
  title: String,
  authorName: String,
  authorSurnameAndAlive: String,
  bookID: String,
  language: String,
  subject: String,
  isbnissn: String,
  publicationYear: String,
  authorID: {
    type: Number,
    ref: 'Author',
  },
});

// Define authorSchema with auto-incrementing myID
const authorSchema = new mongoose.Schema({
  myID : {type: Number, unique : true},
  authorName: String,
  authorSurnameAndAlive: String,
});

bookSchema.pre('save', async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const lastBook = await this.constructor.findOne({}, {}, { sort: { myID: -1 } });
    const lastID = lastBook ? lastBook.myID : 0;
    this.myID = lastID + 1;
    next();
  } catch (error) {
    next(error);
  }
});

authorSchema.pre('save', async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const lastAuthor = await this.constructor.findOne({}, {}, { sort: { myID: -1 } });
    const lastID = lastAuthor ? lastAuthor.myID : 0;
    this.myID = lastID + 1;
    next();
  } catch (error) {
    next(error);
  }
});


// Create book and author models
const Book = mongoose.model('Book', bookSchema);
const Author = mongoose.model('Author', authorSchema);

// Fetch existing books from the database
app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/form.html');
});

// Fetch existing books from the database
app.get('/books', async (req, res) => {
  const existingBooks = await Book.find();
  res.json(existingBooks);
});

// Fetch a specific book by its ID
app.get('/books/:bookId', async (req, res) => {
  const { bookId } = req.params;
  const book = await Book.findOne({ myID: bookId }).exec();
  res.json(book);
});

// Fetch a specific author by their ID
app.get('/authors/:authorId', async (req, res) => {
  const { authorId } = req.params;
  const author = await Author.findOne({myID : authorId }).exec();
  res.json(author);
});

// Fetch existing authors from the database
app.get('/authors', async (req, res) => {
  const existingAuthors = await Author.find();
  res.json(existingAuthors);
});
app.get('/authors/:authorId/books', async (req, res) => {
  try {
    const { authorId } = req.params;

    // Find the author by ID
    const author = await Author.findOne({ myID: authorId });

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }
    const authorName = author.authorName;
    // Find all books by the author
    const books = await Book.find({authorName: authorName }).select('title');

    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/sync', async (req, res) => {
  try {
    const { isbn } = req.query;
    console.log(isbn);
    if (!isbn) {
      return res.status(400).json({ error: 'Numer ISBN jest wymagany' });
    }

    // Execute the API query with the given ISBN
    const response = await axios.get(`${apiUrl}/bibs.json?isbnIssn=${isbn}`);
    const bookData = response.data;

    if (!bookData) {
      return res.status(404).json({ error: 'Nie znaleziono rekordu bibliograficznego' });
    }

    // Save the record to the database
    const book = new Book({
      title: bookData.bibs[0].title,
      authorName: bookData.bibs[0].author,
      authorSurnameAndAlive: bookData.bibs[0].author,
      bookID: bookData.bibs[0].id,
      language: bookData.bibs[0].language,
      subject: bookData.bibs[0].subject,
      isbnissn: bookData.bibs[0].isbnIssn,
      publicationYear: bookData.bibs[0].publicationYear
    });
    const author = new Author({
      authorName: bookData.bibs[0].author,
      authorSurnameAndAlive: bookData.bibs[0].author
    });
    await book.save();
    await author.save();
    res.json({ message: 'Książka została dodana do bazy danych' });
  } catch (error) {
    console.error('Błąd podczas dodawania książki:', error);
    res.status(500).json({});
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
