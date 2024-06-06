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

export const addBook = async (req, res) => {
  const {
    book_name,
    publisher_number = null,
    publication_year = null,
    pages = null,
    price = null,
    author_numbers = [], // many-to-many relationship
    category_ids = [], // multivalue attribute
  } = req.body;

  if (!book_name) return res.status(400).send("Book name cannot be empty");

  var client;

  try {
    client = await db.connect();
    await client.query(`BEGIN`);

    const result = await client.query(
      `INSERT INTO "Book" (book_name, publisher_number, publication_year, pages, price) VALUES ($1, $2, $3, $4, $5) RETURNING book_number`,
      [book_name, publisher_number, publication_year, pages, price]
    );
    const book_number = result.rows[0].book_number;

    for (const author_number of author_numbers) {
      await client.query(
        `INSERT INTO "Wrote" (author_number, book_number) VALUES ($1, $2)`,
        [author_number, book_number]
      );
    }

    for (const category_id of category_ids) {
      await client.query(
        `INSERT INTO "Book_Category" (book_number, category_id) VALUES ($1, $2)`,
        [book_number, category_id]
      );
    }

    await client.query(`COMMIT`);

    res.status(201).json({ book_number });
  } catch (error) {
    if (client) await client.query(`ROLLBACK`);

    if (error.code === "23503") {
      res
        .status(400)
        .send("Invalid publisher number, author number, or category ID");
    } else {
      console.error("Error adding books: ", error);
      res.status(500).send("Internal Server Error");
    }
  } finally {
    if (client) client.release();
  }
};

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

export const updateInventory = async (req, res) => {
  const { store_number, book_number, quantity } = req.body;

  if (!store_number || !book_number || !quantity)
    return res
      .status(400)
      .send("Book number, store number, and quantity cannot be empty");

  try {
    const result = await db.query(
      `UPDATE "Inventory" SET quantity = $1 WHERE store_number = $2 AND book_number = $3 RETURNING *`,
      [quantity, store_number, book_number]
    );
    if (result.rowCount === 0) {
      await db.query(
        `INSERT INTO "Inventory" (store_number, book_number, quantity) VALUES ($1, $2, $3)`,
        [store_number, book_number, quantity]
      );
    }
    res.status(200).send("Inventory updated successfully");
  } catch (error) {
    if (error.code === "23503") {
      res.status(400).send("Invalid store number or book number");
    } else {
      console.error("Error updating inventory: ", error);
      res.status(500).send("Internal Server Error");
    }
  }
};
