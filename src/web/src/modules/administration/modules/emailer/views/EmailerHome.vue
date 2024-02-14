<template>
  <v-breadcrumbs
    :items="breadcrumbs"
    bg-color="#7A9A01"
    style="margin: -13px -16px 10px -16px"
    class="pl-4 mb-4"
    color="white"
    active-color="#fff">
    <template v-slot:prepend>
      <v-icon color="white" icon="mdi-home"></v-icon>
    </template>
    <template v-slot:divider>
      <v-icon color="white" icon="mdi-chevron-right"></v-icon>
    </template>
  </v-breadcrumbs>

  <h1>Emailer</h1>

  <base-card showHeader="" heading="" class="py-3" elevation="0">
    <template v-slot:left>
      <!--  <v-text-field
        v-model="search"
        label="Search"
        single-line
        hide-details
        append-inner-icon="mdi-magnify"
        density="compact"
        class="ml-2"></v-text-field> -->
    </template>
    <template v-slot:right>
      <!-- <v-btn color="primary" variant="tonal" size="small" class="mr-5">Send</v-btn> -->
    </template>

    <v-row>
      <v-col cols="12" md="8">
        <v-select
          return-object
          v-model="question"
          density="comfortable"
          variant="outlined"
          label="Question"
          :items="questions"
          @update:model-value="questionChange"
          item-title="TITLE"></v-select>

        <v-row>
          <v-col cols="12" md="4">
            <v-checkbox
              v-model="email.recipients"
              value="Opinionators"
              :label="`Opinionators (${opinionators.length})`"
              density="comfortable"
              variant="outlined"
              hide-details
              rows="3"></v-checkbox>
          </v-col>
          <v-col>
            <v-checkbox
              v-model="email.recipients"
              value="Raters"
              :label="`Raters (${raters.length})`"
              density="comfortable"
              variant="outlined"
              hide-details
              rows="3"></v-checkbox>
          </v-col>
        </v-row>

        <v-divider class="my-3 mb-5" />

        <!--  <div class="d-flex">
      <v-btn color="info" size="small" class="mb-5 mt-4 mr-5" @click="parsed = true">Parse participants</v-btn>
      <v-label v-if="parsed">Found 2 valid emails</v-label>
    </div> -->

        <v-text-field v-model="email.subject" label="Subject" density="comfortable" variant="outlined"></v-text-field>
        <v-textarea
          v-model="email.body"
          label="Email body"
          density="comfortable"
          variant="outlined"
          rows="3"></v-textarea>

        <ul>
          <li>Use <b>``SURVEY_URL``</b> for link to Opinionator page</li>
          <li>Use <b>``RATING_URL``</b> for link to Rater page</li>
          <li>Use <b>``INSPIRE_URL``</b> for link to Inspire page</li>
          <li>Use <b>``RESULTS_URL``</b> for link to Results page</li>
        </ul>

        <v-label></v-label>
        <v-label></v-label>

        <div class="d-flex">
          <v-btn color="primary" :disabled="!emailValid" @click="sendTestClick">Send Test</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="warning" :disabled="!emailValid" @click="sendEmailClick">Send to Participants</v-btn>
        </div></v-col
      >
      <v-divider vertical />
      <v-col>
        <v-card elevation="0" variant="tonal" color="#F2A900">
          <v-card-title>Event Log</v-card-title>

          <v-list>
            <div v-for="(event, idx) of eventLog">
              <v-list-item :title="event.TITLE" :subtitle="formatSubtitle(event)"> </v-list-item>
              <v-divider v-if="idx < eventLog.length - 1" />
            </div>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </base-card>
</template>
<script lang="ts">
import { mapActions, mapState, mapWritableState } from "pinia";
import { useEmailerStore, Event } from "../store";

import moment from "moment";
import { useParticipantsStore } from "../../participants/store";
//import { QuestionState } from "../../survey/store";

export default {
  data: () => ({
    headers: [
      { title: "Title", key: "TITLE" },
      { title: "Owner", key: "OWNER" },
      { title: "State", key: "STATE" },
      { title: "Current Tranche", key: "CURRENT_RATING_TRANCHE" },
    ],
    parsed: false,
    search: "",
  }),
  computed: {
    ...mapState(useEmailerStore, ["questions", "isLoading", "eventLog", "emailValid"]),
    ...mapWritableState(useEmailerStore, ["question", "email"]),
    ...mapState(useParticipantsStore, ["opinionators", "raters"]),

    items() {
      let validStatesForEmail = [ 1
       /*  QuestionState.Inspire,        QuestionState.Opinionate,
        QuestionState.Publish,
        QuestionState.Rate, */
      ];

      if (this.questions) {
        return this.questions.filter((q) => validStatesForEmail.includes(q.STATE));
      }
      return [];
    },
    breadcrumbs() {
      return [
        {
          title: "Administration",
          to: "/administration",
        },
        {
          title: "Emailer",
        },
      ];
    },
  },
  watch: {
    question: async function (n, o) {
      await this.loadEvents();
    },
  },
  beforeMount() {
    this.loadItems();
  },
  unmounted() {
    this.unselectEmailer();
    this.unselect();
  },
  methods: {
    ...mapActions(useEmailerStore, ["loadQuestions", "select", "loadEvents", "sendTest", "sendEmail"]),
    ...mapActions(useEmailerStore, { unselectEmailer: "unselect" }),
    ...mapActions(useParticipantsStore, ["getParticipants", "unselect"]),

    async loadItems() {
      await this.loadQuestions();
    },
    formatSubtitle(item: Event) {
      return `${moment(item.CREATE_DATE).format("YYYY-MM-DD @ h:mm A")} by ${item.user.display_name}`;
    },
    async sendTestClick() {
      await this.sendTest();
    },
    async sendEmailClick() {
      await this.sendEmail();
    },
    async questionChange() {
      console.log("QUESTION IS", this.question);
      if (this.question && this.question.ID) {
        let parts = await this.getParticipants(this.question.ID);

        console.log(parts);
      }
    },
  },
};
</script>
