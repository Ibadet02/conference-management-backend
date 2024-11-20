const reviewersController = require("../controllers/reviewersController");
const express = require("express");
const router = express.Router();

router.get("/", reviewersController.getAllReviewers);
router.get("/:id", reviewersController.getReviewer);
module.exports = router;
