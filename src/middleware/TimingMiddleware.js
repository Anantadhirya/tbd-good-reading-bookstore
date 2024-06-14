export const TimingMiddleware = (req, res, next) => {
  const startTime = process.hrtime();

  res.on("finish", () => {
    const elapsedTime = process.hrtime(startTime);
    const elapsedTimeInMs = elapsedTime[0] * 1000 + elapsedTime[1] / 1e6;
    console.log(
      `${req.method} ${req.originalUrl} [${
        res.statusCode
      }] - ${elapsedTimeInMs.toFixed(3)} ms`
    );
  });

  next();
};
