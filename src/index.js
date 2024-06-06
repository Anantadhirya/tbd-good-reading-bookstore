import "dotenv/config";
import express from "express";
import bookRouter from "./routes/book.js";
import userRouter from "./routes/user.js";

const app = express();

app.use(express.json());

app.use("/books", bookRouter);
app.use("/users", userRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));

export default app;
