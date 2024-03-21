<template>
  <v-list-item @click="showEditor">
    <v-btn
      @click.stop="moveUp(index)"
      color="primary"
      icon="mdi-chevron-up"
      size="x-small"
      class="float-right ml-1"
      :disabled="index == 0"></v-btn>
    <v-btn
      @click.stop="moveDown(index)"
      color="primary"
      icon="mdi-chevron-down"
      size="x-small"
      class="float-right"
      :disabled="index >= survey.questions.length - 1"></v-btn>
    <v-list-item-title>Question {{ index + 1 }}: ({{ question.TYPE }})</v-list-item-title>
    <v-list-item-subtitle>{{ question.ASK }}</v-list-item-subtitle>
  </v-list-item>

  <v-dialog v-model="visible" persistent max-width="800">
    <v-card v-if="question">
      <v-toolbar color="primary" variant="dark" title="Question Editor">
        <v-spacer></v-spacer>
        <v-btn icon @click="hideEditor" color="white"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-textarea v-model="question.ASK" label="Ask" hide-details v-if="question.TYPE == 'text'" />
            <v-text-field v-model="question.ASK" label="Ask" hide-details v-else />
          </v-col>
          <v-col cols="4">
            <v-select v-model="question.TYPE" label="Question type" :items="questionTypes" hide-details />
          </v-col>
          <v-col cols="4">
            <v-select
              v-model="question.OPTIONAL"
              label="Optional"
              hide-details
              :items="[
                { title: 'Yes', value: 1 },
                { title: 'No', value: 0 },
              ]" />
          </v-col>
          <v-col cols="4">
            <v-text-field v-model="question.ORD" label="Order" hide-details :disabled="true" />
          </v-col>

          <v-col v-if="question.TYPE == 'select'">
            <question-choices :question="question"></question-choices>
          </v-col>
          <v-col v-if="question.TYPE == 'matrix_question'">
            <v-select
              v-model="question.GROUP_ID"
              label="Group"
              hide-details
              :items="groupOptions"
              item-value="QID"
              item-title="ASK" />
            <question-choices :question="question"></question-choices>
          </v-col>
          <v-col v-if="question.TYPE == 'multi-select'">
            <v-text-field v-model="question.SELECT_LIMIT" label="Select limit" hide-details />
            <question-choices :question="question"></question-choices>
          </v-col>
          <v-col v-if="question.TYPE == 'range'">
            <question-choices :question="question"></question-choices>
          </v-col>
        </v-row>
        <div class="d-flex mb-2">
          <v-btn color="primary" class="mt-5" @click="saveClick" :disabled="disabled || !canSave">Save</v-btn>
          <v-spacer />
          <v-btn color="warning" class="mt-5" @click="deleteClick" :disabled="disabled">Delete</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { useAdminSurveyStore } from "../store";
import QuestionChoices from "./QuestionChoices.vue";

export default {
  props: ["question", "index", "disabled"],
  components: { QuestionChoices },
  data: () => ({ visible: false }),
  computed: {
    ...mapState(useAdminSurveyStore, ["survey", "questionTypes", "groupOptions", "saveQuestion", "deleteQuestion"]),
    canSave() {
      if (this.question.TYPE == "matrix_question") {
        if (!this.question.GROUP_ID) return false;
      }

      let optionTypes = ["select", "multi-select", "matrix_question", "range"];
      if (optionTypes.includes(this.question.TYPE)) {
        if (!this.question.choiceTitle || this.question.choiceTitle.length == 0) return false;
        if (!this.question.choices || this.question.choices.length == 0) return false;
      }

      return true;
    },
  },
  methods: {
    ...mapActions(useAdminSurveyStore, ["moveUp", "moveDown"]),
    showEditor() {
      this.visible = true;
    },
    hideEditor() {
      this.visible = false;
    },
    saveClick() {
      this.saveQuestion(this.question);
      this.visible = false;
    },
    deleteClick() {
      this.deleteQuestion(this.question);
      this.visible = false;
    },
  },
};
</script>
