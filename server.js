// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// const app = express();
// const PORT = 3001;

// // Add these right after your Express setup
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//   next();
// });

// // Modify your GET endpoint to force fresh data
// app.get('/api/blogs', (req, res) => {
//   try {
//     // Bypass cache
//     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
//     const data = fs.readFileSync(BLOGS_PATH, 'utf8');
//     const blogs = JSON.parse(data);
    
//     // Validate data format
//     if (!Array.isArray(blogs)) {
//       throw new Error('Invalid data format');
//     }
    
//     res.json(blogs);
//   } catch (err) {
//     console.error('Error reading blogs:', err);
//     res.status(500).json({ error: 'Failed to load blogs' });
//   }
// });

// // Configure multer for file uploads
// const upload = multer({ dest: 'uploads/' });

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static('public'));
// app.use('/uploads', express.static('uploads'));

// // Path to blogs data (shared with main website)
// const BLOGS_PATH = path.join(__dirname, 'data', 'blogs.json');

// // Ensure data directory exists
// if (!fs.existsSync(path.join(__dirname, 'data'))) {
//   fs.mkdirSync(path.join(__dirname, 'data'));
// }

// // Create blogs.json if it doesn't exist
// if (!fs.existsSync(BLOGS_PATH)) {
//   fs.writeFileSync(BLOGS_PATH, '[]');
// }

// // Helper functions
// const readBlogs = () => JSON.parse(fs.readFileSync(BLOGS_PATH));
// const writeBlogs = (blogs) => fs.writeFileSync(BLOGS_PATH, JSON.stringify(blogs, null, 2));

// // Routes
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// app.get('/api/blogs', (req, res) => {
//   res.json(readBlogs());
// });

// app.post('/api/blogs', upload.single('image'), (req, res) => {
//   const { title, category, subtitle, content, author, position, date, slug } = req.body;
//   const image = req.file ? req.file.filename : 'default.jpg';

//   const newBlog = {
//     title,
//     category,
//     subtitle,
//     content,
//     author,
//     position,
//     date: date || new Date().toISOString().split('T')[0],
//     image,
//     slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
//     featured: req.body.featured === 'on'
//   };

//   const blogs = readBlogs();
//   blogs.unshift(newBlog);
//   writeBlogs(blogs);

//   res.json({ success: true, blog: newBlog });
// });

// app.listen(PORT, () => {
//   console.log(`Publisher running on http://localhost:${PORT}`);
//   console.log(`API endpoint: http://localhost:${PORT}/api/blogs`);
// }); Aug 12


const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = 3001;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Configure multer to preserve original file extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // Get original extension (e.g., .jpg, .png)
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ 
  dest: 'uploads/',
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  }
});

// Serve static files with correct MIME types
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Path to blogs data
const BLOGS_PATH = path.join(__dirname, 'data', 'blogs.json');

// Ensure data directory and blogs.json exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(BLOGS_PATH)) {
  fs.writeFileSync(BLOGS_PATH, '[]');
}

// Helper functions
const readBlogs = () => JSON.parse(fs.readFileSync(BLOGS_PATH));
const writeBlogs = (blogs) => fs.writeFileSync(BLOGS_PATH, JSON.stringify(blogs, null, 2));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/blogs', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const data = fs.readFileSync(BLOGS_PATH, 'utf8');
    const blogs = JSON.parse(data);
    if (!Array.isArray(blogs)) {
      throw new Error('Invalid data format');
    }
    res.json(blogs);
  } catch (err) {
    console.error('Error reading blogs:', err);
    res.status(500).json({ error: 'Failed to load blogs' });
  }
});

app.post('/api/blogs', upload.single('image'), (req, res) => {
  try {
    const { title, category, subtitle, content, author, position, date, slug } = req.body;
    const image = req.file ? req.file.filename : 'default-author.jpg';

    const newBlog = {
      title,
      category,
      subtitle,
      content,
      author,
      position,
      date: date || new Date().toISOString().split(' env.T')[0],
      image,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      featured: req.body.featured === 'true' // Handle checkbox as boolean
    };

    const blogs = readBlogs();
    blogs.unshift(newBlog);
    writeBlogs(blogs);

    res.json({ success: true, blog: newBlog });
  } catch (err) {
    console.error('Error saving blog:', err);
    res.status(500).json({ error: 'Failed to save blog' });
  }
});

app.listen(PORT, () => {
  console.log(`Publisher running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/blogs`);
});