import { Router } from "express";
import { addWishlist, removeWishlist } from "../controllers/user.js";

const router = Router();

router.post("/wishlist", addWishlist);
router.delete("/wishlist", removeWishlist);

export default router;
