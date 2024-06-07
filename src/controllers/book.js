import db from "../db/index.js";
import { SQLBuilder } from "../helper/SQLBuilder.js";

export const getAllBooks = async (req, res, next) => {
  try {
    const result = await new SQLBuilder().select(`*`).from(`"Book"`).query();
    res.send(result.rows);
  } catch (err) {
    next(err);
  }
};

export const searchBooksByName = async (req, res, next) => {
  try {
    const book_name = req.query.q;
    const result = await new SQLBuilder()
      .select(`*`)
      .from(`"Book"`)
      .where(`book_name LIKE $1`, [`%${book_name}%`])
      .query();
    if (result.rowCount === 0) {
      res.status(404);
      throw new Error("Book not found");
    } else {
      res.status(200).send(result.rows);
    }
  } catch (err) {
    next(err);
  }
};

export const addBook = async (req, res, next) => {
  var client;
  try {
    const {
      book_name,
      publisher_number = null,
      publication_year = null,
      pages = null,
      price = null,
      author_numbers = [], // many-to-many relationship
      category_ids = [], // multivalue attribute
    } = req.body;

    if (!book_name) {
      res.status(400);
      throw new Error("Book name cannot be empty");
    }

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
  } catch (err) {
    if (client) await client.query(`ROLLBACK`);
    next(err);
  } finally {
    if (client) client.release();
  }
};

export const addPurchase = async (req, res, next) => {
  var client;

  try {
    const {
      customer_number,
      store_number,
      books = [], // array of object {book_number, quantity}
      date = new Date(),
    } = req.body;

    if (!customer_number || !store_number) {
      res.status(400);
      throw new Error("Customer number and store number cannot be empty");
    }
    if (books.length === 0) {
      res.status(400);
      throw new Error("Books cannot be empty");
    }
    for (const book of books) {
      const { book_number, quantity } = book;
    }

    client = await db.connect();

    await client.query(`BEGIN`);

    for (const book of books) {
      const { book_number, quantity } = book;

      if (!book_number || !quantity) {
        res.status(400);
        throw new Error("Book number and quantity cannot be empty");
      }

      await client.query(
        `INSERT INTO "Bought" (customer_number, book_number, store_number, date, quantity) VALUES ($1, $2, $3, $4, $5)`,
        [customer_number, book_number, store_number, date, quantity]
      );

      const result = await client.query(
        `UPDATE "Inventory" SET quantity = quantity - $1 WHERE store_number = $2 AND book_number = $3 RETURNING quantity`,
        [quantity, store_number, book_number]
      );
      if (result.rowCount === 0) {
        res.status(400);
        throw new Error(
          `Book ${book_number} at store ${store_number} not found`
        );
      }
      const resultQuantity = result.rows[0].quantity;
      if (resultQuantity < 0) {
        res.status(400);
        throw new Error(
          `Book ${book_number} quantity at store ${store_number} is not enough`
        );
      }
    }

    await client.query(`COMMIT`);

    res.status(201).send("Purchase added successfully");
  } catch (err) {
    if (client) await client.query(`ROLLBACK`);
    next(err);
  } finally {
    if (client) client.release();
  }
};

export const updateInventory = async (req, res, next) => {
  try {
    const { store_number, book_number, quantity } = req.body;

    if (!store_number || !book_number || !quantity) {
      res.status(400);
      throw new Error(
        "Book number, store number, and quantity cannot be empty"
      );
    }

    const result = await new SQLBuilder()
      .update(`"Inventory"`)
      .set(`quantity = $1`, [quantity])
      .where(`store_number = $2 AND book_number = $3`, [
        store_number,
        book_number,
      ])
      .returning(`*`)
      .query();
    if (result.rowCount === 0) {
      await new SQLBuilder()
        .insert(`"Inventory"`)
        .values({ store_number, book_number, quantity })
        .query();
    }
    res.status(200).send("Inventory updated successfully");
  } catch (err) {
    next(err);
  }
};
