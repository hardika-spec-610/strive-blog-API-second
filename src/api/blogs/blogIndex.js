import Express from "express";
import createHttpError from "http-errors";
import blogPostModel from "./model.js";

const blogsRouter = Express.Router();

blogsRouter.post("/", async (req, res, next) => {
  try {
    const newBlogPost = new blogPostModel(req.body);
    // here it happens validation (thanks to Mongoose) of req.body, if it is not ok Mongoose will throw an error
    // if it is ok the user is not saved yet
    const { _id } = await newBlogPost.save();

    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/", async (req, res, next) => {
  try {
    const blogs = await blogPostModel.find();
    res.send(blogs);
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/:blogId", async (req, res, next) => {
  try {
    const blogs = await blogPostModel.findById(req.params.blogId);
    if (blogs) {
      res.send(blogs);
    } else {
      next(
        createHttpError(404, `Blog with id ${req.params.blogId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

export default blogsRouter;
