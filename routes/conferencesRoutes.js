const conferencesController = require("../controllers/conferencesController");
const express = require("express");
const router = express.Router();

router.post("/", conferencesController.createConference);
router.get("/", conferencesController.getAllConferences);
router.put("/", conferencesController.editConference);
router.delete("/:id", conferencesController.deleteConference);
module.exports = router;
