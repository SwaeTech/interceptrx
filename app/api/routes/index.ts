import express, { Request, Response, NextFunction } from "express";
const router = express.Router();

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const ollamaModel = "llama3.2";

/* GET home page. */
interface IndexRenderOptions {
  title: string;
}

router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.render("index", { title: "Express" } as IndexRenderOptions);
});

export default router;
