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
blogsRouter.put("/:blogId", async (req, res, next) => {
  try {
    const updatedBlog = await blogPostModel.findByIdAndUpdate(
      req.params.blogId, // WHO
      req.body, // HOW
      { new: true, runValidators: true } // OPTIONS. By default findByIdAndUpdate returns the record pre-modification. If you want to get the newly updated one you shall use new: true
      // By default validation is off in the findByIdAndUpdate --> runValidators: true
    );

    // ********************************************** ALTERNATIVE METHOD **********************************
    // const blog = await blogPostModel.findById(req.params.blogId);
    // // When you do a findById, findOne,... you get back a MONGOOSE DOCUMENT which is NOT a normal JS Object!
    // // It is an object with superpowers, for instance it has .save() method that could be very useful in some cases
    // blog.category = "any";

    // await blog.save();

    // ****************************************************************************************************
    if (updatedBlog) {
      res.send(updatedBlog);
    } else {
      next(
        createHttpError(404, `Blog with id ${req.params.blogId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.delete("/:blogId", async (req, res, next) => {
  try {
    const deletedBlog = await blogPostModel.findByIdAndDelete(
      req.params.blogId
    );
    if (deletedBlog) {
      res.status(204).send();
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
