import express, { Request, Response } from "express";
import { requiresAdmin, ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";
import * as knex from "knex";
import { DB_CONFIG, DB_SCHEMA } from "../config";
import { makeToken } from "./admin-participant-router";
import { checkJwt, loadUser } from "../middleware/authz.middleware";

export const surveyRouter = express.Router();

surveyRouter.get(
  "/:token",
  [param("token").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const db = knex.knex(DB_CONFIG);
    let { token } = req.params;

    let participant = await db("PARTICIPANT")
      .withSchema(DB_SCHEMA)
      .join("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
      .where({ "PARTICIPANT.TOKEN": token })
      .whereNotNull("EMAIL")
      .select("PARTICIPANT.*")
      .first()
      .then((r) => r)
      .catch((err) => {
        console.log("DATABASE CONNECTION ERROR", err);
        res.status(500).send(err);
      });

    if (participant) {
      let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID: participant.SID }).first();
      let choices = await db("JSON_DEF").withSchema(DB_SCHEMA).where({ SID: participant.SID });
      let questions = await db("QUESTION").withSchema(DB_SCHEMA).where({ SID: participant.SID }).orderBy("ORD");

      for (let choice of choices) {
        choice.choices = JSON.parse(choice.SELECTION_JSON);
      }

      for (let q of questions) {
        q.conditions = await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA).where({ QID: q.QID });
        if (q.JSON_ID) {
          q.choices = choices.find((c) => c.JSON_ID == q.JSON_ID)?.choices;
        }
      }

      return res.json({ data: { survey, questions } });
    }

    res.status(404).send();
  }
);

surveyRouter.get(
  "/:token/agent",
  checkJwt,
  loadUser,
  [param("token").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const db = knex.knex(DB_CONFIG);
    let { token } = req.params;
    token = token.substring(0, 64);

    let participant = await db("PARTICIPANT")
      .withSchema(DB_SCHEMA)
      .join("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
      .where({ "PARTICIPANT.TOKEN": token })
      .whereNotNull("EMAIL")
      .select("PARTICIPANT.*")
      .first()
      .then((r) => r)
      .catch((err) => {
        console.log("DATABASE CONNECTION ERROR", err);
        res.status(500).send(err);
      });

    if (participant) {
      let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID: participant.SID }).first();
      let choices = await db("JSON_DEF").withSchema(DB_SCHEMA).where({ SID: participant.SID });
      let questions = await db("QUESTION").withSchema(DB_SCHEMA).where({ SID: participant.SID }).orderBy("ORD");

      if (survey.ALLOW_AUDIT != 1) {
        return res.status(404).send();
      }

      for (let choice of choices) {
        choice.choices = JSON.parse(choice.SELECTION_JSON);
      }

      for (let q of questions) {
        q.conditions = await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA).where({ QID: q.QID });
        if (q.JSON_ID) {
          q.choices = choices.find((c) => c.JSON_ID == q.JSON_ID)?.choices;
        }
      }

      return res.json({ data: { survey, questions } });
    }

    res.status(404).send();
  }
);

surveyRouter.get(
  "/:token/manual",
  checkJwt,
  loadUser,
  [param("token").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const db = knex.knex(DB_CONFIG);
    let { token } = req.params;
    token = token.substring(0, 64);

    let participant = await db("PARTICIPANT")
      .withSchema(DB_SCHEMA)
      .join("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
      .where({ "PARTICIPANT.TOKEN": token })
      .whereNotNull("EMAIL")
      .select("PARTICIPANT.*")
      .first()
      .then((r) => r)
      .catch((err) => {
        console.log("DATABASE CONNECTION ERROR", err);
        res.status(500).send(err);
      });

    if (participant) {
      let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID: participant.SID }).first();
      let choices = await db("JSON_DEF").withSchema(DB_SCHEMA).where({ SID: participant.SID });
      let questions = await db("QUESTION").withSchema(DB_SCHEMA).where({ SID: participant.SID }).orderBy("ORD");

      for (let choice of choices) {
        choice.choices = JSON.parse(choice.SELECTION_JSON);
      }

      for (let q of questions) {
        q.conditions = await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA).where({ QID: q.QID });
        if (q.JSON_ID) {
          q.choices = choices.find((c) => c.JSON_ID == q.JSON_ID)?.choices;
        }
      }

      return res.json({ data: { survey, questions } });
    }

    res.status(404).send();
  }
);

