import Express from "express";
import createHttpError from "http-errors";
import blogPostModel from "./model.js";
import q2m from "query-to-mongo";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const blogsRouter = Express.Router();

const cloudinaryUploaderCover = multer({
  storage: new CloudinaryStorage({
    cloudinary, // cloudinary is going to search for smth in .env vars called process.env.CLOUDINARY_URL
    params: {
      folder: "BlogPostCoverImages/blogPosts",
    },
  }),
}).single("cover");

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
    console.log("req.query", req.query);
    console.log("q2m", q2m(req.query));
    const mongoQuery = q2m(req.query);
    //  price: '>10' should be converted somehow into price: {$gt: 10}
    const blogs = await blogPostModel
      .find(mongoQuery.criteria, mongoQuery.options.fields)
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort)
      .populate({ path: "author", select: "name surname email avatar" });
    const total = await blogPostModel.countDocuments(mongoQuery.criteria);
    // no matter the order of usage of these methods, Mongo will ALWAYS apply SORT then SKIP then LIMIT
    res.send({
      links: mongoQuery.links(process.env.LOCAL_URL + "/blogPosts", total),
      total,
      numberOfPages: Math.ceil(total / mongoQuery.options.limit),
      blogs,
    });
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/:blogId", async (req, res, next) => {
  try {
    const blogs = await blogPostModel
      .findById(req.params.blogId)
      .populate({ path: "author", select: "name surname email avatar" });
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

blogsRouter.post(
  "/:blogId/uploadCover",
  cloudinaryUploaderCover,
  async (req, res, next) => {
    try {
      console.log("FILE:", req.file);
      const updatedBlogPost = await blogPostModel.findByIdAndUpdate(
        req.params.blogId,
        { cover: req.file.path },
        { new: true, runValidators: true }
      );
      console.log("updatedBlogPost", updatedBlogPost);

      if (updatedBlogPost) {
        res.send(updatedBlogPost);
      } else {
        next(
          createHttpError(
            404,
            `Blog post with id ${res.params.blogId} not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

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

blogsRouter.post("/:blogId/comments", async (req, res, next) => {
  try {
    const blog = await blogPostModel.findById(req.params.blogId);
    if (blog) {
      const newComment = req.body;
      const commentToInsert = {
        ...newComment,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log("commentToInsert", commentToInsert);
      const updatedBlog = await blogPostModel.findByIdAndUpdate(
        req.params.blogId,
        {
          $push: { comments: commentToInsert },
        },
        { new: true, runValidators: true }
      );
      console.log("updatedBlog", updatedBlog);
      if (updatedBlog) {
        res.send(updatedBlog);
      } else {
        next(createHttpError(404, `Blog has not comments`));
      }
    } else {
      next(
        createHttpError(404, `Blog with id ${req.params.blogId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/:blogId/comments", async (req, res, next) => {
  try {
    const blog = await blogPostModel.findById(req.params.blogId);
    if (blog) {
      res.send(blog.comments);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blog = await blogPostModel.findById(req.params.blogId);
    if (blog) {
      console.log("blogComments", blog.comments);
      const selectedComment = blog.comments.find(
        (c) => c._id.toString() === req.params.commentId
      );
      if (selectedComment) {
        res.send(selectedComment);
      } else {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentId} not found`
          )
        );
      }
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.put("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blog = await blogPostModel.findById(req.params.blogId);
    if (blog) {
      const index = blog.comments.findIndex(
        (c) => c._id.toString() === req.params.commentId
      );
      if (index !== -1) {
        blog.comments[index] = {
          ...blog.comments[index].toObject(),
          updatedAt: new Date(),
          ...req.body,
        };
        await blog.save();
        res.send(blog);
      } else {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentId} not found`
          )
        );
      }
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.delete("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const updatedBlog = await blogPostModel.findByIdAndUpdate(
      req.params.blogId,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true, runValidators: true }
    );
    if (updatedBlog) {
      res.send(updatedBlog);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId/like", async (req, res, next) => {
  try {
    const foundBlogpost = await blogPostModel.findById(req.params.blogId);
    if (foundBlogpost) {
      res.send(foundBlogpost.likes);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

export default blogsRouter;
