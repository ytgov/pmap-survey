import express, { Request, Response } from "express";
import { db } from "../data";
import { DB_SCHEMA } from "../config";

export const adminParticipantRouter = express.Router();

adminParticipantRouter.get("/:SID", async (req: Request, res: Response) => {
  let { SID } = req.params;

  let list = await db("PARTICIPANT_DATA")
    .withSchema(DB_SCHEMA)
    .innerJoin("PARTICIPANT", "PARTICIPANT_DATA.TOKEN", "PARTICIPANT.TOKEN")
    .where("PARTICIPANT.SID", SID);

  res.json({ data: list });
});

adminParticipantRouter.post("/", async (req: Request, res: Response) => {
  let { addresses, survey, fileData, prefix } = req.body;

  if (fileData && fileData.headers && fileData.headers.length > 0) {
    let demographicList = await db("DEMOGRAPHIC_TYPE").withSchema(DB_SCHEMA);
    let demographics = demographicList.map((d) => d.DEMOGRAPHIC);

    // remove the EMAIL header
    fileData.headers.shift();

    for (let records of fileData.records) {
      let existingAddresses = await db("PARTICIPANT_DATA")
        .withSchema(DB_SCHEMA)
        .innerJoin("PARTICIPANT", "PARTICIPANT_DATA.TOKEN", "PARTICIPANT.TOKEN")
        .where("PARTICIPANT.SID", survey)
        .whereNotNull("EMAIL")
        .select("EMAIL");

      let existingList = existingAddresses.map((e) => e.EMAIL);

      let email = records.shift();
      if (existingList.includes(email)) continue;

      let token = makeToken(prefix);

      let demographicInsert = [];

      for (let i = 0; i < fileData.headers.length; i++) {
        let header = fileData.headers[i];
        let value = records[i];

        let demo = header;
        if (!demographics.includes(demo)) return res.status(500).send(`Invalid demographic: ${demo}`);

        let nval = isNumeric(value) ? Number(value) : null;
        let tval = isNumeric(value) ? null : value;
        demographicInsert.push({ TOKEN: token, DEMOGRAPHIC: demo, NVALUE: nval, TVALUE: tval });
      }

      await db("PARTICIPANT").withSchema(DB_SCHEMA).insert({ TOKEN: token, SID: survey, CREATE_DATE: new Date() });
      await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).insert({ TOKEN: token, EMAIL: email });
      await db("PARTICIPANT_DEMOGRAPHIC").withSchema(DB_SCHEMA).insert(demographicInsert);
    }
  } else {
    for (let address of addresses) {
      let existingAddresses = await db("PARTICIPANT_DATA")
        .withSchema(DB_SCHEMA)
        .innerJoin("PARTICIPANT", "PARTICIPANT_DATA.TOKEN", "PARTICIPANT.TOKEN")
        .where("PARTICIPANT.SID", survey)
        .whereNotNull("EMAIL")
        .select("EMAIL");

      let existingList = existingAddresses.map((e) => e.EMAIL);
      if (existingList.includes(address)) continue;

      let token = makeToken(prefix);
      await db("PARTICIPANT").withSchema(DB_SCHEMA).insert({ TOKEN: token, SID: survey, CREATE_DATE: new Date() });
      await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).insert({ TOKEN: token, EMAIL: address });
    }
  }

  res.json({ data: {} });
});

adminParticipantRouter.delete("/:TOKEN", async (req: Request, res: Response) => {
  let { TOKEN } = req.params;

  await db("PARTICIPANT_DEMOGRAPHIC").withSchema(DB_SCHEMA).where({ TOKEN }).delete();
  await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).where({ TOKEN }).delete();
  await db("PARTICIPANT").withSchema(DB_SCHEMA).where({ TOKEN }).delete();

  res.json({ data: {} });
});

adminParticipantRouter.delete("/:SID/stale", async (req: Request, res: Response) => {
  let { SID } = req.params;

  let staleOnes = await await db("PARTICIPANT")
    .withSchema(DB_SCHEMA)
    .innerJoin("PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
    .whereNull("RESPONSE_DATE")
    .where({ SID });

  for (const stale of staleOnes) {
    await db("PARTICIPANT_DATA").withSchema(DB_SCHEMA).where({ TOKEN: stale.TOKEN }).update({ EMAIL: null });
  }

  res.json({ data: {} });
});

function makeToken(prefix: string) {
  const chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
  const randomArray = Array.from({ length: 64 }, (v, k) => chars[Math.floor(Math.random() * chars.length)]);

  let randomString = `${prefix}_${randomArray.join("")}`;
  randomString = randomString.replace(/^_/, "");
  return randomString.substring(0, 64);
}
function isNumeric(n: any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
