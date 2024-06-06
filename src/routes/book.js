import { Router } from "express";
import {
  addBook,
  addPurchase,
  getAllBooks,
  updateInventory,
} from "../controllers/book.js";

const router = Router();

router.get("/", getAllBooks);
router.post("/add", addBook);
router.post("/purchase", addPurchase);
router.put("/inventory", updateInventory);

export default router;
