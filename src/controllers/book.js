import db from "../db/index.js";

export const getAllBooks = async (req, res) => {
  try {
    const query = `SELECT * FROM "Book"`;
    const result = await db.query(query);
    res.send(result.rows);
  } catch (error) {
    console.error("Error retrieving books: ", error);
    res.status(500).send("Internal server error");
  }
};
