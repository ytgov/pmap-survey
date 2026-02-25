import express, { Request, Response } from "express";
import { DirectoryService, UserService } from "../services";
import { UserStatus } from "../data/models";
import { requireAdminOrOwner, requiresAdmin, ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";

export const userRouter = express.Router();
const db = new UserService();

userRouter.get("/me", async (req: Request, res: Response) => {
  return res.json({ data: { ...req.user, surveys: await db.getSurveysByEmail(req.user.EMAIL) } });
});

userRouter.get("/", requireAdminOrOwner, async (req: Request, res: Response) => {
  let list = await db.getAll();

  if (req.user.IS_ADMIN == "N") {
    return res.json({ data: [req.user] });
  }

  for (let l of list) {
    l.display_name = `${l.FIRST_NAME} ${l.LAST_NAME}`;
    l.IS_ADMIN = l.IS_ADMIN == "Y";
    l.surveys = await db.getSurveysByEmail(l.EMAIL);
  }

  return res.json({ data: list });
});

userRouter.post("/", requiresAdmin, async (req: Request, res: Response) => {
  let { user } = req.body;

  if (user) {
    let existing = await db.getByEmail(user.email.toLowerCase());

    if (existing) {
      return res.json({ data: { error: [{ text: "User already exists", variant: "error" }] } });
    }

    try {
      await db.create({
        EMAIL: user.email,
        USER_ID: "SUB_MISSING",
        STATUS: UserStatus.ACTIVE,
        FIRST_NAME: user.first_name,
        LAST_NAME: user.last_name,
        IS_ADMIN: "N",
        ROLE: "",
        CREATE_DATE: new Date(),
      });
    } catch (error) {
      console.error("Failed to create user:", error);
      return res.status(500).json({
        data: { error: [{ text: "Failed to create user", variant: "error" }] },
      });
    }
  }
  return res.json({});
});

userRouter.put(
  "/:email",
  requiresAdmin,
  [param("email").notEmpty().isString()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    let { email } = req.params;
    let { STATUS, IS_ADMIN, ROLE, surveys } = req.body;

    let existing = await db.getByEmail(email);

    if (existing) {
      existing.STATUS = STATUS;
      existing.IS_ADMIN = IS_ADMIN ? "Y" : "N";
      existing.ROLE = IS_ADMIN ? null : ROLE;

      if (STATUS == "Inactive") {
        existing.IS_ADMIN = "N";
        existing.ROLE = "";
      }

      await db.update(email, existing);
      await db.clearSurveysByEmail(email);

      if (!IS_ADMIN && STATUS == "Active") {
        await db.setSurveysByEmail(email, surveys);
      }

      return res.json({
        messages: [{ variant: "success", text: "User saved" }],
      });
    }

    res.status(404).send();
  },
);

userRouter.post("/search-directory", async (req: Request, res: Response) => {
  let { terms } = req.body;

  let directoryService = new DirectoryService();
  await directoryService.connect();
  let results = await directoryService.search(terms);

  return res.json({ data: results });
});
