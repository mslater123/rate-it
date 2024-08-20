// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');
const flash = require('connect-flash');
const { uploadProfile, uploadRatedImage, uploadFileToGridFS } = require('./middleware/upload'); // Import correctly
const User = require('./models/User');
const RatedImage = require('./models/RatedImage');
const { LocalStrategy, GoogleStrategy, configurePassport } = require('./config/passport');


// Load environment variables from .env file
dotenv.config();
const router = express.Router();
const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4000', // Update with your frontend origin
  credentials: true, // Allow credentials (cookies)
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true },
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB', err);
});

// Configure Passport.js
configurePassport(passport, User);

// Routes
app.post('/upload/profile', uploadProfile, uploadFileToGridFS);
app.post('/upload/rated', uploadRatedImage, uploadFileToGridFS);

const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Configure Passport.js
configurePassport(passport, User);

// Signup route
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new User({ firstName, lastName, email, password: hashedPassword });
    await user.save();
    res.json({ success: true, message: 'Signup successful' });
  } catch (err) {
    console.error('Error during signup:', err);
    if (err.code === 11000) {
      res.status(400).json({ success: false, message: 'User already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Database error' });
    }
  }
});

// Login route
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'An error occurred during login' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'An error occurred during login' });
      }
      return res.json({ success: true, message: 'Login successful', user });
    });
  })(req, res, next);
});

// Get user details
app.get('/user', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user details
app.put('/user/update', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  const { firstName, lastName, email } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user details
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;

    await user.save();

    res.json({ success: true, message: 'User details updated successfully' });
  } catch (err) {
    console.error('Error updating user details:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload and update profile picture
app.post('/upload/profile', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Assuming req.user contains the authenticated user information
    const userId = req.user._id; // Adjust based on your authentication method
    const imageUrl = `/uploads/${req.file.filename}`;

    // Update the user profile picture in the database
    await User.findByIdAndUpdate(userId, { profilePicture: imageUrl });
    await User.save();

    res.json({ message: 'Profile picture updated successfully', imageUrl });

  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Error updating profile picture' });
  }
});

app.get('/profile-picture/:filename', async (req, res) => {
  const { filename } = req.params;

  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db);
    const downloadStream = bucket.openDownloadStreamByName(filename);

    downloadStream.on('error', () => {
      res.status(404).json({ success: false, message: 'File not found' });
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error('Error fetching file:', err);
    res.status(500).json({ success: false, message: 'Error fetching file' });
  }
});

// Upload and retrieve rated image
app.post('/rated-image', upload.single('image'), (req, res) => {
  // Handle the file upload
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Process the file and respond
  res.json({ message: 'File uploaded successfully', file: req.file });
});


// Fetch rated images route
router.get('/rated-images', async (req, res) => {
  try {
    const images = await RatedImage.find().select('imageUrl -_id'); // Adjust the select query based on your schema
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error fetching rated images:', error);
    res.status(500).json({ success: false, message: 'Error fetching rated images' });
  }
});


app.get('/rated-image/:filename', async (req, res) => {
  const { filename } = req.params;

  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db);
    const downloadStream = bucket.openDownloadStreamByName(filename);

    downloadStream.on('error', () => {
      res.status(404).json({ success: false, message: 'File not found' });
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error('Error fetching file:', err);
    res.status(500).json({ success: false, message: 'Error fetching file' });
  }
});

// Other routes...
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
