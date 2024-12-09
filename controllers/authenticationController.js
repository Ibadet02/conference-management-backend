const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const translate = require("../utils/i18n");
const helperMethods = require("../utils/authHelperMethods");
const dbConnection = require("../utils/mysqlDBPool");

module.exports.login = catchAsync(async (req, res, next) => {
  const lang = req.headers["language"] ?? "en";
  const { user_name, password } = req.body;

  if (!(user_name && password)) {
    return next(
      new AppError(translate("missing_credentials_message", lang), 400)
    );
  }

  const [user] = await dbConnection
    .promise()
    .query(`SELECT * FROM users where email=? AND password=? `, [
      user_name,
      password,
    ]);
  console.log("user,", user);
  if (!user[0]) {
    return next(
      new AppError(translate("invalid_credentials_message", lang), 400)
    );
  }
  // get author or reviewer data based on the user type
  let userData;
  if (user[0].roleType === "reviewer") {
    const [reviewer] = await dbConnection
      .promise()
      .query(`SELECT * FROM reviewerUsers where reviewerId=?`, [user[0].id]);
    userData = reviewer[0];
  } else if (user[0].roleType === "author") {
    const [author] = await dbConnection
      .promise()
      .query(`SELECT * FROM authorUsers where authorId=?`, [user[0].id]);
    userData = author[0];
  }

  const token = jwt.sign(
    {
      user_id: user[0].id,
      user_name: user_name,
    },
    process.env.JWT_TOKEN_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
  const currentTime = new Date();
  currentTime.setMinutes(
    currentTime.getMinutes() + parseInt(process.env.JWT_EXPIRES_IN)
  );
  const { returnPassword, ...restUser } = user[0];
  return res.status(200).json({
    success: true,
    token: token,
    valid_until: currentTime.toISOString(),
    user: { ...restUser, ...userData },
  });
});
module.exports.register = catchAsync(async (req, res, next) => {
  const lang = req.headers["language"] ?? "en";
  const {
    user_name,
    password,
    type,
    firstName,
    lastName,
    affiliation,
    email,
    phone,
    academicInterest,
    reviewCapacity,
    program,
    supervisor,
    myStatus,
    actualState,
    paperUpdated,
  } = req.body;
  if (!(user_name && password && type)) {
    return next(
      new AppError(translate("missing_credentials_message", lang), 400)
    );
  }
  const [user] = await dbConnection
    .promise()
    .query(`SELECT * FROM users where email=?`, [user_name]);
  if (user[0]) {
    return next(new AppError("User already exists!", 400));
  }
  const prevId = await dbConnection
    .promise()
    .query("SELECT MAX(id) FROM users");
  const nextId = parseInt(prevId[0][0]["MAX(id)"]) + 1;
  const [result] = await dbConnection
    .promise()
    .query(
      `INSERT INTO users (id, email, password, roleType) VALUES (?, ?, ?, ?)`,
      [nextId, user_name, password, type]
    );
  if (result.affectedRows === 0) {
    return next(
      new AppError("User could not be created. Please try again later!", 500)
    );
  }
  if (type === "reviewer") {
    const [result2] = await dbConnection
      .promise()
      .query(
        `INSERT INTO reviewerUsers (reviewerId, firstName, lastName, affiliation, email, phone, academicInterest, reviewCapacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nextId,
          firstName,
          lastName,
          affiliation.selectedOption,
          email,
          phone,
          academicInterest.selectedOption,
          reviewCapacity.selectedOption,
        ]
      );
    if (result2.affectedRows === 0) {
      return next(new AppError("Reviewer data error", 500));
    }
  } else if (type === "author") {
    const [result2] = await dbConnection.promise().query(
      `
      INSERT INTO authorUsers (
        authorId, firstName, lastName, affiliation, email, phone, 
        academicInterest, program, supervisor, myStatus, actualState, paperUpdated
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        nextId,
        firstName,
        lastName,
        affiliation.selectedOption,
        email,
        phone,
        academicInterest.selectedOption,
        program.selectedOption,
        supervisor.selectedOption,
        myStatus ?? "",
        actualState ?? 0,
        paperUpdated ?? 0,
      ]
    );

    if (result2.affectedRows === 0) {
      return next(new AppError("Author data error", 500));
    }
  }

  return res.status(200).json({
    success: true,
    message: "User created successfully!",
    userId: nextId,
  });
});

module.exports.refreshToken = catchAsync(async (req, res, next) => {
  const lang = req.headers["language"] ?? "en";

  if (
    !req.headers["authorization"] ||
    !req.headers["authorization"].split(" ")[1]
  ) {
    return next(new AppError(translate("token_error_message", lang), 403));
  }
  const token = req.headers["authorization"]?.split(" ")[1];
  let decodedUser;
  jwt.verify(token, process.env.JWT_TOKEN_KEY, (err, user) => {
    if (err && err.name !== "TokenExpiredError") {
      throw err;
    }
    decodedUser = jwt.decode(token);
  });

  // check if the user exists in the database
  if (
    decodedUser &&
    !helperMethods.checkIfUserExists(decodedUser.user_id, decodedUser.user_name)
  ) {
    return next(new AppError(translate("user_deleted_message", lang), 404));
  }

  const refreshToken = jwt.sign(
    {
      user_id: decodedUser ? decodedUser.user_id : undefined,
      user_name: decodedUser ? decodedUser.user_name : undefined,
      key: `${
        Math.random() * parseInt(decodedUser.user_id)
      }_{${decodedUser.user_name.toUpperCase()}}`,
    },
    process.env.JWT_TOKEN_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
  const currentTime = new Date();
  currentTime.setMinutes(
    currentTime.getMinutes() + parseInt(process.env.JWT_EXPIRES_IN)
  );
  return res.status(200).json({
    success: true,
    token: refreshToken,
    valid_until: currentTime.toISOString(),
  });
});
module.exports.resetAuthorStatus = catchAsync(async (req, res, next) => {
  //set all authors status to
  // actualState: null,
  // myStatus: null,
  // paperUpdated: 0,
  const [result] = await dbConnection
    .promise()
    .query(
      `UPDATE authorUsers SET actualState = NULL, myStatus = NULL, paperUpdated = 0`
    );
  if (result.affectedRows === 0) {
    return next(new AppError("Failed to reset author status", 500));
  }
  return res.status(200).json({
    success: true,
    message: "Author status reset successfully",
  });
});
module.exports.getUserDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const [user] = await dbConnection
    .promise()
    .query(`SELECT * FROM users where id=?`, [id]);
  if (!user[0]) {
    return next(new AppError("User not found", 404));
  }
  let userData;
  if (user[0].roleType === "reviewer") {
    const [reviewer] = await dbConnection
      .promise()
      .query(`SELECT * FROM reviewerUsers where reviewerId=?`, [id]);
    userData = reviewer[0];
  } else if (user[0].roleType === "author") {
    const [author] = await dbConnection
      .promise()
      .query(`SELECT * FROM authorUsers where authorId=?`, [id]);
    userData = author[0];
  }
  return res.status(200).json({
    success: true,
    user: { ...user[0], ...userData },
  });
});
