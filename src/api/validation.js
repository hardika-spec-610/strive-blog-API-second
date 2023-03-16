import { checkSchema, validationResult } from "express-validator";
import createHttpError from "http-errors";

const blogPostSchema = {
  category: {
    in: ["body"],
    isString: {
      errorMessage: "Category is a mandatory field and needs to be a string!",
    },
  },
  title: {
    in: ["body"],
    isString: {
      errorMessage: "Title is a mandatory field and needs to be a string!",
    },
  },
  cover: {
    in: ["body"],
    isString: {
      errorMessage: "Cover is a mandatory field and needs to be a string!",
    },
  },
  "author.name": {
    in: ["body"],
    isString: {
      errorMessage: "Name is a mandatory field and needs to be a string!",
    },
  },
  "author.avatar": {
    in: ["body"],
    isString: {
      errorMessage: "Avatar is a mandatory field and needs to be a string!",
    },
  },
};

const commentSchema = {
  authorName: {
    in: ["body"],
    isString: {
      errorMessage: "authorname is a mandatory field and needs to be a string",
    },
  },
  text: {
    in: ["body"],
    isString: {
      errorMessage: "text is a mandatory field and needs to be a string",
    },
  },
};

export const checkBlogsSchema = checkSchema(blogPostSchema); // this function creates a middleware
export const checkCommentSchema = checkSchema(commentSchema);

export const triggerBadRequest = (req, res, next) => {
  // 1. Check if checkBooksSchema has found any error in req.body
  const errors = validationResult(req);
  console.log(errors.array());
  if (errors.isEmpty()) {
    // 2.1 If we don't have errors --> normal flow (next)
    next();
  } else {
    // 2.2 If we have any error --> trigger 400
    next(
      createHttpError(400, "Errors during blog validation", {
        errorsList: errors.array(),
      })
    );
  }
};
