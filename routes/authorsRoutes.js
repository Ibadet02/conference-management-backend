const authorsController = require("../controllers/authorsController");
const express = require("express");
const router = express.Router();

router.get("/", authorsController.getAllAuthors);
router.put("/:id/updateStatus", authorsController.changeAuthorStatus);
module.exports = router;
