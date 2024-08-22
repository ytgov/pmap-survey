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
    <v-select
      v-model="survey"
      density="comfortable"
      variant="outlined"
      label="Survey"
      :items="surveys"
      @update:model-value="surveyChange"
      item-title="NAME"
      item-value="SID"></v-select>

    <div v-if="survey">
      <v-select label="Recipient Type" :items="participantTypeOptions" v-model="email.recipientType" />
      <v-text-field v-model="email.subject" label="Subject" density="comfortable" variant="outlined"></v-text-field>
      <v-textarea
        v-model="email.body"
        label="Email body"
        density="comfortable"
        variant="outlined"
        rows="5"></v-textarea>

      <ul>
        <li>Use <b>``SURVEY_URL``</b> for link to Survey page (will display token to user)</li>
        <li>Use Markdown sytax like <b>[Click here](``SURVEY_URL``)</b> to make it show as a link 'Click here'</li>
        <li>
          Use HTML syntax like <b>&lt;a href="``SURVEY_URL``"&gt;Click here&lt;/a&gt;</b> to make it show as a link
          'Click here'
        </li>
      </ul>

      <div class="d-flex">
        <v-btn color="primary" :disabled="!emailValid" @click="sendTestClick">Send Test</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="warning" :disabled="!emailValid" @click="sendEmailClick">Send to Participants</v-btn>
      </div>
    </div>
    <div v-else class="text-warning ml-2">* Choose a survey above to continue</div>
  </base-card>
</template>

<script lang="ts">
import { mapActions, mapState, mapWritableState } from "pinia";
import { useEmailerStore } from "../store";
import { useParticipantsStore } from "../../participants/store";
import { useAdminSurveyStore } from "../../survey/store";

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
    recipientType: "SEND",
  }),
  computed: {
    ...mapState(useAdminSurveyStore, { surveys: "activeSurveys" }),
    ...mapState(useEmailerStore, ["emailValid"]),
    ...mapWritableState(useEmailerStore, ["survey", "email"]),
    ...mapState(useParticipantsStore, ["participants"]),

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

    participantTypeOptions() {
      return [
        { title: `Recipients who haven't been sent yet - ${this.sendCount.length} recipients`, value: "SEND" },
        { title: `Recipients who need a reminder - ${this.resendCount.length} recipients`, value: "RESEND" },
      ];
    },

    viableParticipants() {
      return this.participants.filter((p) => p.EMAIL);
    },

    sendCount() {
      return this.viableParticipants.filter((p) => !p.SENT_DATE);
    },
    resendCount() {
      return this.viableParticipants.filter((p) => p.SENT_DATE && !p.RESENT_DATE);
    },
    selectedSurvey() {
      if (this.survey) {
        return this.surveys.find((s) => s.SID == this.survey);
      }

      return null;
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
    ...mapActions(useAdminSurveyStore, ["loadSurveys"]),
    ...mapActions(useEmailerStore, ["select", "sendTest", "sendEmail"]),
    ...mapActions(useEmailerStore, { unselectEmailer: "unselect" }),

    ...mapActions(useParticipantsStore, ["getParticipants", "unselect"]),

    async loadItems() {
      await this.loadSurveys();
    },
    async sendTestClick() {
      await this.sendTest();
    },
    async sendEmailClick() {
      await this.sendEmail();
    },
    async surveyChange() {
      if (this.survey && this.selectedSurvey) {
        this.email.body = this.selectedSurvey.EMAIL_BODY ?? "";
        this.email.subject = this.selectedSurvey.EMAIL_SUBJECT ?? "";
        await this.getParticipants(this.survey);
      }
    },
  },
};
</script>
