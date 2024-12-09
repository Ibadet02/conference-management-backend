const mysqlDBPool = require("../utils/mysqlDBPool");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { re } = require("prettier");

module.exports.createSubmission = catchAsync(async (req, res, next) => {
  const {
    abstract,
    authors,
    abstractApproved,
    academicInterest,
    adminResponseMade,
    abstractUpdated,
    correspondingAuthor,
    projectId,
    assignedReviewers,
    paperUpdateRequest,
    finalResult,
    fileId,
  } = req.body;
  const processedAuthors = authors ? authors.join(",") : "";
  const processedAssignedReviewers = assignedReviewers
    ? assignedReviewers.join(",")
    : "";
  const [abstractResult] = await mysqlDBPool.promise().query(
    /** abstracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    abstract TEXT,
    abstractApproved BOOLEAN,       
    abstractUpdated BOOLEAN
); */ `
    INSERT INTO abstracts (abstract, abstractApproved, abstractUpdated) VALUES (?, ?, ?)
    `,
    [abstract, abstractApproved, abstractUpdated]
  );
  if (abstractResult.affectedRows === 0) {
    return next(new AppError("Failed to create abstract", 500));
  }
  const abstractId = abstractResult.insertId;
  const [submittedPaperResult] = await mysqlDBPool.promise().query(
    /** submittedPapers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fileId VARCHAR(255),
        abstractId INT,
        conferenceId VARCHAR(255),
        paperUpdateRequest BOOLEAN,
        assignedReviewers TEXT,
        finalResult VARCHAR(50),
        correspondingAuthorId VARCHAR(255),
        adminResponseMade BOOLEAN,
        authors TEXT,
        academicInterest TEXT,
        FOREIGN KEY (conferenceId) REFERENCES conferences(id),
        FOREIGN KEY (abstractId) REFERENCES abstracts(id),
        FOREIGN KEY (correspondingAuthorId) REFERENCES authorUsers(authorId)
    ) */ `
    INSERT INTO submittedPapers (fileId, abstractId, conferenceId, paperUpdateRequest, assignedReviewers, finalResult, correspondingAuthorId, adminResponseMade, authors, academicInterest, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      fileId,
      abstractId,
      projectId,
      paperUpdateRequest ?? false,
      processedAssignedReviewers,
      finalResult,
      correspondingAuthor,
      adminResponseMade ?? false,
      processedAuthors,
      academicInterest,
      "",
    ]
  );
  if (submittedPaperResult.affectedRows === 0) {
    return next(new AppError("Failed to create submission", 500));
  }
  return res.status(201).json({
    success: true,
    message: "Submission created successfully",
    submission: {
      abstract,
      authors,
      abstractApproved,
      academicInterest,
      adminResponseMade,
      abstractUpdated,
      correspondingAuthor,
      projectId,
      assignedReviewers,
      paperUpdateRequest,
      finalResult,
      fileId,
    },
  });
});
module.exports.editSubmission = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    abstract,
    authors,
    abstractApproved,
    academicInterest,
    adminResponseMade,
    abstractUpdated,
    correspondingAuthor,
    projectId,
    assignedReviewers,
    paperUpdateRequest,
    finalResult,
    fileId,
  } = req.body;
  const processedAuthors = authors ? authors.join(",") : "";
  const processedAssignedReviewers = assignedReviewers
    ? assignedReviewers.join(",")
    : "";
  const [abstractResult] = await mysqlDBPool
    .promise()
    .query(
      `UPDATE abstracts SET abstract = ?, abstractApproved = ?, abstractUpdated = ? WHERE id = ?`,
      [abstract, abstractApproved, abstractUpdated, id]
    );
  if (abstractResult.affectedRows === 0) {
    return next(new AppError("Failed to update abstract", 500));
  }
  const [submittedPaperResult] = await mysqlDBPool
    .promise()
    .query(
      `UPDATE submittedPapers SET fileId = ?, conferenceId = ?, paperUpdateRequest = ?, assignedReviewers = ?, finalResult = ?, correspondingAuthorId = ?, adminResponseMade = ?, authors = ?, academicInterest = ? WHERE abstractId = ?`,
      [
        fileId,
        projectId,
        paperUpdateRequest ?? false,
        processedAssignedReviewers,
        finalResult,
        correspondingAuthor,
        adminResponseMade ?? false,
        processedAuthors,
        academicInterest,
        id,
      ]
    );
  if (submittedPaperResult.affectedRows === 0) {
    return next(new AppError("Failed to update submission", 500));
  }
  return res.status(200).json({
    success: true,
    message: "Submission updated successfully",
    submission: {
      abstract,
      authors,
      abstractApproved,
      academicInterest,
      adminResponseMade,
      abstractUpdated,
      correspondingAuthor,
      projectId,
      assignedReviewers,
      paperUpdateRequest,
      finalResult,
      fileId,
    },
  });
});

module.exports.getAllSubmissionsForAuthor = catchAsync(
  async (req, res, next) => {
    const { authorId } = req.params;
    let submissions;
    if (authorId) {
      const [submissionsRes] = await mysqlDBPool.promise().query(
        `SELECT * FROM submittedPapers
         JOIN abstracts ON submittedPapers.abstractId = abstracts.id
          WHERE correspondingAuthorId = ?`,
        [authorId]
      );
      submissions = submissionsRes;
    } else {
      const [submissionsRes] = await mysqlDBPool.promise().query(
        `SELECT * FROM submittedPapers
         JOIN abstracts ON submittedPapers.abstractId = abstracts.id`
      );
      submissions = submissionsRes;
    }

    return res.status(200).json({
      success: true,
      submissions: submissions.map((submission) => {
        return {
          ...submission,
          authors: submission.authors ? submission.authors.split(",") : [],
          assignedReviewers: submission.assignedReviewers
            ? submission.assignedReviewers.split(",")
            : [],
          projectId: submission.conferenceId,
          correspondingAuthor: submission.correspondingAuthorId,
        };
      }),
    });
  }
);
module.exports.approveAndRejectPaperAbstract = catchAsync(
  async (req, res, next) => {
    /**  abstractApproved: true,
          adminResponseMade: true,
          abstractUpdated: false,
          note: note, */
    const { submissionId } = req.params;
    const { note, abstractApproved, adminResponseMade, abstractUpdated } =
      req.body;

    const [abstractResult] = await mysqlDBPool.promise().query(
      `
    UPDATE abstracts SET abstractApproved = ?, abstractUpdated = ? WHERE id = ?`,
      [abstractApproved, abstractUpdated, submissionId]
    );
    if (abstractResult.affectedRows === 0) {
      return next(new AppError("Failed to update abstract", 500));
    }
    const [paperResult] = await mysqlDBPool
      .promise()
      .query(
        `UPDATE submittedPapers SET adminResponseMade = ?, note = ? WHERE abstractId = ?`,
        [adminResponseMade, note, submissionId]
      );
    if (paperResult.affectedRows === 0) {
      return next(new AppError("Failed to update submission", 500));
    }
    return res.status(200).json({
      success: true,
      message: "Abstract updated successfully",
    });
  }
);

module.exports.addReviewersToSubmission = catchAsync(async (req, res, next) => {
  const { submissionId } = req.params;
  const { reviewers } = req.body;
  const processedReviewers = reviewers.join(",");
  const [result] = await mysqlDBPool
    .promise()
    .query(`UPDATE submittedPapers SET assignedReviewers = ? WHERE id = ?`, [
      processedReviewers,
      submissionId,
    ]);
  if (result.affectedRows === 0) {
    return next(new AppError("Failed to assign reviewers", 500));
  }
  return res.status(200).json({
    success: true,
    message: "Reviewers assigned successfully",
  });
});

module.exports.addReviewToSubmission = catchAsync(async (req, res, next) => {
  /**
    *  
    * reviewerId VARCHAR(255),
        paperId INT,
        recommendation VARCHAR(255),
        academicQuality INT,
        academicQualityComment VARCHAR(255),
        contribution INT,
        contributionComment VARCHAR(255),
        language INT,
        languageComment VARCHAR(255),
        literatureReviewAndBibliography INT,
        literatureReviewAndBibliographyComment VARCHAR(255),
        commentsForOrganizingCommittee TEXT,
        novelty INT,
        noveltyComment VARCHAR(255),
        styleAndFormat INT,
        styleAndFormatComment VARCHAR(255),
        summary TEXT,
        topic INT,
        topicComment VARCHAR(255),
        verificationOfResults INT,
        verificationOfResultsComment VARCHAR(255),
        PRIMARY KEY (reviewerId, paperId),
        FOREIGN KEY (reviewerId) REFERENCES reviewerUsers(reviewerId),
        FOREIGN KEY (paperId) REFERENCES submittedPapers(id)
    */
  const {
    reviewerId,
    paperId,
    recommendation,
    academicQuality,
    academicQualityComment,
    contribution,
    contributionComment,
    language,
    languageComment,
    literatureReviewAndBibliography,
    literatureReviewAndBibliographyComment,
    commentsForOrganizingCommittee,
    novelty,
    noveltyComment,
    styleAndFormat,
    styleAndFormatComment,
    summary,
    topic,
    topicComment,
    verificationOfResults,
    verificationOfResultsComment,
  } = req.body;
  const [result] = await mysqlDBPool.promise().query(
    `INSERT INTO reviews (
        reviewerId, 
        paperId, 
        recommendation, 
        academicQuality, 
        academicQualityComment, 
        contribution, 
        contributionComment, 
        language, 
        languageComment, 
        literatureReviewAndBibliography, 
        literatureReviewAndBibliographyComment, 
        commentsForOrganizingCommittee, 
        novelty, 
        noveltyComment, 
        styleAndFormat, 
        styleAndFormatComment, 
        summary, 
        topic, 
        topicComment, 
        verificationOfResults, 
        verificationOfResultsComment
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reviewerId,
      paperId,
      recommendation,
      academicQuality,
      academicQualityComment,
      contribution,
      contributionComment,
      language,
      languageComment,
      literatureReviewAndBibliography,
      literatureReviewAndBibliographyComment,
      commentsForOrganizingCommittee,
      novelty,
      noveltyComment,
      styleAndFormat,
      styleAndFormatComment,
      summary,
      topic,
      topicComment,
      verificationOfResults,
      verificationOfResultsComment,
    ]
  );
  if (result.affectedRows === 0) {
    return next(new AppError("Failed to add review", 500));
  }
  return res.status(201).json({
    success: true,
    message: "Review added successfully",
  });
});

