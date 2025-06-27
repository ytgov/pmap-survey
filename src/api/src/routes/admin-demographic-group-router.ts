import express, { Request, Response } from "express";
import { db } from "../data";
import { ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";
import { DB_SCHEMA } from "../config";
import { UserService } from "../services";

const userService = new UserService();
export const adminDemographicGroupRouter = express.Router();

adminDemographicGroupRouter.get("/", async (req: Request, res: Response) => {
  let groups = await db("DEMOGRAPHIC_GROUP").withSchema(DB_SCHEMA).orderBy("SID", "NAME");
  let allValues = await db("DEMOGRAPHIC_GROUP_VALUE").withSchema(DB_SCHEMA).orderBy("DEMOGRAPHIC");
  let allSurveys = await db("SURVEY").withSchema(DB_SCHEMA);

  for (let item of groups) {
    item.values = allValues.filter((r) => r.DEMOGRAPHIC_GROUP_ID == item.ID);
    item.survey = allSurveys.find((s) => s.SID == item.SID);
  }

  let surveys = await userService.getSurveysByEmail(req.user.EMAIL);

  if (req.user.IS_ADMIN == "N") groups = groups.filter((link) => surveys.includes(link.SID));

  res.json({ data: groups });
});

adminDemographicGroupRouter.get("/demographics", async (req: Request, res: Response) => {
  let groups = await db("DEMOGRAPHIC_TYPE").withSchema(DB_SCHEMA).where({ DG_ABLE: "Y" }).orderBy("DEMOGRAPHIC");
  res.json({ data: groups });
});

adminDemographicGroupRouter.get("/:ID", async (req: Request, res: Response) => {
  let { ID } = req.params;
  let group = await db("DEMOGRAPHIC_GROUP").withSchema(DB_SCHEMA).where({ ID }).first();
  res.json({ data: group });
});

adminDemographicGroupRouter.post("/", async (req: Request, res: Response) => {
  let { NAME, SID } = req.body;
  let newItem = await db("DEMOGRAPHIC_GROUP")
    .withSchema(DB_SCHEMA)
    .insert({
      NAME,
      SID,
    })
    .returning("*");
  res.json({ data: newItem[0] });
});

adminDemographicGroupRouter.put("/:ID", async (req: Request, res: Response) => {
  let { ID } = req.params;
  let { NAME, SID, values } = req.body;

  await db("DEMOGRAPHIC_GROUP").withSchema(DB_SCHEMA).where({ ID }).update({
    NAME,
    SID,
  });

  await db("DEMOGRAPHIC_GROUP_VALUE").withSchema(DB_SCHEMA).where({ DEMOGRAPHIC_GROUP_ID: ID }).delete();

  if (values && values.length > 0) {
    for (const value of values) {
      delete value.ID;
      await db("DEMOGRAPHIC_GROUP_VALUE").withSchema(DB_SCHEMA).insert(value);
    }
  }

  res.json({ data: "success" });
});

adminDemographicGroupRouter.delete("/:ID", async (req: Request, res: Response) => {
  let { ID } = req.params;

  try {
    await db("DEMOGRAPHIC_GROUP_VALUE").withSchema(DB_SCHEMA).where({ DEMOGRAPHIC_GROUP_ID: ID }).delete();
    await db("DEMOGRAPHIC_GROUP").withSchema(DB_SCHEMA).where({ ID }).delete();
    return res.json({ data: "success" });
  } catch (err) {
    console.log("ERROR DELETING GROUP", err);
    return res.json({ data: err });
  }
});

adminDemographicGroupRouter.post("/:ID/value", async (req: Request, res: Response) => {
  let { ID } = req.params;
  let { DEMOGRAPHIC, NVALUE, TVALUE } = req.body;

  await db("DEMOGRAPHIC_GROUP_VALUE").withSchema(DB_SCHEMA).insert({
    DEMOGRAPHIC,
    NVALUE,
    TVALUE,
    DEMOGRAPHIC_GROUP_ID: ID,
  });
  res.json({ data: "success" });
});

adminDemographicGroupRouter.put("/:ID/value/:VID", async (req: Request, res: Response) => {
  let { ID, VID } = req.params;
  let { DEMOGRAPHIC, NVALUE, TVALUE } = req.body;

  await db("DEMOGRAPHIC_GROUP_VALUE").withSchema(DB_SCHEMA).where({ VID }).update({ DEMOGRAPHIC, NVALUE, TVALUE });
  res.json({ data: "success" });
});

adminDemographicGroupRouter.delete(
  "/:ID/value/:VID",
  param("VID").isInt(),
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    let { VID } = req.params;
    await db("DEMOGRAPHIC_GROUP_VALUE").withSchema(DB_SCHEMA).where({ VID }).delete();
    res.json({ data: "success" });
  }
);
