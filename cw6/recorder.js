const axios = require('axios');
const hbs = require('handlebars');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'hbs');
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
  myID: { type: Number, unique: true },
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
  myID: { type: Number, unique: true },
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

app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Form to add a book by its ISBN
app.get('/books/add', async (req, res) => {
  res.sendFile(__dirname + '/public/form.html');
});

// Browse stored books
app.get('/authors/browse', async (req, res) => {
  const authors = await Author.find();
  res.render('authorsList', {
    authors: authors
  })
});

// Browse stored books of a given author
app.get('/authors/:authorId/browse', async (req, res) => {
  const { authorId } = req.params;

  // Find the author by ID
  const author = await Author.findOne({ myID: authorId });

  if (!author) {
    return res.status(404).json({ error: 'Author not found' });
  }
  const authorName = author.authorName;
  // Find all books by the author
  const books = await Book.find({ authorName: authorName });
  res.render('booksOfAuthor', {
    authorName: authorName,
    books: books,
  })
});

// Browse stored books
app.get('/books/:bookId/details', async (req, res) => {
  const { bookId } = req.params;
  const book = await Book.findOne({ myID: bookId }).exec();
  res.render('bookDetails', {
    myID: book.myID,
    title: book.title,
    authorName: book.authorName,
    language: book.language,
    publicationYear: book.publicationYear,
    isbnissn: book.isbnissn,
  })
});


// Browse stored books
app.get('/authors/browse', async (req, res) => {
  res.sendFile(__dirname + '/public/authors.html');
});

// Browse stored books
app.get('/authors/browse', async (req, res) => {
  res.sendFile(__dirname + '/public/authors.html');
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
  const author = await Author.findOne({ myID: authorId }).exec();
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
    const books = await Book.find({ authorName: authorName }).select('title');

    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/sync', async (req, res) => {
  try {
    const { isbn } = req.body;
    if (!isbn) {
      return res.status(400).json({ error: 'Numer ISBN jest wymagany' });
    }

    // Execute the API query with the given ISBN
    const response = await axios.get(`${apiUrl}/bibs.json?isbnIssn=${isbn}`);
    const bookData = response.data;

    if (!bookData) {
      return res.status(404).json({ error: 'Nie znaleziono rekordu bibliograficznego' });
    }

    // Check if they're not already there before adding
    const bookTitles = (await Book.find().select('title')).map(element => element.title);
    console.log(bookTitles);
    console.log(bookData.bibs[0].title);
    console.log(bookTitles.includes(bookData.bibs[0].title));

    if (!(bookTitles.includes(bookData.bibs[0].title))) {
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
      await book.save();
    }

    // Check if they're not already there before adding
    const authorNames = (await Author.find().select('authorName')).map(element => element.authorName);
    console.log(authorNames);
    console.log(bookData.bibs[0].author);
    console.log(authorNames.includes(bookData.bibs[0].author));

    if (!(authorNames.includes(bookData.bibs[0].author))) {
      // Save the record to the database
      const author = new Author({
        authorName: bookData.bibs[0].author,
        authorSurnameAndAlive: bookData.bibs[0].author
      });
      await author.save();
    }
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