surveyRouter.get(
  "/:token/manual-entry",
  checkJwt,
  loadUser,
  requiresAdmin,
  [param("token").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const db = knex.knex(DB_CONFIG);
    let { token } = req.params;

    let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID: token }).first();
    let choices = await db("JSON_DEF").withSchema(DB_SCHEMA).where({ SID: token });

    for (let choice of choices) {
      choice.choices = JSON.parse(choice.SELECTION_JSON);
    }

    if (survey) {
      let questions = await db("QUESTION").withSchema(DB_SCHEMA).where({ SID: token }).orderBy("ORD");

      for (let q of questions) {
        q.conditions = await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA).where({ QID: q.QID });
        if (q.JSON_ID) {
          q.choices = choices.find((c) => c.JSON_ID == q.JSON_ID)?.choices;
        }
      }

      const demographics = await db("SURVEY_DEMOGRAPHIC").withSchema(DB_SCHEMA).where({ SID: token });

      return res.json({ data: { survey, questions, demographics } });
    }
    res.status(404).send();
  }
);

surveyRouter.get(
  "/:token/preview",
  [param("token").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const db = knex.knex(DB_CONFIG);
    let { token } = req.params;

    let survey = await db("SURVEY").withSchema(DB_SCHEMA).where({ SID: token }).first();
    let choices = await db("JSON_DEF").withSchema(DB_SCHEMA).where({ SID: token });

    for (let choice of choices) {
      choice.choices = JSON.parse(choice.SELECTION_JSON);
    }

    if (survey) {
      let questions = await db("QUESTION").withSchema(DB_SCHEMA).where({ SID: token }).orderBy("ORD");

      for (let q of questions) {
        q.conditions = await db("Q_CONDITION_TBL").withSchema(DB_SCHEMA).where({ QID: q.QID });
        if (q.JSON_ID) {
          q.choices = choices.find((c) => c.JSON_ID == q.JSON_ID)?.choices;
        }
      }

      return res.json({ data: { survey, questions } });
    }
    res.status(404).send();
  }
);

