import { Router } from "express";
import {
  addBook,
  addPurchase,
  getAllBooks,
  searchBooksByName,
  updateInventory,
} from "../controllers/book.js";

const router = Router();

router.get("/", getAllBooks);
router.get("/search", searchBooksByName);
router.post("/add", addBook);
router.post("/purchase", addPurchase);
router.patch("/inventory", updateInventory);

export default router;
