import mongoose from "mongoose";

const { Schema, model } = mongoose;

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
      //   validate: {
      //     validator: function (v) {
      //       const pattern = /\.(jpeg|jpg|gif|png|svg)$/;
      //       return pattern.test(v);
      //     },
      //     message: "Image link must be a valid URL for an image",
      //   },
    },
    readTime: {
      value: { type: Number, required: true },
      unit: {
        type: String,
        required: true,
        validate: {
          validator: function (unit) {
            return ["seconds", "minutes", "hours"].includes(unit);
          },
          message: "Unit must be one of 'seconds', 'minutes', or 'hours'",
        },
      },
    },
    author: {
      name: { type: String, required: true },
      avatar: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            const pattern = /\.(jpeg|jpg|gif|png|svg)$/;
            return pattern.test(v);
          },
          message: "Image link must be a valid URL for an image",
        },
      },
    },
    content: { type: String },
  },
  {
    timestamps: true, // this option automatically handles the createdAt and updatedAt fields
  }
);

export default model("BlogPosts", blogPostSchema); // this model is now automagically linked to the "BlogPosts" collection, if the collection does not exist it will be created
