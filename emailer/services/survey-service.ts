import knex, { Knex } from "knex";
import { DB_CONFIG } from "../config.js";

export class SurveyService {
    readonly db: Knex

    constructor(username: string, password: string) {
        DB_CONFIG.connection.user = username;
        DB_CONFIG.connection.password = password;
        this.db = knex(DB_CONFIG as Knex.Config<any>);
    }

    async getSurveysWithParticipants(): Promise<any[]> {
        let t = await this.db.raw(`select "SURVEY"."SID", "SURVEY"."NAME", "SURVEY"."DESCRIPTION", count("PID") as "PARTICIPANT_COUNT" from "SRVT"."SURVEY"
        INNER JOIN "SRVT"."PARTICIPANT" ON "SURVEY"."SID" = "PARTICIPANT"."SID"
		INNER JOIN "SRVT"."PARTICIPANT_DATA" ON "PARTICIPANT"."TOKEN" = "PARTICIPANT_DATA"."TOKEN"
		WHERE "PARTICIPANT_DATA"."EMAIL" IS NOT NULL AND "PARTICIPANT_DATA"."RESENT_DATE" IS NULL
        GROUP BY "SURVEY"."SID", "SURVEY"."NAME", "SURVEY"."DESCRIPTION"`);
        return t.rows;
    }

    async getParticipantsForSurvey(sid: number): Promise<any> {
        return this.db("SRVT.PARTICIPANT").join("SRVT.PARTICIPANT_DATA", "PARTICIPANT.TOKEN", "PARTICIPANT_DATA.TOKEN")
            .where({ SID: sid }).whereNull("RESPONSE_DATE").whereNotNull("EMAIL").whereNull("RESENT_DATE")
            .select("EMAIL", "PARTICIPANT.TOKEN")
    }

    async recordSentDate(participant: any): Promise<any> {
        let token = participant.TOKEN;
        let data = await this.db("SRVT.PARTICIPANT_DATA").where({ "TOKEN": token }).first();

        if (data.SENT_DATE) {
            await this.db("SRVT.PARTICIPANT_DATA").where({ "TOKEN": token }).update({ "RESENT_DATE": new Date() });
        }
        else {
            await this.db("SRVT.PARTICIPANT_DATA").where({ "TOKEN": token }).update({ "SENT_DATE": new Date() });
        }

        return Promise.resolve(true);
    }
}
