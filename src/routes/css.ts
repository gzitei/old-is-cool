import path from "node:path";
import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

const root = path.dirname(__dirname);
console.log(root);

router.get("/:file", (req: Request, res: Response) => {
    const file = req.params.file;
    res.status(200).sendFile(path.join(root, "css", file));
});

export default router;
