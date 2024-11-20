const catchAsync = require("../utils/catchAsync")
const translate = require("../utils/i18n")
const AppError = require("../utils/appError")
module.exports.checkJsonContentType = catchAsync(async (req, res, next) => {
  const contentType = req.headers["content-type"]
  const lang = req.headers["language"] ?? "en"
  req.lang = lang
  if (
    (req.method === "PATCH" || req.method === "POST") &&
    contentType.indexOf("multipart/form-data") !== -1
  ) {
    return next()
  }

  if (
    (!contentType || contentType.indexOf("application/json") !== 0) &&
    req.method !== "GET" &&
    req.method !== "DELETE"
  ) {
    return next(new AppError(translate("invalid_content_type", lang), 415))
  }

  next()
})
