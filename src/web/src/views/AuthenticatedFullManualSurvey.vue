<template>
  <div class="hello" v-if="survey && survey.survey">
    <!-- SurveyHeader v-model="moveOn" /> -->
    <h1>{{ survey.survey.NAME }} : <small>Survey Response Manual Entry</small></h1>
    <v-card v-if="survey.demographics && survey.demographics.length > 0" class="default">
      <v-card-text>
        <div>
          <h4 class="mb-3">Demographics</h4>

          <div v-for="demographic of survey.demographics">
            <v-text-field :label="demographic.DEMOGRAPHIC" v-model="demographic.TVALUE" />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-divider class="my-4" />

    <!-- <div v-if="moveOn"> -->
    <QuestionsRenderer v-model="allValid" />

    <v-btn color="primary" :disabled="!allValid" @click="submitSurvey"> Submit </v-btn>

    <span style="font-size: 0.9rem" class="pl-4 text-error" v-if="!allValid">
      * Not all required questions have answers (look for the red asterisks next to the question)
    </span>
    <!-- </div> -->
    <Notifications ref="notify"></Notifications>
  </div>
</template>

<script>
import axios from "axios";
import { clone } from "lodash";
import { mapActions, mapState } from "pinia";

import { AuthHelper } from "@/plugins/auth";
import { useSurveyStore } from "@/store/SurveyStore";
import { SURVEY_URL } from "@/urls";
import { useApiStore } from "@/store/ApiStore";

export default {
  name: "Login",
  data: () => ({
    surveyId: "",
    allValid: false,
  }),
  computed: {
    ...mapState(useSurveyStore, ["survey"]),

    allValidAndEmail() {
      return this.allValid;
    },
  },
  mounted() {
    this.surveyId = this.$route.params.token;

    this.loadFullManualSurvey(this.surveyId).catch((msg) => {
      console.log("ERROR ON SURVEY GET: ", msg);
      this.$router.push(`/survey/not-found`);
    });
  },
  methods: {
    ...mapActions(useSurveyStore, ["loadFullManualSurvey"]),

    submitSurvey() {
      if (this.allValidAndEmail) {
        let qs = [];
        for (let sq of this.survey.questions) {
          let q = clone(sq);
          delete q.ASK;
          delete q.RANGE;
          delete q.SELECTION_JSON;
          delete q.OPTIONAL;
          delete q.ORD;
          delete q.SID;
          delete q.TYPE;
          qs.push(q);
        }

        let agentEmail = AuthHelper.user.value?.email;

        const api = useApiStore();
        api
          .secureCall("POST", `${SURVEY_URL}/${agentEmail}/manual/${this.surveyId}`, {
            questions: qs,
            demographics: this.survey.demographics,
          })
          .then(() => {
            this.$refs.notify.showSuccess("Survey submitted successfully");
            this.participantEmail = "";
            this.loadFullManualSurvey(this.surveyId);
          })
          .catch((msg) => {
            this.$refs.notify.showError(msg.response.data);
            console.log("ERROR", msg);
          });
      } else {
        this.$refs.notify.showError("Please fill out all required fields including the Participant email");
      }
    },
  },
};
</script>
