# Backend API

REST API

![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![ExpressJS](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

### How to run

###### First, please make sure you have [Node.js](https://nodejs.org/en/download/) installed.

1. navigate to the project folder

```
cd backend_api
```

2. install npm dependencies

```
npm i
```

4. start the project

```
npm start
```

### Documentaion

### Important notes

- config.env file in project's root directory is used to store the configuration "env. variables"
- In config.env, you can change NODE_ENV from development to production and vice versa
  - development: error details and stack is returned, also logs are logged to the console
  - production: production error version is returned, logs are logged to logs files
- The api default url is localhost:8000/api/v1
  - Can be changed from config.env
