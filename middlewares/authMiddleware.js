const jwt = require("jsonwebtoken")
const helperMethods = require("../utils/authHelperMethods")
const catchAsync = require("../utils/catchAsync")
const translate = require("../utils/i18n")
const AppError = require("../utils/appError")

module.exports.verifyToken = catchAsync(async (req, res, next) => {
  const lang = req.headers["language"] ?? "en"

  if (
    !req.headers["authorization"] ||
    !req.headers["authorization"].split(" ")[1]
  ) {
    return next(new AppError(translate("token_error_message", lang), 403))
  }
  const token = req.headers["authorization"].split(" ")[1]

  jwt.verify(token, process.env.JWT_TOKEN_KEY, (err, user) => {
    if (err) {
      throw err
    }
    req.user = user
    if (!helperMethods.checkIfUserExists(user.user_id, user.user_name)) {
      return next(new AppError(translate("user_deleted_message", lang), 404))
    }
  })

  next()
})
