import express, { Request, Response } from "express";
import { db } from "../data";
import moment from "moment";

export const surveyRouter = express.Router();

surveyRouter.get("/",
    async (req: Request, res: Response) => {
        let list = await db("asset_scan").where({ scan_user: req.user.email }).orderBy("scan_date", "desc");

        for (let item of list) {
            item.scan_date = moment(item.scan_date).utc(true).format("YYYY-MM-DD @ h:mm a");
            item.description = item.scan_value;
        }

        return res.json({ data: list });
    });
