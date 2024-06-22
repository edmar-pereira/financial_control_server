const express = require("express");
const {
  getData,
  getMonths,
  createData,
  getByIdData,
  updateData,
  deleteByIdData,
} = require("../controllers/data.controller");
 
const router = express.Router();

// router.use(async (req, _res, next) => {
//   console.log("req.path", req.path);
//   console.log("req.body", JSON.stringify(req.body));
//   console.log("req.query", req.query);
//   console.log("req.method", req.method);

//   next();
// });
 
router.route("/data/getData/").get(getData)
router.route("/data/getMonths/").get(getMonths)
router.route("/data/create").post(createData);
router.route("/data/get/:id").get(getByIdData)
router.route("/data/update/:id").put(updateData)
router.route("/data/delete/:id").delete(deleteByIdData);
 
module.exports = router;