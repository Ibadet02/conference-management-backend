import mysql.connector
from mysql.connector import errorcode

# Replace with your MySQL database public URL details
DB_CONFIG = {
    'user': "root",
    'password': "uBxlxJwNAScxaUIXTcssslqyxCEqHzhh",
    'host': "autorack.proxy.rlwy.net",
    'port': 18220,
    'database': "railway",
}


# SQL statements for creating tables
TABLES = {}

# adminUsers Table
TABLES['users'] = """
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        roleType VARCHAR(50)
    )
"""

# authorUsers Table
TABLES['authorUsers'] = """
    CREATE TABLE IF NOT EXISTS authorUsers (
        authorId VARCHAR(255) PRIMARY KEY,
        firstName VARCHAR(255),
        lastName VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(255),
        academicInterest VARCHAR(255),
        affiliation VARCHAR(255),
        program VARCHAR(50),
        supervisor VARCHAR(255),
        myStatus VARCHAR(50),
        actualState INT,
        paperUpdated BOOLEAN,
        FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
    )
"""

# reviewerUsers Table
TABLES['reviewerUsers'] = """ 
CREATE TABLE `reviewerUsers` (
  `reviewerId` VARCHAR(255) PRIMARY KEY,
  `firstName` VARCHAR(255),
  `lastName` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(255),
  `academicInterest` VARCHAR(255),
  `affiliation` VARCHAR(255),
  `reviewCapacity` INT,
   FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE
);"""

TABLES['conferences']= """ 
CREATE TABLE `conferences` (
  `id` VARCHAR(255) PRIMARY KEY, 
  `title` VARCHAR(255), 
  `topic` VARCHAR(255), 
  `description` TEXT, 
  `createdOn` TEXT, 
  `deadlineStartDate` TEXT, 
  `deadlineEndDate` TEXT
)
"""

TABLES['abstracts'] = """
CREATE TABLE IF NOT EXISTS abstracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    abstract TEXT,
    abstractApproved BOOLEAN,       
    abstractUpdated BOOLEAN
);
"""
# # submittedPapers Table
TABLES['submittedPapers'] = """
    CREATE TABLE IF NOT EXISTS submittedPapers (
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
        note TEXT,
        FOREIGN KEY (conferenceId) REFERENCES conferences(id) ON DELETE CASCADE,
        FOREIGN KEY (abstractId) REFERENCES abstracts(id) ON DELETE CASCADE,
        FOREIGN KEY (correspondingAuthorId) REFERENCES authorUsers(authorId) ON DELETE CASCADE
    )
"""

TABLES['reviews'] = """
    CREATE TABLE IF NOT EXISTS reviews (
        reviewerId VARCHAR(255),
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
        FOREIGN KEY (reviewerId) REFERENCES reviewerUsers(reviewerId) ON DELETE CASCADE,
        FOREIGN KEY (paperId) REFERENCES submittedPapers(id) ON DELETE CASCADE
    )
"""



# Connect to MySQL and create tables
try:
    # cursor.execute("ALTER TABLE authorUsers CHANGE COLUMN actualState actualState INT")
    # cursor.execute("""
    # DROP DATABASE IF EXISTS railway;""")
    for table_name, ddl in TABLES.items():
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        try:
            print(f"Creating table {table_name}...")
            cursor.execute(ddl)
            print(f"Table {table_name} created successfully.")
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                print(f"Table {table_name} already exists.")
            else:
                print(f"Error creating table {table_name}: {err}")
    connection.commit()
        # connection.commit()
        # cursor.close()

except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    # connection.close()
    print("Database connection closed.")
