import express, { Request, Response } from "express";
import { db } from "../data";
import { DB_SCHEMA } from "../config";
import { UserService } from "../services";
import { InsertableDate } from "../utils/formatters";

export const adminSurveyLinkRouter = express.Router();
const userService = new UserService();

adminSurveyLinkRouter.get("/", async (req: Request, res: Response) => {
  let links = await db("SURVEY_LINK").withSchema(DB_SCHEMA).orderBy("SID", "DEMOGRAPHIC_GROUP_ID");
  let allGroups = await db("DEMOGRAPHIC_GROUP").withSchema(DB_SCHEMA);
  let allGroupValues = await db("DEMOGRAPHIC_GROUP_VALUE").withSchema(DB_SCHEMA);
  let allSurveys = await db("SURVEY").withSchema(DB_SCHEMA);

  for (let item of links) {
    item.group = allGroups.find((r) => r.ID == item.DEMOGRAPHIC_GROUP_ID);

    if (item.group) {
      item.group.values = allGroupValues.filter((r) => r.DEMOGRAPHIC_GROUP_ID == item.group.ID);
    }
    item.survey = allSurveys.find((s) => s.SID == item.SID);
  }

  let surveys = await userService.getSurveysByEmail(req.user.EMAIL);

  if (req.user.IS_ADMIN == "N") links = links.filter((link) => surveys.includes(link.SID));

  res.json({ data: links });
});

adminSurveyLinkRouter.get("/:ID", async (req: Request, res: Response) => {
  let { ID } = req.params;
  let group = await db("SURVEY_LINK").withSchema(DB_SCHEMA).where({ ID }).first();
  res.json({ data: group });
});

adminSurveyLinkRouter.post("/", async (req: Request, res: Response) => {
  let { surveyId, groupId, endDate } = req.body;

  let newItem = await db("SURVEY_LINK")
    .withSchema(DB_SCHEMA)
    .insert({
      SID: surveyId,
      DEMOGRAPHIC_GROUP_ID: groupId,
      SL_TOKEN: makeToken(),
      END_DATE: InsertableDate(endDate),
    })
    .returning("*");
  res.json({ data: newItem[0] });
});

adminSurveyLinkRouter.put("/:ID", async (req: Request, res: Response) => {
  let { ID } = req.params;
  let { NAME, SID, values } = req.body;

  await db("SURVEY_LINK").withSchema(DB_SCHEMA).where({ ID }).update({
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

adminSurveyLinkRouter.delete("/:ID", async (req: Request, res: Response) => {
  let { ID } = req.params;

  try {
    await db("SURVEY_LINK").withSchema(DB_SCHEMA).where({ ID }).delete();
    return res.json({ data: "success" });
  } catch (err) {
    console.log("ERROR DELETING GROUP", err);
    return res.json({ data: err });
  }
});

function makeToken(): string {
  const chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
  const randomArray = Array.from({ length: 64 }, (v, k) => chars[Math.floor(Math.random() * chars.length)]);

  let location = Math.floor(Math.random() * 25);
  let randomString = `${randomArray.join("")}`;
  randomString = randomString.replace(/^_/, "");

  return `${randomString.substring(location + 6, 48)}`;
}
