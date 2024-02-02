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

  <div v-if="question">
    <h1>{{ question.TITLE }} : <span style="font-weight: 400">Responses</span></h1>

    <base-card showHeader="t" heading="">
      <template v-slot:left> </template>
      <template v-slot:right>
        <v-select
          label="Status"
          :items="statusOptions"
          v-model="status"
          density="compact"
          single-line
          hide-details
          style="max-width: 300px"></v-select>
      </template>

      <v-data-table :search="search" :headers="headers" :items="filteredList" @click:row="rowClick">
        <template v-slot:item.DONE_MODERATING="{ item }">
          {{ item.DONE_MODERATING == 1 ? "Yes" : "No" }}
        </template>
        <template v-slot:item.DELETED_FLAG="{ item }">
          {{ item.DELETED_FLAG == 1 ? "Yes" : "No" }}
        </template>
        <template v-slot:item.MODERATED_TEXT="{ item }">
          <span v-if="item.MODERATED_TEXT != item.ANSWER_TEXT" :class="`text-error`">{{ item.MODERATED_TEXT }}</span>
          <span v-else>{{ item.MODERATED_TEXT }}</span>
        </template>
      </v-data-table>
    </base-card>
  </div>

  <response-editor :items="filteredList"></response-editor>
</template>
<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useResponseStore } from "../store";
import ResponseEditor from "../components/ResponseEditor.vue";
import { Question, useQuestionStore } from "../../question/store";
import { isArray } from "lodash";

export default {
  components: { ResponseEditor },
  data: () => ({
    headers: [
      { title: "Category", key: "CATEGORY" },
      { title: "Response", key: "MODERATED_TEXT" },
      { title: "Deleted", key: "DELETED_FLAG" },
      { title: "Complete", key: "DONE_MODERATING" },
    ],
    search: "",
    questionId: -1,
    question: undefined as Question | undefined,
    status: "Unmoderated",
  }),
  watch: {
    moderatedResponseCount(n, o) {
      if (this.status.startsWith("Moderated")) this.status = this.statusOptions[0];
    },
    unmoderatedResponseCount(n, o) {
      if (this.status.startsWith("Unmoderated")) this.status = this.statusOptions[1];
    },
  },
  computed: {
    ...mapState(useResponseStore, ["responses", "moderatedResponseCount", "unmoderatedResponseCount"]),
    ...mapState(useQuestionStore, ["questions"]),
    statusOptions() {
      return [`Moderated (${this.moderatedResponseCount})`, `Unmoderated (${this.unmoderatedResponseCount})`];
    },
    breadcrumbs() {
      return [
        {
          title: "Administration",
          to: "/administration",
        },
        {
          title: "Responses",
        },
      ];
    },
    filteredList() {
      let items = this.responses;

      if (this.status.startsWith("Moderated")) {
        items = items.filter((i) => i.DONE_MODERATING == 1);
      } else {
        items = items.filter((i) => i.DONE_MODERATING == 0);
      }

      return items;
    },
  },
  async beforeMount() {
    this.questionId = parseInt(
      isArray(this.$route.params.questionId) ? this.$route.params.questionId[0] : this.$route.params.questionId
    );

    await this.loadItems();
  },
  methods: {
    ...mapActions(useResponseStore, ["loadResponsesFor", "select"]),
    ...mapActions(useQuestionStore, ["loadQuestions"]),
    async loadItems() {
      await this.loadResponsesFor(this.questionId);
      await this.loadQuestions();

      if (this.questions.length > 0 && this.questions[0].ID) {
        this.question = this.questions.filter((q) => q.ID == this.questionId)[0];
      }
      this.status = this.statusOptions[1];
    },
    rowClick(event: Event, thing: any) {
      this.select(thing.item);
    },
  },
};
</script>
