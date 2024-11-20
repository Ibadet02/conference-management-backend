const express = require("express");
const authenticationRouter = require("./authenticationRoutes");
const conferencesRouter = require("./conferencesRoutes");
const router = express.Router();
const requestValidation = require("../middlewares/requestMiddleware");
const authorsRouter = require("./authorsRoutes");
const abstractsRouter = require("./submissionsRoutes");
const reviewersRouter = require("./reviewersRoutes");
router.use("/auth", authenticationRouter);
router.use(
  "/conferences",
  requestValidation.checkJsonContentType,
  conferencesRouter
);
router.use(
  "/submissions",
  requestValidation.checkJsonContentType,
  abstractsRouter
);
router.use("/authors", requestValidation.checkJsonContentType, authorsRouter);
router.use(
  "/reviewers",
  requestValidation.checkJsonContentType,
  reviewersRouter
);

module.exports = router;
