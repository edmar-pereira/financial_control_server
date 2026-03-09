const express = require('express');
const multer = require('multer');
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
router.route('/data/getData/').post(getData); // convert get to post to include body

router.route('/data/create').post(createData);
router.route('/data/getById/:id').get(getByIdData);
router.route('/data/update/:id').put(updateData);
router.route('/data/delete/:id').delete(deleteByIdData);
router.get('/data/getUniqueCompanyName', getUniqueCompanyName);
router.get('/data/getUniqueDescriptions', getUniqueDescriptions);

// Category
router.route('/data/getCategory/').get(getCategory);
router.route('/data/updateCategory/').put(updateCategory);

//upload file
router.post('/upload', upload.single('file'), uploadData);

router.route('/data/insertmany/').post(insertMany);

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
