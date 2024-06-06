import { Router } from "express";
import { addBook, getAllBooks } from "../controllers/book.js";

const router = Router();

router.get("/", getAllBooks);
router.post("/add", addBook);

export default router;
