# BLOG TEMPLATE BE

This is a blog project with user authentication and authorization implemented using Node.js, Express, and MongoDB. The project also includes a login page and Google OAuth for backend.

## Installation

To install the app, first clone the repository:

### git clone https://github.com/hardika-spec-610/strive-blog-API-second.git

Then navigate to the project directory and install the dependencies:

```javascript
cd strive-blog-API-second
npm install
```

## Set up environment variables:

- Create a .env file in the root directory of the project
- set PORT=
- Set LOCAL_URL your localhost url
- Set CLOUDINARY_URL to upload images on cloudinary
- set JWT_SECRET token is a secret key that is used to sign and verify JSON Web Tokens (JWTs) in a web application
- Set MONGODB_URI to your MongoDB connection string
- Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your Google OAuth credentials
- Set FE_URL your frontend url

Finally, start the app:

```javascript
npm start
```

The app should now be running on [http://localhost:3000](http://localhost:3000).

## Technologies Used in Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- jsonwebtoken
- Passport.js
- passport-google-oauth20
