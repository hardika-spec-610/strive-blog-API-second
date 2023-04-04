import createHttpError from "http-errors";
import atob from "atob";
import AuthorsModel from "../../api/authors/model.js";

export const basicAuthMiddleware = async (req, res, next) => {
  // This will be our "police officer middleware", responsible for checking "documents" (credentials) of users
  // If documents are ok, user can have the access to the endpoint
  // If they are not ok, user is going to be rejected, receiving 401
  // Here we are expecting to receive a request containing the Authorization header. This should contain something like "Basic cmFtYm9AZ21haWwuY29tOjEyMzQ="
  // "cmFtYm9AZ21haWwuY29tOjEyMzQ=" is just email:password encoded (converted) in Base64
  // 1. Check if Authorization header is provided, if it is not --> trigger 401 error
  if (!req.headers.authorization) {
    next(
      createHttpError(401, "Please provide credentials in Authorization header")
    );
  } else {
    // 2. If we have received the Authorization header, we should extract the credentials out of it
    const encodedCredentials = req.headers.authorization.replace("Basic ", ""); // Alternatively you could use .split()
    console.log("encodedCredentials", encodedCredentials);
    // 3. Since credentials are encoded we should decode them
    const credentials = atob(encodedCredentials); // atob converts "cmFtYm9AZ21haWwuY29tOjEyMzQ=" into "rambo@gmail.com:1234"
    const [email, password] = credentials.split(":");

    // 4. Once we have the credentials, let's check if the user is in db and if the provided pw is ok
    const author = await AuthorsModel.checkCredentials(email, password);

    if (author) {
      // 5.a If credentials are ok --> you can go on (next)
      req.author = author;
      next();
    } else {
      // 5.b If credentials are NOT ok --> 401
      next(createHttpError(401, "Credentials are not ok!"));
    }
  }
};
