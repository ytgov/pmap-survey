import express, { Request, Response } from "express";
import { SettingService } from "../services";
import { ReturnValidationErrors } from "../middleware";
import { param, body } from "express-validator";

export const adminSettingRouter = express.Router();
const db = new SettingService();

adminSettingRouter.get("/", async (req: Request, res: Response) => {
  const list = await db.getAll();
  return res.json({ data: list });
});

adminSettingRouter.get(
  "/:id",
  [param("id").isInt()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const setting = await db.getById(id);

    if (!setting) {
      return res.status(404).json({ error: "Setting not found" });
    }

    return res.json({ data: setting });
  }
);

adminSettingRouter.get(
  "/key/:key",
  [param("key").isString().notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const key = req.params.key;
    const setting = await db.getByKey(key);

    return res.json({ data: setting || null });
  }
);

adminSettingRouter.put(
  "/key/:key",
  [param("key").isString().notEmpty(), body("VALUE").optional()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const key = req.params.key;
    const { VALUE } = req.body;

    const existing = await db.getByKey(key);

    if (existing) {
      await db.update(existing.ID, { VALUE });
    } else {
      await db.create({ KEY: key, VALUE });
    }

    return res.json({
      messages: [{ variant: "success", text: "Setting saved" }],
    });
  }
);

adminSettingRouter.get(
  "/survey/:sid",
  [param("sid").isInt()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const sid = parseInt(req.params.sid);
    const list = await db.getBySurvey(sid);
    return res.json({ data: list });
  }
);

adminSettingRouter.get(
  "/question/:qid",
  [param("qid").isInt()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const qid = parseInt(req.params.qid);
    const list = await db.getByQuestion(qid);
    return res.json({ data: list });
  }
);

adminSettingRouter.post(
  "/",
  [body("KEY").notEmpty().isString()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const { SID, QID, KEY, VALUE } = req.body;

    const result = await db.create({ SID, QID, KEY, VALUE });

    return res.json({
      data: { ID: result[0] },
      messages: [{ variant: "success", text: "Setting created" }],
    });
  }
);

adminSettingRouter.put(
  "/:id",
  [param("id").isInt()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { SID, QID, KEY, VALUE } = req.body;

    const existing = await db.getById(id);

    if (!existing) {
      return res.status(404).json({ error: "Setting not found" });
    }

    await db.update(id, { SID, QID, KEY, VALUE });

    return res.json({
      messages: [{ variant: "success", text: "Setting updated" }],
    });
  }
);

adminSettingRouter.delete(
  "/:id",
  [param("id").isInt()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    const existing = await db.getById(id);

    if (!existing) {
      return res.status(404).json({ error: "Setting not found" });
    }

    await db.delete(id);

    return res.json({
      messages: [{ variant: "success", text: "Setting deleted" }],
    });
  }
);
