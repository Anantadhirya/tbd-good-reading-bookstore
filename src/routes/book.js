import { Router } from "express";
import { addBook, addPurchase, getAllBooks } from "../controllers/book.js";

const router = Router();

router.get("/", getAllBooks);
router.post("/add", addBook);
router.post("/purchase", addPurchase);

export default router;
