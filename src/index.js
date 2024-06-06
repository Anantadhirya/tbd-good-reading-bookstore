import "dotenv/config";
import express from "express";
import bookRouter from "./routes/book.js";

const app = express();

app.use(express.json());

app.use("/books", bookRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));

export default app;
