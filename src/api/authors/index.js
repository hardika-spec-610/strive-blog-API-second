import Express from "express";
import createHttpError from "http-errors";
import AuthorsModel from "./model.js";
import q2m from "query-to-mongo";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { checkAuthorsSchema, triggerBadRequest } from "../validation.js";
// import { basicAuthMiddleware } from "../../lib/auth/basic.js";
import { adminOnlyMiddleware } from "../../lib/auth/admin.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwt.js";
import { createAccessToken } from "../../lib/auth/tools.js";

const authorsRouter = Express.Router();

const cloudinaryUploaderAvatar = multer({
  storage: new CloudinaryStorage({
    cloudinary, // cloudinary is going to search for smth in .env vars called process.env.CLOUDINARY_URL
    params: {
      folder: "BlogPostAuthorImages/authors",
    },
  }),
}).single("avatar");

authorsRouter.post(
  "/",
  checkAuthorsSchema,
  triggerBadRequest,
  async (req, res, next) => {
    try {
      const newAuthor = new AuthorsModel(req.body);
      const { _id } = await newAuthor.save();
      res.status(201).send({ _id });
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.get(
  "/",
  JWTAuthMiddleware,
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

authorsRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const author = await AuthorsModel.findById(req.author._id);
    res.send(author);
    // res.send(req.author);
  } catch (error) {
    next(error);
  }
});

authorsRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updatedAuthor = await AuthorsModel.findByIdAndUpdate(
      req.author._id,
      req.body,
      { new: true, runValidators: true }
    );
    res.send(updatedAuthor);
  } catch (error) {
    next(error);
  }
});

authorsRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await AuthorsModel.findOneAndDelete(req.author._id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authorsRouter.get("/:authorId", JWTAuthMiddleware, async (req, res, next) => {
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

authorsRouter.put(
  "/:authorId",
  JWTAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
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
  }
);

authorsRouter.post(
  "/:authorId/uploadAvatar",
  JWTAuthMiddleware,
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
  JWTAuthMiddleware,
  adminOnlyMiddleware,
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

authorsRouter.post(
  "/register",
  checkAuthorsSchema,
  triggerBadRequest,
  async (req, res, next) => {
    try {
      const { name, surname, email, password, DOB, avatar } = req.body;
      // Check if user already exists
      const existingUser = await AuthorsModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      const newAuthor = new AuthorsModel(req.body);
      const { _id } = await newAuthor.save();
      res.status(201).send({ _id });
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.post("/login", async (req, res, next) => {
  try {
    // 1. Obtain credentials from req.body
    const { email, password } = req.body;

    // 2. Verify the credentials
    const author = await AuthorsModel.checkCredentials(email, password);

    if (author) {
      // 3.1 If credentials are fine --> create an access token (JWT) and send it back as a response
      const payload = { _id: author._id, role: author.role };
      const accessToken = await createAccessToken(payload);

      res.send({ accessToken });
    } else {
      // 3.2 If they are not --> trigger a 401 error
      next(createHttpError(401, "Credentials are not ok!"));
    }
  } catch (error) {
    next(error);
  }
});

export default authorsRouter;
