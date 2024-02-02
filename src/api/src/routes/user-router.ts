import express, { Request, Response } from "express";
import { UserService } from "../services";

export const userRouter = express.Router();
const db = new UserService();

userRouter.get("/me", async (req: Request, res: Response) => {
  return res.json({ data: req.user });
});

userRouter.get("/", async (req: Request, res: Response) => {
  let list = await db.getAll();

  list.map((l) => {
    l.display_name = `${l.FIRST_NAME} ${l.LAST_NAME}`;
    l.IS_ADMIN = l.IS_ADMIN == "Y";
  });

  return res.json({ data: list });
});