module.exports.getReviewForReviewerAndSubmission = catchAsync(
  async (req, res, next) => {
    const { reviewerId, submissionId } = req.params;
    const [review] = await mysqlDBPool
      .promise()
      .query(`SELECT * FROM reviews WHERE reviewerId = ? AND paperId = ?`, [
        reviewerId,
        submissionId,
      ]);
    return res.status(200).json({
      success: true,
      review: review[0],
    });
  }
);
module.exports.getAllReviews = catchAsync(async (req, res, next) => {
  const [reviews] = await mysqlDBPool
    .promise()
    .query(
      `SELECT * FROM reviews JOIN submittedPapers ON reviews.paperId = submittedPapers.id JOIN abstracts ON submittedPapers.abstractId = abstracts.id`
    );
  return res.status(200).json({
    success: true,
    reviews: reviews.map((review) => {
      return {
        ...review,
        authors: review.authors ? review.authors.split(",") : [],
        assignedReviewers: review.assignedReviewers
          ? review.assignedReviewers.split(",")
          : [],
        projectId: review.conferenceId,
        correspondingAuthor: review.correspondingAuthorId,
      };
    }),
  });
});
module.exports.getAllFinalReviews = catchAsync(async (req, res, next) => {
  const [reviews] = await mysqlDBPool
    .promise()
    .query(
      `SELECT * FROM reviews JOIN submittedPapers ON reviews.paperId = submittedPapers.id JOIN abstracts ON submittedPapers.abstractId = abstracts.id and finalResult is not null`
    );
  return res.status(200).json({
    success: true,
    reviews: reviews.map((review) => {
      return {
        ...review,
        authors: review.authors ? review.authors.split(",") : [],
        assignedReviewers: review.assignedReviewers
          ? review.assignedReviewers.split(",")
          : [],
        projectId: review.conferenceId,
        correspondingAuthor: review.correspondingAuthorId,
      };
    }),
  });
});
module.exports.addFinalResultToSubmission = catchAsync(
  async (req, res, next) => {
    const { submissionId } = req.params;
    const { finalResult } = req.body;
    const [result] = await mysqlDBPool
      .promise()
      .query(`UPDATE submittedPapers SET finalResult = ? WHERE id = ?`, [
        finalResult,
        submissionId,
      ]);
    if (result.affectedRows === 0) {
      return next(new AppError("Failed to add final result", 500));
    }
    return res.status(200).json({
      success: true,
      message: "Final result added successfully",
    });
  }
);
module.exports.getMyFinalResults = catchAsync(async (req, res, next) => {
  const { authorId } = req.params;
  console.log("holaaaa authorId", authorId);
  const [finalResults] = await mysqlDBPool.promise().query(
    `SELECT 
      submittedPapers.*,
      abstracts.*,
      IFNULL(
          JSON_ARRAYAGG(
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
              )
          ),
          '[]'
      ) AS recommendations
    FROM submittedPapers
    JOIN abstracts ON submittedPapers.abstractId = abstracts.id
    LEFT JOIN reviews ON submittedPapers.id = reviews.paperId
    WHERE submittedPapers.correspondingAuthorId = ? 
      AND submittedPapers.finalResult IS NOT NULL
    GROUP BY submittedPapers.id`,
    [authorId]
  );

  console.log("finalResults", finalResults, authorId);
  if (!finalResults) {
    return next(new AppError("Failed to fetch final results", 500));
  }
  return res.status(200).json({
    success: true,
    finalResults:
      finalResults.map((finalResult) => {
        return {
          ...finalResult,
          recommendations: JSON.parse(finalResult.recommendations),
          authors: finalResult.authors ? finalResult.authors.split(",") : [],
          assignedReviewers: finalResult.assignedReviewers
            ? finalResult.assignedReviewers.split(",")
            : [],
          projectId: finalResult.conferenceId,
          correspondingAuthor: finalResult.correspondingAuthorId,
        };
      }) || [],
  });
});
