const abstractsController = require("../controllers/submissionsController");
const express = require("express");
const router = express.Router();
router.post(
  "/:submissionId/add-final-result",
  abstractsController.addFinalResultToSubmission
);
router.post("/", abstractsController.createSubmission);
router.post("/:id", abstractsController.addReviewToSubmission);
router.put(
  "/:submissionId/adminResult",
  abstractsController.approveAndRejectPaperAbstract
);

router.put("/:id", abstractsController.editSubmission);
router.put(
  "/:submissionId/add-reviewers",
  abstractsController.addReviewersToSubmission
);
router.get("/reviews", abstractsController.getAllReviews);
router.get("/final-reviews", abstractsController.getAllFinalReviews);
router.get("/:authorId/final-results", abstractsController.getMyFinalResults);
router.get("/:authorId", abstractsController.getAllSubmissionsForAuthor);
router.get(
  "/:submissionId/:reviewerId",
  abstractsController.getReviewForReviewerAndSubmission
);
router.get("/", abstractsController.getAllSubmissionsForAuthor);

module.exports = router;
