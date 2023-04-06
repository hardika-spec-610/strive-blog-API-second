import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
    password: {
      type: String,
      required: false,
    },
    DOB: {
      type: Date,
      // required: true,
      validate: {
        validator: function (v) {
          const maxDate = new Date();
          maxDate.setFullYear(maxDate.getFullYear() - 15);
          return v <= maxDate;
        },
        message: "You must be at least 15 years old",
      },
    },
    avatar: {
      type: String,
      // required: true,
      validate: {
        validator: function (v) {
          const pattern = /\.(jpeg|jpg|gif|png|svg)$/;
          return pattern.test(v);
        },
        message: "Image link must be a valid URL for an image",
      },
    },
    role: {
      type: String,
      // required: true,
      enum: ["Admin", "User"],
      default: "User",
    },
    refreshToken: { type: String },
    googleId: { type: String },
  },

  {
    timestamps: true, // this option automatically handles the createdAt and updatedAt fields
  }
);
// BEFORE saving the user in db, I'd like to execute the following code
authorSchema.pre("save", async function () {
  // This code will be automagically executed BEFORE saving
  // Here I am not using an arrow function as I normally do, because of the "this" keyword
  const newAuthorData = this; // If I use arrow functions, "this" will be undefined, it contains the new user's data in case of normal functions

  if (newAuthorData.isModified("password")) {
    // I can save some precious CPU cycles if I execute hash function ONLY whenever the user is modifying his password (or if the user is being created)
    const plainPW = newAuthorData.password;
    const salt = await bcrypt.genSalt(11);
    const hash = await bcrypt.hash(plainPW, salt);
    newAuthorData.password = hash;
  }
});

authorSchema.methods.toJSON = function () {
  // This .toJSON method is called EVERY TIME Express does a res.send(user/users)
  // This does mean that we could override the default behaviour of this method, by writing some code that removes passwords (and also some unnecessary things as well) from users
  const currentAuthorDocument = this;
  const currentAuthor = currentAuthorDocument.toObject();
  delete currentAuthor.password;
  // delete currentAuthor.createdAt
  // delete currentAuthor.updatedAt
  delete currentAuthor.__v;
  return currentAuthor;
};

authorSchema.static("checkCredentials", async function (email, plainPW) {
  // My own custom method attached to the UsersModel

  // Given email and plain text password, this method should check in the db if the user exists (by email)
  // Then it should compare the given password with the hashed one coming from the db
  // Then it should return an useful response

  // 1. Find by email
  const author = await this.findOne({ email });

  if (author) {
    // 2. If the user is found --> compare plainPW with the hashed one
    const passwordMatch = await bcrypt.compare(plainPW, author.password);

    if (passwordMatch) {
      // 3. If passwords match --> return user
      return author;
    } else {
      // 4. If they don't --> return null
      return null;
    }
  } else {
    // 5. In case of also user not found --> return null
    return null;
  }
});

export default model("Authors", authorSchema);
// this model is now automagically linked to the "BlogPosts" collection, if the collection does not exist it will be created
