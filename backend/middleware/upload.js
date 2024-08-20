const multer = require('multer');
const { MongoClient, GridFSBucket } = require('mongodb');
const { Readable } = require('stream');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let bucket;

async function initializeGridFS() {
  try {
    await client.connect();
    const db = client.db('your_database_name'); // Replace with your database name
    bucket = new GridFSBucket(db);
    console.log('MongoDB connected and GridFSBucket initialized');
  } catch (err) {
    console.error('Error connecting to MongoDB', err);
    throw err;
  }
}

// Initialize GridFS
initializeGridFS();

const storage = multer.memoryStorage(); // Temporarily store file in memory

const uploadProfile = multer({ storage }).single('image');
const uploadRatedImage = multer({ storage }).single('image');

const uploadFileToGridFS = (req, res, next) => {
  const { file } = req;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploadStream = bucket.openUploadStream(`file-${Date.now()}-${file.originalname}`);
  const readableStream = Readable.from(file.buffer);

  readableStream.pipe(uploadStream)
    .on('error', (err) => {
      console.error('Error uploading file:', err);
      res.status(500).json({ success: false, message: 'Error uploading file' });
    })
    .on('finish', () => {
      res.json({ success: true, message: 'File uploaded successfully' });
    });
};

module.exports = { uploadProfile, uploadRatedImage, uploadFileToGridFS };
