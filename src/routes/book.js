import { Router } from "express";
import { getAllBooks } from "../controllers/book.js";

const router = Router();

router.get("/", getAllBooks);

export default router;
