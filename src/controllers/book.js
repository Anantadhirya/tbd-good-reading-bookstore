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
