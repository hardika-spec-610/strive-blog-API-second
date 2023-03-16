import mongoose from "mongoose";

const { Schema, model } = mongoose;

const authorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    surname: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return pattern.test(v);
        },
        message: "Email address is not valid",
      },
    },
    DOB: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          const maxDate = new Date();
          maxDate.setFullYear(maxDate.getFullYear() - 16);
          return v <= maxDate;
        },
        message: "You must be at least 16 years old",
      },
    },
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

  {
    timestamps: true, // this option automatically handles the createdAt and updatedAt fields
  }
);

export default model("Authors", authorSchema);
// this model is now automagically linked to the "BlogPosts" collection, if the collection does not exist it will be created
