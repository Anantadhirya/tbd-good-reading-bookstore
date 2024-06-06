import db from "../db/index.js";

export const addWishlist = async (req, res, next) => {
  try {
    const { user_id, book_number } = req.body;
    if (!user_id || !book_number) {
      res.status(400);
      throw new Error("User ID and Book Number cannot be empty");
    }
    await db.query(
      `INSERT INTO "Wishlist" (user_id, book_number) VALUES ($1, $2)`,
      [user_id, book_number]
    );
    res.status(201).send("Wishlist item added successfully");
  } catch (err) {
    next(err);
  }
};

export const removeWishlist = async (req, res, next) => {
  try {
    const { user_id, book_number } = req.body;
    if (!user_id || !book_number) {
      res.status(400);
      throw new Error("User ID and Book Number cannot be empty");
    }
    const result = await db.query(
      `DELETE FROM "Wishlist" WHERE user_id = $1 AND book_number = $2 RETURNING *`,
      [user_id, book_number]
    );
    if (result.rowCount === 0) {
      res.status(404);
      throw new Error("Wishlist item not found");
    }
    res.status(200).send("Wishlist item removed successfully");
  } catch (err) {
    next(err);
  }
};
