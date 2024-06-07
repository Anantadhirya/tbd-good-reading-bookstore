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
  try {
    await new SQLBuilder().transaction(async (query) => {
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

      const result = await query(
        new SQLBuilder()
          .insert(`"Book"`)
          .values({
            book_name,
            publisher_number,
            publication_year,
            pages,
            price,
          })
          .returning(`book_number`)
      );
      const book_number = result.rows[0].book_number;

      for (const author_number of author_numbers) {
        await query(
          new SQLBuilder()
            .insert(`"Wrote"`)
            .values({ author_number, book_number })
        );
      }

      for (const category_id of category_ids) {
        await query(
          new SQLBuilder()
            .insert(`"Book_Category"`)
            .values({ book_number, category_id })
        );
      }

      res.status(201).json({ book_number });
    });
  } catch (err) {
    next(err);
  }
};

export const addPurchase = async (req, res, next) => {
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

    await new SQLBuilder().transaction(async (query) => {
      for (const book of books) {
        const { book_number, quantity } = book;

        if (!book_number || !quantity) {
          res.status(400);
          throw new Error("Book number and quantity cannot be empty");
        }

        await query(
          new SQLBuilder().insert(`"Bought"`).values({
            customer_number,
            book_number,
            store_number,
            date,
            quantity,
          })
        );

        const result = await query(
          new SQLBuilder()
            .update(`"Inventory"`)
            .set("quantity = quantity - $1", [quantity])
            .where("store_number = $2 AND book_number = $3", [
              store_number,
              book_number,
            ])
            .returning("quantity")
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

      res.status(201).send("Purchase added successfully");
    });
  } catch (err) {
    next(err);
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
