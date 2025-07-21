const express = require('express');
const multer = require('multer');
const {
  getData,
  getMonths,
  createData,
  getByIdData,
  updateData,
  deleteByIdData,
  insertMany,
} = require('../controllers/data.controller');

const {
  getCategory,
  updateCategory,
  getUniqueCategory
} = require('../controllers/category.controller');

const { uploadFile } = require('../controllers/upload.controller');

const router = express.Router();


// Multer storage setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// router.use(async (req, _res, next) => {
//   console.log("req.path", req.path);
//   console.log("req.body", JSON.stringify(req.body));
//   console.log("req.query", req.query);
//   console.log("req.method", req.method);

//   next();
// });

// Data
router.route('/data/getData/').post(getData); // convert get to post to include body
router.route('/data/getMonths/').get(getMonths);
router.route('/data/create').post(createData);
router.route('/data/getById/:id').get(getByIdData);
router.route('/data/update/:id').put(updateData);
router.route('/data/delete/:id').delete(deleteByIdData);

// Category
router.route('/data/getCategory/').get(getCategory);
router.route('/data/updateCategory/').put(updateCategory);
router.route('/data/getUniqueCategory/').get(getUniqueCategory);

//upload file
router.post('/upload', upload.single('file'), uploadFile);

router.route('/data/insertmany/').post(insertMany);

module.exports = router;
