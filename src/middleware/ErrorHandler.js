const ErrorHandler = (err, req, res, next) => {
  const status = res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message || "Something went wrong";

  console.log("Error: ", err.stack);

  res.status(status).json({ status, message });
};

export default ErrorHandler;
