// const express = require("express") OLD IMPORT SYNTAX
import Express from "express"; // NEW IMPORT SYNTAX (We can use it only if we add "type": "module", to package.json)
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import blogsRouter from "./api/blogs/blogIndex.js";
import {
  genericErrorHandler,
  badRequestHandler,
  unauthorizedHandler,
  notfoundHandler,
  forbiddenErrorHandler,
} from "./errorsHandlers.js";
import mongoose from "mongoose";
import passport from "passport";
import authorsRouter from "./api/authors/index.js";
import googleStrategy from "./lib/auth/googleOauth.js";

const server = Express();
const port = process.env.PORT || 3001;
passport.use("google", googleStrategy); // Do not forget to inform Passport that we want to use Google Strategy!
// ************************** MIDDLEWARES *********************
server.use(cors());
server.use(Express.json()); // If you don't add this line BEFORE the endpoints all request bodies will be UNDEFINED!!!!!!!!!!!!!!!
server.use(passport.initialize()); // Do not forget to inform Express that we are using Passport!

// ************************** ENDPOINTS ***********************
server.use("/authors", authorsRouter);
server.use("/blogPosts", blogsRouter);

// ************************* ERROR HANDLERS *******************
server.use(badRequestHandler); // 400
server.use(unauthorizedHandler); // 401
server.use(forbiddenErrorHandler); // 403
server.use(notfoundHandler); // 404
server.use(genericErrorHandler); // 500 (this should ALWAYS be the last one)

mongoose.connect(process.env.MONGO_URL);

mongoose.connection.on("connected", () => {
  console.log("✅ Successfully connected to Mongo!");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`✅ Server is running on port ${port}`);
  });
});
