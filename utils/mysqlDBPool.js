require("dotenv").config(); // To load environment variables from .env file
const mysql = require("mysql2");

// Create a connection to the database using environment variables
const dbConnection = mysql.createConnection(
  "mysql://root:NfapeJSPgRWCzuxlrVcrPYpqESiYfZKU@junction.proxy.rlwy.net:28459/railway"
);

// Open a connection to the database
dbConnection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
    return;
  }
  console.log("Connected to the Railway MySQL database.");
});

module.exports = dbConnection;