surveyRouter.post(
  "/:agentEmail/:token",
  checkJwt,
  loadUser,
  [param("token").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const db = knex.knex(DB_CONFIG);
    let { token, agentEmail } = req.params;
    let { questions, contact } = req.body;

    token = token.substring(0, 64);

    let participant = await db("PARTICIPANT")
      .withSchema(DB_SCHEMA)
      .join("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
      .where({ "PARTICIPANT.TOKEN": token })
      .whereNotNull("EMAIL")
      .select("PARTICIPANT.*", "PARTICIPANT_DATA.EMAIL")
      .first();

    if (participant) {
      for (let question of questions) {
        let id = question.QID;
        let answer = question.answer;
        let answer_text = question.answer_text;

        let ans: any = {
          TOKEN: token,
          QID: id,
        };

        let nvalTest = parseFloat(`${ans.NVALUE}`);

        if (isFinite(nvalTest)) ans.NVALUE = answer;
        else if (Array.isArray(answer)) ans.TVALUE = JSON.stringify(answer);
        else ans.TVALUE = answer;

        if (answer_text && answer_text.length > 0) {
          ans.TVALUE = answer_text;
        }

        await db("RESPONSE_LINE").withSchema(DB_SCHEMA).insert(ans);
      }

      await db("PARTICIPANT_DATA")
        .withSchema(DB_SCHEMA)
        .where({ TOKEN: token })
        .update({ EMAIL: null, RESPONSE_DATE: new Date() });

      await db("ONBEHALF_AUDIT")
        .withSchema(DB_SCHEMA)
        .insert({ TOKEN: token, ONBEHALF_USER: agentEmail, DATE_FILLED: new Date() });

      if (contact) {
        await db("CONTACT_REQUEST").withSchema(DB_SCHEMA).insert({
          SID: participant.SID,
          REQUEST_EMAIL: participant.EMAIL,
          EMAILED_CHECK: "N",
        });
      }

      return res.json({ data: {}, messages: [{ variant: "success" }] });
    }

    res.status(404).send("Sorry, it appears that you have already completed this survey.");
  }
);

surveyRouter.post(
  "/:agentEmail/manual/:surveyId",
  checkJwt,
  loadUser,
  requiresAdmin,
  [param("surveyId").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const db = knex.knex(DB_CONFIG);
    let { surveyId, agentEmail } = req.params;
    let { questions, demographics } = req.body;

    const token = makeToken("ME");
    const SID = surveyId.replace(/[a-zA-Z]/g, "");

    await db("PARTICIPANT").withSchema(DB_SCHEMA).insert({ TOKEN: token, SID, CREATE_DATE: new Date() });
    await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).insert({ TOKEN: token, EMAIL: null, RESPONSE_DATE: new Date() });

    for (let question of questions) {
      let id = question.QID;
      let answer = question.answer;
      let answer_text = question.answer_text;

      let ans: any = {
        TOKEN: token,
        QID: id,
      };

      let nvalTest = parseFloat(`${ans.NVALUE}`);

      if (isFinite(nvalTest)) ans.NVALUE = answer;
      else if (Array.isArray(answer)) ans.TVALUE = JSON.stringify(answer);
      else ans.TVALUE = answer;

      if (answer_text && answer_text.length > 0) {
        ans.TVALUE = answer_text;
      }

      await db("RESPONSE_LINE").withSchema(DB_SCHEMA).insert(ans);
    }

    if (demographics) {
      for (let demo of demographics) {
        await db("PARTICIPANT_DEMOGRAPHIC")
          .withSchema(DB_SCHEMA)
          .insert({ TOKEN: token, DEMOGRAPHIC: demo.DEMOGRAPHIC, TVALUE: demo.TVALUE });
      }
    }

    await db("ONBEHALF_AUDIT")
      .withSchema(DB_SCHEMA)
      .insert({ TOKEN: token, ONBEHALF_USER: agentEmail, DATE_FILLED: new Date() });

    return res.json({ data: {}, messages: [{ variant: "success" }] });
  }
);

surveyRouter.post(
  "/:token",
  [param("token").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const db = knex.knex(DB_CONFIG);
    let { token } = req.params;
    let { questions, contact } = req.body;

    let participant = await db("PARTICIPANT")
      .withSchema(DB_SCHEMA)
      .join("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
      .where({ "PARTICIPANT.TOKEN": token })
      .whereNotNull("EMAIL")
      .select("PARTICIPANT.*", "PARTICIPANT_DATA.EMAIL")
      .first();

    if (participant) {
      for (let question of questions) {
        let id = question.QID;
        let answer = question.answer;
        let answer_text = question.answer_text;

        let ans: any = {
          TOKEN: token,
          QID: id,
        };

        let nvalTest = parseFloat(`${ans.NVALUE}`);

        if (isFinite(nvalTest)) ans.NVALUE = answer;
        else if (Array.isArray(answer)) ans.TVALUE = JSON.stringify(answer);
        else ans.TVALUE = answer;

        if (answer_text && answer_text.length > 0) {
          ans.TVALUE = answer_text;
        }

        await db("RESPONSE_LINE").withSchema(DB_SCHEMA).insert(ans);
      }

      await db("PARTICIPANT_DATA")
        .withSchema(DB_SCHEMA)
        .where({ TOKEN: token })
        .update({ EMAIL: null, RESPONSE_DATE: new Date() });

      if (contact) {
        await db("CONTACT_REQUEST").withSchema(DB_SCHEMA).insert({
          SID: participant.SID,
          REQUEST_EMAIL: participant.EMAIL,
          EMAILED_CHECK: "N",
        });
      }

      return res.json({ data: {}, messages: [{ variant: "success" }] });
    }

    res.status(404).send("Sorry, it appears that you have already completed this survey.");
  }
);

// This route is only temporary to test for submissions
surveyRouter.get(
  "/:token/answers",
  [param("token").notEmpty()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    const db = knex.knex(DB_CONFIG);
    let { token } = req.params;
    let answers = await db("RESPONSE_LINE").withSchema(DB_SCHEMA).where({ TOKEN: token });
    return res.json({ data: answers });
  }
);
