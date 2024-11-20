const mysqlDBPool = require("../utils/mysqlDBPool");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

module.exports.createConference = catchAsync(async (req, res, next) => {
  /**{
    "title": "test title",
    "topic": "test topic",
    "description": "desc",
    "deadline": {
        "startDate": "2024-11-24T22:00:00.000Z",
        "endDate": "2024-11-25T22:00:00.000Z"
    },
    "canApply": {
        "options": [
            "PhD",
            "Other"
        ],
        "selectedOption": ""
    },
    "submittedStudents": [],
    "appliedStudents": []
} */
  const { title, topic, description, deadline } = req.body;
  const { startDate, endDate } = deadline;
  const createdOn = new Date().toISOString();
  // TABLES['conferences']= """
  // CREATE TABLE `conferences` (
  //   `id` VARCHAR(255) PRIMARY KEY,
  //   `title` VARCHAR(255),
  //   `topic` VARCHAR(255),
  //   `description` TEXT,
  //   `createdOn` DATETIME,
  //   `deadlineStartDate` DATETIME,
  //   `deadlineEndDate` DATETIME,
  //   `canApply` VARCHAR(255)
  // )
  // """
  const [conference] = await mysqlDBPool
    .promise()
    .query(
      `INSERT INTO conferences (id, title, topic, description, createdOn, deadlineStartDate, deadlineEndDate) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [createdOn, title, topic, description, createdOn, startDate, endDate]
    );
  if (conference.affectedRows === 0) {
    return next(new AppError("Failed to create conference", 500));
  }
  return res.status(201).json({
    success: true,
    message: "Conference created successfully",
    conference: {
      id: createdOn,
      title,
      topic,
      description,
      createdOn,
      deadline: { startDate, endDate },
    },
  });
});
module.exports.editConference = catchAsync(async (req, res, next) => {
  const { id, title, topic, description, deadline } = req.body;
  const { startDate, endDate } = deadline;
  const [conference] = await mysqlDBPool
    .promise()
    .query(
      `UPDATE conferences SET title = ?, topic = ?, description = ?, deadlineStartDate = ?, deadlineEndDate = ? WHERE id = ?`,
      [title, topic, description, startDate, endDate, id]
    );
  if (conference.affectedRows === 0) {
    return next(new AppError("Failed to update conference", 500));
  }
  return res.status(200).json({
    success: true,
    message: "Conference updated successfully",
    conference: {
      id,
      title,
      topic,
      description,
      deadline: { startDate, endDate },
    },
  });
});
module.exports.deleteConference = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const [conference] = await mysqlDBPool
    .promise()
    .query(`DELETE FROM conferences WHERE id = ?`, [id]);
  if (conference.affectedRows === 0) {
    return next(new AppError("Failed to delete conference", 500));
  }
  return res.status(200).json({
    success: true,
    message: "Conference deleted successfully",
  });
});
module.exports.getAllConferences = catchAsync(async (req, res, next) => {
  const [conferences] = await mysqlDBPool
    .promise()
    .query(`SELECT * FROM conferences`);
  console.log(conferences);
  return res.status(200).json({
    success: true,
    conferences: conferences.map((conference) => {
      return {
        ...conference,
        deadline: {
          startDate: conference.deadlineStartDate,
          endDate: conference.deadlineEndDate,
        },
      };
    }),
  });
});
