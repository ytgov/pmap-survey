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

  <h1>Surveys</h1>

  <base-card v-if="user" showHeader="t" heading="" elevation="0">
    <template v-slot:left>
      <v-text-field
        v-model="search"
        label="Search"
        single-line
        hide-details
        append-inner-icon="mdi-magnify"
        density="compact"
        class="ml-2" />

      <v-select
        v-if="user.IS_ADMIN == 'Y'"
        v-model="showHidden"
        label="Search"
        :items="['Active', 'Hidden']"
        class="ml-3"
        single-line
        density="compact"
        hide-details />
    </template>
    <template v-slot:right>
      <v-btn
        v-if="user.IS_ADMIN == 'Y' || user.ROLE == 'Owner'"
        color="primary"
        variant="tonal"
        size="small"
        class="mr-5"
        @click="addSurveyClick"
        >Add Survey</v-btn
      >
    </template>

    <v-data-table :search="search" :headers="headers" :items="surveysList" :loading="isLoading" @click:row="rowClick">
    </v-data-table>
  </base-card>
</template>
<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useAdminSurveyStore } from "../store";
import { clone } from "lodash";
import { useUserStore } from "@/store/UserStore";

export default {
  data: () => ({
    headers: [
      { title: "SID", key: "SID" },
      { title: "Name", key: "NAME" },
      { title: "Questions", key: "questions.length" },
      { title: "Responses", key: "responses.length" },
    ],
    search: "",
    showHidden: "Active",
  }),
  computed: {
    ...mapState(useAdminSurveyStore, ["surveys", "hiddenSurveys", "activeSurveys", "isLoading"]),
    ...mapState(useUserStore, ["user"]),
    breadcrumbs() {
      return [
        {
          title: "Administration",
          to: "/administration",
        },
        {
          title: "Surveys",
        },
      ];
    },

    surveysList() {
      if (this.showHidden == "Hidden") {
        return this.hiddenSurveys;
      }

      return this.activeSurveys;
    },
  },
  async mounted() {
    await this.loadSurveys();
  },
  methods: {
    ...mapActions(useAdminSurveyStore, ["loadSurveys", "select", "create"]),

    rowClick(event: Event, thing: any) {
      this.select(clone(thing.item));
      this.$router.push(`/administration/surveys/${thing.item.SID}`);
    },
    async addSurveyClick() {
      this.select({
        CONTACT_EMAIL: "",
        CONTACT_QUESTION: "",
        DESCRIPTION: "This describes the survey",
        NAME: "NEW SURVEY",
        PAGE_INTRO: "This goes in the top of the survey page",
        PAGE_TITLE: "This is the title of the page",
      });

      let resp = await this.create();
      this.select(clone(resp));
      this.$router.push(`/administration/surveys/${resp.SID}`);
    },
  },
};
</script>
