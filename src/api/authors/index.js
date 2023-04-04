import Express from "express";
import createHttpError from "http-errors";
import AuthorsModel from "./model.js";
import q2m from "query-to-mongo";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { triggerBadRequest } from "../validation.js";
import { basicAuthMiddleware } from "../../lib/auth/basic.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";

const authorsRouter = Express.Router();

const cloudinaryUploaderAvatar = multer({
  storage: new CloudinaryStorage({
    cloudinary, // cloudinary is going to search for smth in .env vars called process.env.CLOUDINARY_URL
    params: {
      folder: "BlogPostAuthorImages/authors",
    },
  }),
}).single("avatar");

authorsRouter.post("/", triggerBadRequest, async (req, res, next) => {
  try {
    const newAuthor = new AuthorsModel(req.body);
    const { _id } = await newAuthor.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

authorsRouter.get(
  "/",
  basicAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      console.log("req.query", req.query);
      console.log("q2m", q2m(req.query));
      const mongoQuery = q2m(req.query);
      //  price: '>10' should be converted somehow into price: {$gt: 10}
      const authors = await AuthorsModel.find(
        mongoQuery.criteria,
        mongoQuery.options.fields
      )
        .limit(mongoQuery.options.limit)
        .skip(mongoQuery.options.skip)
        .sort(mongoQuery.options.sort);
      const total = await AuthorsModel.countDocuments(mongoQuery.criteria);
      // no matter the order of usage of these methods, Mongo will ALWAYS apply SORT then SKIP then LIMIT
      res.send({
        links: mongoQuery.links(process.env.LOCAL_URL + "/authors", total),
        total,
        numberOfPages: Math.ceil(total / mongoQuery.options.limit),
        authors,
      });
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.get("/:authorId", basicAuthMiddleware, async (req, res, next) => {
  try {
    const foundAuthor = await AuthorsModel.findById(req.params.authorId);
    if (foundAuthor) {
      res.send(foundAuthor);
    } else {
      next(
        createHttpError(
          404,
          `Author with id ${req.params.authorId} is not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

authorsRouter.put("/:authorId", basicAuthMiddleware, async (req, res, next) => {
  try {
    const updatedAuthor = await AuthorsModel.findByIdAndUpdate(
      req.params.authorId,
      req.body,
      { new: true, runValidators: true }
    );

    if (updatedAuthor) {
      res.send(updatedAuthor);
    } else {
      next(
        createHttpError(
          404,
          `Author with id ${req.params.authorId} is not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

authorsRouter.post(
  "/:authorId/uploadAvatar",
  basicAuthMiddleware,
  cloudinaryUploaderAvatar,
  async (req, res, next) => {
    try {
      console.log("FILE:", req.file);
      const updatedAuthor = await AuthorsModel.findByIdAndUpdate(
        req.params.authorId,
        { avatar: req.file.path },
        { new: true, runValidators: true }
      );
      console.log("updatedAuthor", updatedAuthor);
      if (updatedAuthor) {
        res.send(updatedAuthor);
      } else {
        next(
          createHttpError(
            404,
            `Author with id ${req.params.authorId} is not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.delete(
  "/:authorId",
  basicAuthMiddleware,
  async (req, res, next) => {
    try {
      const deletedAuthor = await AuthorsModel.findByIdAndDelete(
        req.params.authorId
      );
      if (deletedAuthor) {
        res.status(204).send();
      } else {
        next(
          createHttpError(
            404,
            `Author with id ${req.params.authorId} is not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default authorsRouter;
