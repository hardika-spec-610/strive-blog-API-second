import mongoose from "mongoose";

const { Schema, model } = mongoose;

const commentSchema = new Schema(
  {
    authorName: { type: String, required: true },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const blogPostSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return ["Social Media", "Product", "Business News"].includes(v);
        },
        message:
          "category must be one of 'Social Media', 'Product', or 'Business News'",
      },
    },
    title: { type: String, required: true },
    cover: {
      type: String,
      required: true,
    },
    readTime: {
      value: { type: Number, required: true },
      unit: {
        type: String,
        required: true,
        validate: {
          validator: function (unit) {
            return ["minutes", "hours", "day"].includes(unit);
          },
          message: "Unit must be one of 'day', 'minutes', or 'hours'",
        },
      },
    },
    author: { type: Schema.Types.ObjectId, ref: "Authors", required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "Authors" }],
    content: { type: String },
    comments: [commentSchema],
  },

  {
    timestamps: true, // this option automatically handles the createdAt and updatedAt fields
  }
);

export default model("BlogPosts", blogPostSchema);
// this model is now automagically linked to the "BlogPosts" collection, if the collection does not exist it will be created
