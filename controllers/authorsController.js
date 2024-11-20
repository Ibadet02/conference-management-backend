const mysqlDBPool = require("../utils/mysqlDBPool");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

module.exports.changeAuthorStatus = catchAsync(async (req, res, next) => {
  //actualState: 1,
  // myStatus: "abstract rejected",
  const { actualState, myStatus } = req.body;
  const { id } = req.params;
  const [author] = await mysqlDBPool
    .promise()
    .query(
      `UPDATE authorUsers SET actualState = ?, myStatus = ? WHERE authorId = ?`,
      [parseInt(actualState), myStatus, id]
    );
  if (author.affectedRows === 0) {
    return next(new AppError("Failed to update author status", 500));
  }
  return res.status(200).json({
    success: true,
    message: "Author status updated successfully",
  });
});
module.exports.getAllAuthors = catchAsync(async (req, res, next) => {
  const [authors] = await mysqlDBPool
    .promise()
    .query(`SELECT * FROM authorUsers`);
  if (!authors) {
    return next(new AppError("Failed to fetch authors", 500));
  }
  return res.status(200).json({
    success: true,
    authors,
  });
});
