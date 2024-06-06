import "dotenv/config";
import express from "express";
import db from "./db/index.js";

const app = express();

app.get("/", async (req, res) => {
  const query = `SELECT * FROM "Book"`;
  const result = await db.query(query);
  res.send(result.rows);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));

export default app;
