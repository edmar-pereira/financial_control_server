const express = require('express');
const multer = require('multer');
const auth = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const {
  getData,
  createData,
  getByIdData,
  updateData,
  deleteByIdData,
  insertMany,
  getUniqueDescriptions,
} = require('../controllers/data.controller');

const {
  getCategory,
  updateCategory,
  getUniqueCompanyName,
  getAllCategoryInfo,
  deleteCategoryInfo,
} = require('../controllers/category.controller');

const { uploadData } = require('../controllers/upload.controller');
const mongoose = require('mongoose');

const router = express.Router();

// Multer storage setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(async (req, _res, next) => {
  console.log('req.path', req.path);
  // console.log('req.body', JSON.stringify(req.body));
  // console.log('req.query', req.query);
  // console.log('req.method', req.method);

  next();
});

// Data
// Data
router.post('/data/getData', authMiddleware, getData);
router.post('/data/create', authMiddleware, createData);
router.get('/data/getById/:id', authMiddleware, getByIdData);
router.put('/data/update/:id', authMiddleware, updateData);
router.delete('/data/delete/:id', authMiddleware, deleteByIdData);

router.get('/data/getUniqueCompanyName', authMiddleware, getUniqueCompanyName);
router.get(
  '/data/getUniqueDescriptions',
  authMiddleware,
  getUniqueDescriptions,
);

// Category
router.get('/category/getCategory', authMiddleware, getCategory);
router.put('/category/updateCategory', authMiddleware, updateCategory);
router.get('/category/getAllCategoryInfo', authMiddleware, getAllCategoryInfo);
router.delete(
  '/category/deleteCategoryInfo/:id',
  authMiddleware,
  deleteCategoryInfo,
);
// upload file
router.post('/upload', upload.single('file'), uploadData);

// insert many
router.post('/data/insertmany', authMiddleware, insertMany);

router.get('/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();

    res.json({
      status: 'UP',
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
    });
  }
});

module.exports = router;
