import { EmailService } from "./services/email-service.js"
import { SurveyService } from "./services/survey-service.js"
import * as config from "./config.js"
import inquirer from "inquirer";

const DRY_RUN = "Dry run";
const SEND_EMAILS = "Send emails";

const run = async () => {
    let service = new SurveyService();
    let surveyList = await service.getSurveysWithParticipants();

    if (surveyList.length == 0) {
        console.log("We didn't find ay active surveys - Exiting");
        process.exit();
    }

    let choices = surveyList.map(s => `(${s.SID}) ${s.NAME} - ${s.PARTICIPANT_COUNT} participants found`)

    let choice = await inquirer.prompt([{
        name: "pick",
        type: "list",
        message: "Which survey would you like to send emails for?",
        choices
    }]);

    let choiceId = choice.pick.substring(1, choice.pick.indexOf(")"))
    let selected = (surveyList.filter(s => s.SID === parseInt(choiceId)))[0];

    let send = await inquirer.prompt([{
        name: "pick",
        type: "list",
        message: "Do you want to send emails or do a dry run?",
        default: DRY_RUN,
        choices: [SEND_EMAILS, DRY_RUN]
    }]);

    let participants = await service.getParticipantsForSurvey(selected.SID)
    let mode = send.pick;

    if (mode == DRY_RUN) {
        console.log(participants)
    }
    else {
        let emailer = new EmailService();

        for (let p of participants) {
            let resp = await emailer.sendSurveyEmail(p);
            console.log(resp)
        }
    }


    // try and capture the status of the SMTP call

    process.exit();
}

run();
