import express, { Request, Response } from "express";
import { db } from "../data";
import { ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";

export const adminSurveyRouter = express.Router();

adminSurveyRouter.get("/", async (req: Request, res: Response) => {
  let list = await db("SRVT.SURVEY");

  for (let item of list) {
    item.questions = await db("SRVT.QUESTION").where({ SID: item.SID }).orderBy("ORD");
    item.choices = await db("SRVT.JSON_DEF").where({ SID: item.SID }).orderBy("TITLE");

    item.choices.map((c: any) => (c.choices = JSON.parse(c.SELECTION_JSON)));
  }

  res.json({ data: list });
});

adminSurveyRouter.post("/", async (req: Request, res: Response) => {
  let { CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE } = req.body;
  let newItem = await db("SRVT.SURVEY")
    .insert({ CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE })
    .returning("*");
  res.json({ data: newItem[0] });
});

adminSurveyRouter.put("/:SID/", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE } = req.body;

  await db("SRVT.SURVEY")
    .where({ SID })
    .update({ CONTACT_EMAIL, CONTACT_QUESTION, DESCRIPTION, NAME, PAGE_INTRO, PAGE_TITLE });

  res.json({ data: "success" });
});

adminSurveyRouter.delete("/:SID/", async (req: Request, res: Response) => {
  let { SID } = req.params;

  let hasParticipants = await db("SRVT.PARTICIPANT").where({ SID });

  if (hasParticipants.length > 0) {
    res.json({ data: "HAS Participatns" });
  } else {
    await db("SRVT.JSON_DEF").where({ SID }).delete();
    await db("SRVT.QUESTION").where({ SID }).delete();
    await db("SRVT.SURVEY").where({ SID }).delete();
    res.json({ data: "success" });
  }
});

adminSurveyRouter.get("/question-types", async (req: Request, res: Response) => {
  let list = await db("SRVT.QUESTION_TYPE");
  res.json({ data: list.map((i) => i.TYPE) });
});

adminSurveyRouter.post("/:SID/question", async (req: Request, res: Response) => {
  let { SID } = req.params;
  let { ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT, choices, choiceTitle } = req.body;

  if (JSON_ID == -1) {
    JSON_ID = null;

    let json = await db("SRVT.JSON_DEF")
      .insert({ TITLE: choiceTitle, SID, SELECTION_JSON: JSON.stringify(choices) })
      .returning("*");
    JSON_ID = json[0].JSON_ID;
  } else if (JSON_ID) {
    await db("SRVT.JSON_DEF")
      .where({ JSON_ID })
      .update({ TITLE: choiceTitle, SELECTION_JSON: JSON.stringify(choices) });
  }

  await db("SRVT.QUESTION").insert({ SID, ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT });
  res.json({ data: "success" });
});

adminSurveyRouter.put("/:SID/question/:QID", async (req: Request, res: Response) => {
  let { SID, QID } = req.params;
  let { ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT, choices, choiceTitle } = req.body;

  if (JSON_ID == -1) {
    JSON_ID = null;
    let json = await db("SRVT.JSON_DEF")
      .insert({ TITLE: choiceTitle, SID, SELECTION_JSON: JSON.stringify(choices) })
      .returning("*");
    JSON_ID = json[0].JSON_ID;
  } else if (JSON_ID) {
    await db("SRVT.JSON_DEF")
      .where({ JSON_ID })
      .update({ TITLE: choiceTitle, SELECTION_JSON: JSON.stringify(choices) });
  }

  await db("SRVT.QUESTION").where({ QID }).update({ ASK, OPTIONAL, ORD, TYPE, RANGE, GROUP_ID, JSON_ID, SELECT_LIMIT });
  res.json({ data: "success" });
});

adminSurveyRouter.delete(
  "/:SID/question/:QID",
  param("QID").isInt(),
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    let { QID } = req.params;
    await db("SRVT.QUESTION").where({ QID }).delete();
    res.json({ data: "success" });
  }
);
