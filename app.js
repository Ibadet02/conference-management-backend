// Include modules:-
// -----------------------------------------------------------------
const express = require("express");
const morgan = require("morgan");
const xss = require("xss-clean");
const hpp = require("hpp");
const compression = require("compression");
const cors = require("cors");

// Controllers:-
const errorController = require("./controllers/errorController");
// Routers:-
const mainRouter = require("./routes/mainRoutes");

// npx aws-sdk-js-codemod -t v2-to-v3
// Globals:-
// -----------------------------------------------------------------

const app = express();

// Middlewares:-
// -----------------------------------------------------------------
// Limit requests ( 1] max: limits 1000 requests for each IP in one hour. | 2] windowMs: If the IP exceeds this limit then it would have to wait for an hour to pass. )
// const limiter = rateLimit({
//   max: 1000,
//   windowMs: 60 * 60 * 1000,
//   message: {
//     status: "fail",
//     message: "Too many requests from this IP. please try again in an hour.",
//   },
// })
// app.use("/api", limiter)

// Prevent parameter pollution (prevents duplicate query string parameters & duplicate keys in urlencoded body requests)
// Add a second HPP middleware to apply the whitelist only to this route. e.g: app.use('/search', hpp({ whitelist: [ 'filter' ] }));
app.use(hpp());

// Middleware for debugging [Displays each incoming request in the console]
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// using cors in development
// if (process.env.NODE_ENV === "development")
app.use(
  cors({
    // specify the origin of the request of some urls

    credentials: true,
    optionSuccessStatus: 200,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
// Reading data from the body of the request as json and converting it to javascript object into req.body
app.use(express.json({ limit: "2MB" }));

// Data sanitization against XSS(cross-site scripting) attacks.
app.use(xss());

// Compress responses before sending it.
app.use(compression());

const apiUrlBase = `${process.env.API_URL_PREFIX}/v${process.env.API_VERSION}`;
console.log(process.env.PLACE_HOLDER_IMAGE);

app.use(`${apiUrlBase}/`, mainRouter);

app.use(errorController);
module.exports = app;
