import express, { Request, Response } from "express";

export const aiRouter = express.Router();

aiRouter.get("/", async (req: Request, res: Response) => {
  res.send("AI Router is working");
});
