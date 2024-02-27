import express, { Request, Response } from "express";
import { db } from "../data";
import { ReturnValidationErrors } from "../middleware";
import { param } from "express-validator";

export const adminParticipantRouter = express.Router();

adminParticipantRouter.get("/:SID", async (req: Request, res: Response) => {
  let { SID } = req.params;

  let list = await db("SRVT.PARTICIPANT_DATA")
    .innerJoin("SRVT.PARTICIPANT", "PARTICIPANT_DATA.TOKEN", "PARTICIPANT.TOKEN")
    .where("PARTICIPANT.SID", SID);

  res.json({ data: list });
});

adminParticipantRouter.post("/", async (req: Request, res: Response) => {
  let { addresses, survey } = req.body;

  let existingAddresses = await db("SRVT.PARTICIPANT_DATA")
    .innerJoin("SRVT.PARTICIPANT", "PARTICIPANT_DATA.TOKEN", "PARTICIPANT.TOKEN")
    .where("PARTICIPANT.SID", survey)
    .whereNotNull("EMAIL")
    .select("EMAIL");

  let existingList = existingAddresses.map((e) => e.EMAIL);

  for (let address of addresses) {
    if (existingList.includes(address)) continue;

    let token = makeToken();

    await db("SRVT.PARTICIPANT").insert({ TOKEN: token, SID: survey });
    await db("SRVT.PARTICIPANT_DATA").insert({ TOKEN: token, EMAIL: address });
  }

  res.json({ data: {} });
});

adminParticipantRouter.delete("/:TOKEN", async (req: Request, res: Response) => {
  let { TOKEN } = req.params;

  await db("SRVT.PARTICIPANT").where({ TOKEN }).delete();
  await db("SRVT.PARTICIPANT_DATA").where({ TOKEN }).delete();

  res.json({ data: {} });
});

function makeToken() {
  const chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
  const randomArray = Array.from({ length: 24 }, (v, k) => chars[Math.floor(Math.random() * chars.length)]);

  const randomString = randomArray.join("");
  return randomString;
}
