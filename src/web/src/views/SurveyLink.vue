<template>
  <div class="hello" v-if="survey && survey.survey">
    <SurveyHeader v-model="moveOn" />

    <div v-if="moveOn">
      <QuestionsRenderer v-model="allValid" />

      <v-btn color="primary" :disabled="!allValid" @click="submitSurvey"> Submit </v-btn>

      <span style="font-size: 0.9rem" class="pl-4 text-error" v-if="!allValid">
        * Not all required questions have answers (look for the red asterisks next to the question)
      </span>
    </div>
    <Notifications ref="notify"></Notifications>
  </div>
</template>

<script>
import axios from "axios";
import { clone } from "lodash";
import { mapActions, mapState } from "pinia";

import { useSurveyStore } from "@/store/SurveyStore";
import { SURVEY_URL } from "@/urls";

export default {
  name: "Login",
  data: () => ({
    surveyId: "",
    moveOn: false,
    allValid: false,
    contactMe: false,
  }),
  computed: {
    ...mapState(useSurveyStore, ["survey"]),
  },
  mounted() {
    this.surveyId = this.$route.params.token;

    this.loadSurveyLink(this.surveyId).catch((msg) => {
      console.log("ERROR ON SURVEY GET: ", msg);
      this.$router.push(`/survey/not-found`);
    });
  },
  methods: {
    ...mapActions(useSurveyStore, ["loadSurveyLink"]),

    submitSurvey() {
      if (this.allValid) {
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

        // this is used to pass the dynamic demographic group values
        const query = this.$route.fullPath.replace(this.$route.path, "");

        axios
          .post(`${SURVEY_URL}/survey-link/${this.surveyId}${query}`, {
            questions: qs,
            contact: this.contactMe,
          })
          .then(() => {
            this.$router.push("/survey/complete");
          })
          .catch((msg) => {
            this.$refs.notify.showError(msg.response.data);
            console.log("ERROR", msg);
          });
      }
    },
  },
};
</script>
