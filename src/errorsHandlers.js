import mongoose from "mongoose";
export const badRequestHandler = (err, req, res, next) => {
  if (err.status === 400 || err instanceof mongoose.Error.ValidationError) {
    // This error handler is responsible for that error
    res.status(400).send({
      success: false,
      message: err.message,
    });
  } else if (err instanceof mongoose.Error.CastError) {
    res
      .status(400)
      .send({ message: "You've sent a wrong _id in request params" });
  } else {
    // This error handler is NOT responsible for that error
    // We should pass the error to the next in chain
    next(err);
  }
};

export const unauthorizedHandler = (err, req, res, next) => {
  if (err.status === 401) {
    // This error handler is responsible for that error
    res.status(401).send({ success: false, message: err.message });
  } else {
    // This error handler is NOT responsible for that error
    // We should pass the error to the next in chain
    next(err);
  }
};

export const notfoundHandler = (err, req, res, next) => {
  if (err.status === 404) {
    // This error handler is responsible for that error
    res.status(404).send({ success: false, message: err.message });
  } else {
    // This error handler is NOT responsible for that error
    // We should pass the error to the next in chain
    next(err);
  }
};

export const genericErrorHandler = (err, req, res, next) => {
  console.log("ERROR:", err);
  res.status(500).send({
    success: false,
    message: "Something happened on our side! we will fix that ASAP!",
  });
};
