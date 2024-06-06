import db from "../db/index.js";

export const addPurchase = async (req, res) => {
  const {
    customer_number,
    store_number,
    books = [], // array of object {book_number, quantity}
    date = new Date(),
  } = req.body;

  if (!customer_number || !store_number)
    return res
      .status(400)
      .send("Customer number and store number cannot be empty");
  if (books.length === 0) return res.status(400).send("Books cannot be empty");
  for (const book of books) {
    const { book_number, quantity } = book;
    if (!book_number || !quantity)
      return res.status(400).send("Book number and quantity cannot be empty");
  }

  var client;

  try {
    client = await db.connect();
    await client.query(`BEGIN`);

    for (const book of books) {
      const { book_number, quantity } = book;

      await client.query(
        `INSERT INTO "Bought" (customer_number, book_number, store_number, date, quantity) VALUES ($1, $2, $3, $4, $5)`,
        [customer_number, book_number, store_number, date, quantity]
      );

      const result = await client.query(
        `UPDATE "Inventory" SET quantity = quantity - $1 WHERE store_number = $2 AND book_number = $3 RETURNING quantity`,
        [quantity, store_number, book_number]
      );
      if (result.rowCount === 0) {
        res
          .status(400)
          .send(`Book ${book_number} at store ${store_number} not found`);
        await client.query(`ROLLBACK`);
        return;
      }
      const resultQuantity = result.rows[0].quantity;
      if (resultQuantity < 0) {
        res
          .status(400)
          .send(
            `Book ${book_number} quantity at store ${store_number} is not enough`
          );
        await client.query(`ROLLBACK`);
        return;
      }
    }

    await client.query(`COMMIT`);

    res.status(201).send("Purchase added successfully");
  } catch (error) {
    if (client) await client.query(`ROLLBACK`);

    if (error.code === "23503") {
      res
        .status(400)
        .send("Invalid customer number, store number, or book number");
    } else {
      console.error("Error adding purchase: ", error);
      res.status(500).send("Internal Server Error");
    }
  } finally {
    if (client) client.release();
  }
};
