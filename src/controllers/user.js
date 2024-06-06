import db from "../db/index.js";

export const addWishlist = async (req, res) => {
  const { user_id, book_number } = req.body;
  if (!user_id) return res.status(400).send("used_id cannot be empty");
  if (!book_number) return res.status(400).send("book_number cannot be empty");
  try {
    await db.query(
      `INSERT INTO "Wishlist" (user_id, book_number) VALUES ($1, $2)`,
      [user_id, book_number]
    );
    res.status(201).send("Wishlist item added successfully");
  } catch (error) {
    if (error.code === "23503") {
      res.status(400).send("Invalid user id or book number");
    } else {
      console.error("Error adding wishlist: ", error);
      res.status(500).send("Internal Server Error");
    }
  }
};

export const removeWishlist = async (req, res) => {
  const { user_id, book_number } = req.body;
  if (!user_id) return res.status(400).send("used_id cannot be empty");
  if (!book_number) return res.status(400).send("book_number cannot be empty");
  try {
    const result = await db.query(
      `DELETE FROM "Wishlist" WHERE user_id = $1 AND book_number = $2 RETURNING *`,
      [user_id, book_number]
    );

    if (result.rowCount === 0) {
      res.status(404).send("Wishlist item not found");
    } else {
      res.status(200).send("Wishlist item removed successfully");
    }
  } catch (error) {
    console.error("Error removing wishlist: ", error);
    res.status(500).send("Internal Server Error");
  }
};
