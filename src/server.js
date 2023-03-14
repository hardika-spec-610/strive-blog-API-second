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
} from "./errorsHandlers.js";
import mongoose from "mongoose";

const server = Express();
const port = process.env.PORT || 3001;
// ************************** MIDDLEWARES *********************
server.use(cors());
server.use(Express.json()); // If you don't add this line BEFORE the endpoints all request bodies will be UNDEFINED!!!!!!!!!!!!!!!

// ************************** ENDPOINTS ***********************

server.use("/blogPosts", blogsRouter);

// ************************* ERROR HANDLERS *******************
server.use(badRequestHandler); // 400
server.use(unauthorizedHandler); // 401
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
