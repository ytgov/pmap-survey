<template>
  <div class="hello" v-if="survey && survey.survey">
    <SurveyHeader v-model="moveOn" />

    <div v-if="moveOn">
      <QuestionsRenderer v-model="allValid" />

      <ContactQuestionRenderer v-model="contactMe" />

      <v-btn color="primary" :disabled="!allValid" @click="submitSurvey"> Submit </v-btn>

      <span style="font-size: 0.9rem" class="pl-4 text-error" v-if="!allValid">
        * Not all required questions have answers (look for the red asterisks next to the question)
      </span>
    </div>
  </div>
  <Loader v-model="isLoading" />
</template>

<script>
import { clone } from "lodash";
import { mapActions, mapState } from "pinia";
import { useSurveyStore } from "@/store/SurveyStore";

export default {
  name: "Login",
  data: () => ({
    surveyId: "",
    moveOn: false,
    allValid: false,
    contactMe: false,
  }),
  computed: {
    ...mapState(useSurveyStore, ["survey", "isLoading"]),
  },
  mounted() {
    this.surveyId = this.$route.params.token;

    this.loadSurveyPreview(this.surveyId).catch((msg) => {
      console.log("ERROR ON SURVEY GET: ", msg);
      this.$router.push(`/survey/not-found`);
    });
  },
  methods: {
    ...mapActions(useSurveyStore, ["loadSurveyPreview"]),

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

        console.log("SUBMIT", qs);

        localStorage.clear();

        alert("Submitting does nothing on preview");
      }
    },
  },
};
</script>
