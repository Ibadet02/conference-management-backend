const mysqlDBPool = require("../utils/mysqlDBPool");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

module.exports.getAllReviewers = catchAsync(async (req, res, next) => {
  const [reviewers] = await mysqlDBPool
    .promise()
    .query(`SELECT * FROM reviewerUsers`);
  if (!reviewers) {
    return next(new AppError("Failed to fetch reviewers", 500));
  }
  return res.status(200).json({
    success: true,
    reviewers: reviewers.map((reviewer) => ({
      ...reviewer,
      reviewerId: reviewer.reviewerId || reviewer.id,
      id: reviewer.reviewerId || reviewer.id,
    })),
  });
});
module.exports.getReviewer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const [reviewer] = await mysqlDBPool
    .promise()
    .query(`SELECT * FROM reviewerUsers WHERE reviewerId = ?`, [id]);
  if (!reviewer) {
    return next(new AppError("Failed to fetch reviewer", 500));
  }
  // get submissions that the reviewer is assigned to
  // assignedReviewers :"1,2,3" ,
  //and the reviewerId is 1
  const [submissions] = await mysqlDBPool.promise().query(
    `SELECT 
      submittedPapers.*,
      abstracts.*,
      CASE
         WHEN reviews.reviewerId IS NULL THEN NULL
      ELSE
          JSON_OBJECT(
          'reviewerId', reviews.reviewerId,
          'paperId', reviews.paperId,
          'recommendation', reviews.recommendation,
          'academicQuality', reviews.academicQuality,
          'academicQualityComment', reviews.academicQualityComment,
          'contribution', reviews.contribution,
          'contributionComment', reviews.contributionComment,
          'language', reviews.language,
          'languageComment', reviews.languageComment,
          'literatureReviewAndBibliography', reviews.literatureReviewAndBibliography,
          'literatureReviewAndBibliographyComment', reviews.literatureReviewAndBibliographyComment,
          'commentsForOrganizingCommittee', reviews.commentsForOrganizingCommittee,
          'novelty', reviews.novelty,
          'noveltyComment', reviews.noveltyComment,
          'styleAndFormat', reviews.styleAndFormat,
          'styleAndFormatComment', reviews.styleAndFormatComment,
          'summary', reviews.summary,
          'topic', reviews.topic,
          'topicComment', reviews.topicComment,
          'verificationOfResults', reviews.verificationOfResults,
          'verificationOfResultsComment', reviews.verificationOfResultsComment
      ) END AS review
    FROM submittedPapers
    JOIN abstracts ON submittedPapers.abstractId = abstracts.id
    LEFT JOIN reviews ON submittedPapers.id = reviews.paperId and reviews.reviewerId = ?
    WHERE FIND_IN_SET(?, assignedReviewers)`,
    [id, id]
  );

  // const processedSubmissions =
  const toBeReviewedPapers = [];
  const reviewedPapers = [];
  submissions.forEach((submission) => {
    if (submission.review) {
      reviewedPapers.push(submission);
    } else {
      toBeReviewedPapers.push(submission);
    }
  });
  // submissions.map((submission) => ({
  //     ...submission,
  //     authors: submission.authors ? submission.authors.split(",") : [],
  //     assignedReviewers: submission.assignedReviewers
  //       ? submission.assignedReviewers.split(",")
  //       : [],
  //     projectId: submission.conferenceId,
  //     correspondingAuthor: submission.correspondingAuthorId,
  //     reviewerId: reviewer.reviewerId || reviewer.id,
  //     id: reviewer.reviewerId || reviewer.id,
  //   })) || [];
  // add field to check if the reviewer has already reviewed the paper or not

  return res.status(200).json({
    success: true,
    reviewer: {
      ...reviewer[0],
      id: reviewer.reviewerId || reviewer.id,
      assessedPapers: {
        toBeReviewedPapers:
          toBeReviewedPapers.map((submission) => ({
            ...submission,
            authors: submission.authors ? submission.authors.split(",") : [],
            assignedReviewers: submission.assignedReviewers
              ? submission.assignedReviewers.split(",")
              : [],
            projectId: submission.conferenceId,
            correspondingAuthor: submission.correspondingAuthorId,
            reviewerId: reviewer.reviewerId || reviewer.id,
          })) || [],
        reviewedPapers:
          reviewedPapers.map((submission) => ({
            ...submission,
            authors: submission.authors ? submission.authors.split(",") : [],
            assignedReviewers: submission.assignedReviewers
              ? submission.assignedReviewers.split(",")
              : [],
            projectId: submission.conferenceId,
            correspondingAuthor: submission.correspondingAuthorId,
            reviewerId: reviewer.reviewerId || reviewer.id,
            ...submission.review,
          })) ?? [],
      },
      // submissions.map((submission) => ({
      //   ...submission,
      //   authors: submission.authors ? submission.authors.split(",") : [],
      //   assignedReviewers: submission.assignedReviewers
      //     ? submission.assignedReviewers.split(",")
      //     : [],
      //   projectId: submission.conferenceId,
      //   correspondingAuthor: submission.correspondingAuthorId,
      //   reviewerId: reviewer.reviewerId || reviewer.id,
      //   id: reviewer.reviewerId || reviewer.id,
      // })) || [],
    },
  });
});
/**
 *
 */
