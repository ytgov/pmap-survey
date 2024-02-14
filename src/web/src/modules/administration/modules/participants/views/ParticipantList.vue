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

  <h1>Participants</h1>

  <base-card showHeader="t" heading="" elevation="0">
    <template v-slot:left>
      <v-select
        v-model="batch.question"
        density="compact"
        label="Question"
        :items="earlyStageQuestions"
        @update:model-value="questionChanged"
        item-title="TITLE"
        hide-details
        class="ml-2"
        item-value="ID"></v-select>
    </template>
    <template v-slot:right>
      <v-text-field
        v-model="search"
        label="Search"
        single-line
        hide-details
        append-inner-icon="mdi-magnify"
        class="mr-2"
        density="compact"></v-text-field>
    </template>
    <v-row>
      <v-col>
        <v-btn @click="openEditor" color="primary" variant="tonal" class="float-right" :disabled="!batch.question"
          >Add Participants</v-btn
        >
      </v-col>
    </v-row>

    <v-data-table :search="search" :headers="headers" :items="participants">
      <template v-slot:item.actions="{ item }">
        <div>
          <v-btn icon="mdi-delete" variant="tonal" color="warning" @click="deleteClick(item.ID)"></v-btn>
        </div>
      </template>
    </v-data-table>

    <v-dialog v-model="visible" persistent max-width="700">
      <v-card>
        <v-toolbar color="primary" variant="dark" title="Add Participants">
          <v-spacer></v-spacer>
          <v-btn icon @click="closeEditor" color="white"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text>
          <v-select
            label="Type"
            :items="listTypes"
            density="comfortable"
            variant="outlined"
            v-model="batch.participant_type"></v-select>

          <v-textarea
            v-model="batch.participants"
            variant="outlined"
            density="comfortable"
            bg-color="white"
            label="Participants"></v-textarea>

          <div class="d-flex mb-3">
            <v-btn color="success" @click="parseClick">Parse</v-btn>
            <div class="ml-4 pt-2">{{ parseMessage }}</div>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="saveClick" :disabled="!batchIsValid">Save</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </base-card>
</template>
<script lang="ts">
import { mapActions, mapState, mapWritableState } from "pinia";
import { useParticipantsStore } from "../store";
import { useAdminSurveyStore } from "../../survey/store";

export default {
  components: {},
  data: () => ({
    participantType: "",
    headers: [
      { title: "", key: "actions", width: "60px" },
      { title: "Email", key: "EMAIL" },
      { title: "Responder", key: "IS_RESPONDER" },
      { title: "Rater", key: "IS_RATER" },
      { title: "Submitted", key: "ANSWERS_SUBMITTED" },
    ],
    search: "",
    parseMessage: "",
    visible: false,
  }),
  computed: {
    ...mapWritableState(useParticipantsStore, ["batch"]),
    ...mapState(useParticipantsStore, ["isLoading", "listTypes", "batchIsValid", "participants"]),
    ...mapState(useAdminSurveyStore, ["questions"]),

    items() {
      return [];
    },
    totalItems() {
      return 0;
    },
    breadcrumbs() {
      return [
        {
          title: "Administration",
          to: "/administration",
        },
        {
          title: "Participants",
        },
      ];
    },
    earlyStageQuestions() {
      if (this.questions) {
        return this.questions.filter((q) => q.STATE == 0);
      }
      return [];
    },
  },
  beforeMount() {
    this.loadItems();
    this.loadQuestions();
  },
  unmounted() {
    this.unselect();
  },
  methods: {
    ...mapActions(useParticipantsStore, ["parse", "create", "getParticipants", "deleteParticipant", "unselect"]),
    ...mapActions(useAdminSurveyStore, ["loadQuestions"]),

    async loadItems() {
      //await this.getAllUsers();
    },
    rowClick(event: Event, thing: any) {
      //this.selectUser(clone(thing.item.value));
    },
    async parseClick() {
      let items = await this.parse();
      this.parseMessage = `${items.valid.length} valid email address and ${items.invalid.length} invalid`;
    },
    async saveClick() {
      await this.create();
    },
    async questionChanged() {
      await this.getParticipants(this.batch.question);
    },
    async deleteClick(participantId: any) {
      await this.deleteParticipant(this.batch.question, participantId);
    },

    openEditor() {
      this.visible = true;
    },
    closeEditor() {
      this.visible = false;
    },
  },
};
</script>
