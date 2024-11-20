const express = require("express");
const authenticationController = require("./../controllers/authenticationController");

const router = express.Router();
router.post("/login", authenticationController.login);
router.post("/register", authenticationController.register);
router.post("/refresh-token", authenticationController.refreshToken);
router.put("/reset-author-status", authenticationController.resetAuthorStatus);
router.get("/user/:id", authenticationController.getUserDetails);
module.exports = router;
