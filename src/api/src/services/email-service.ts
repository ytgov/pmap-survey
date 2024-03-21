import nodemailer, { Transporter, TransportOptions } from "nodemailer";
import { MailOptions } from "nodemailer/lib/json-transport";
import { MAIL_CONFIG, MAIL_FROM, NODE_ENV, FRONTEND_URL, APPLICATION_NAME, MAIL_CONFIG_DEV, API_PORT } from "../config";
import fs from "fs";
import path from "path";
import { RenderMarkdown } from "../utils/formatters";

const BASE_TEMPLATE = "../templates/base.html";

export class EmailService {
  TRANSPORT: Transporter;

  constructor() {
    if (NODE_ENV != "development") this.TRANSPORT = nodemailer.createTransport(MAIL_CONFIG as TransportOptions);
    else this.TRANSPORT = nodemailer.createTransport(MAIL_CONFIG_DEV as TransportOptions);
  }

  async sendSurveyEmail(participant: any, survey: any): Promise<any> {
    return this.sendEmail(
      participant.EMAIL,
      participant.TOKEN,
      `Please take the ${survey.NAME}`,
      survey.DESCRIPTION,
      survey.FROM_EMAIL
    );
  }

  async sendEmail(
    toEmail: string,
    token: string,
    subject: string,
    customContent: string,
    fromName: string = "PMAP Service"
  ): Promise<any> {
    let basePath = path.join(__dirname, BASE_TEMPLATE);
    let baseContent = fs.readFileSync(basePath).toString();

    baseContent = baseContent.replace(/{{API_PORT}}/, API_PORT);
    baseContent = baseContent.replace(/``APPLICATION_URL``/g, FRONTEND_URL);
    baseContent = baseContent.replace(/``APPLICATION_NAME``/g, APPLICATION_NAME);
    baseContent = baseContent.replace(/``TO_EMAIL``/g, toEmail);
    customContent = customContent.replace(/``SURVEY_URL``/g, `${FRONTEND_URL}/survey/${token}`);
    baseContent = baseContent.replace(/``CUSTOM_CONTENT``/, RenderMarkdown(customContent).output);

    let message: MailOptions = {
      from: fromName,
      to: `${toEmail}`,
      subject: `${subject}`,
      html: baseContent,
    };

    if (toEmail.length == 0) {
      console.log("Not sending email to " + toEmail + " without an email address");
      return null;
    }

    return this.TRANSPORT.sendMail(message).catch((err) => {
      console.log("ERROR Sending email");
    });
  }
}
