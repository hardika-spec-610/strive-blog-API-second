import GoogleStrategy from "passport-google-oauth20";
import { createAccessToken } from "./tools.js";
import AuthorsModel from "../../api/authors/model.js";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: `${process.env.LOCAL_URL}/authors/auth/google/callback`,
  },
  async (_, __, profile, passportNext) => {
    // This function is executed when Google sends us a successfull response
    // Here we are going to receive some informations about the user from Google (scopes --> profile, email)
    try {
      const { email, given_name, family_name, sub } = profile._json;
      console.log("PROFILE:", profile);
      // 1. Check if the user is already in db
      const author = await AuthorsModel.findOne({ email });
      if (author) {
        // 2. If he is there --> generate an accessToken (optionally also a refreshToken)
        const accessToken = await createAccessToken({
          _id: author._id,
          role: author.role,
        });
        console.log("accessToken", accessToken);
        // 2.1 Then we can go next (to /auth/google/callback route handler function)
        passportNext(null, { accessToken });
      } else {
        // 3. If user is not in our db --> create that
        const newAuthor = new AuthorsModel({
          name: given_name,
          surname: family_name,
          email,
          googleId: sub,
        });

        const createdAuthor = await newAuthor.save();

        // 3.1 Then generate an accessToken (optionally also a refreshToken)
        const accessToken = await createAccessToken({
          _id: createdAuthor._id,
          role: createdAuthor.role,
        });

        // 3.2 Then we go next (to /auth/google/callback route handler function)
        passportNext(null, { accessToken });
      }
    } catch (error) {
      // 4. In case of errors we gonna catch'em and handle them
      passportNext(error);
    }
  }
);

export default googleStrategy;
