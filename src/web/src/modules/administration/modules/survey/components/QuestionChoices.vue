<template>
  <h3 class="mt-4">Manage Choices</h3>

  Choose an option or create a new one

  <v-row>
    <v-col cols="6">
      <v-select
        v-model="selectedOption"
        @update:model-value="optionChanged"
        label="List"
        :items="options"
        item-value="JSON_ID"
        item-title="TITLE"
        return-object />
    </v-col>
    <v-col cols="6"><v-text-field label="List name" v-model="question.choiceTitle"></v-text-field></v-col>
  </v-row>

  <div v-for="(choice, idx) of question.choices">
    <v-row>
      <v-col cols="3"><v-text-field label="Val" v-model="choice.val" hide-details /></v-col>
      <v-col cols="9" class="d-flex">
        <v-text-field label="Descr" v-model="choice.descr" hide-details />
        <v-btn @click="removeClick(idx)" color="warning" class="my-0 ml-3" icon="mdi-delete" size="small"></v-btn>
      </v-col>
    </v-row>
    <v-divider class="my-2" />
  </div>
  <v-btn @click="addClick" color="info">Add Choice</v-btn>
</template>
<script>
import { isArray } from "lodash";
import { mapState } from "pinia";
import { useAdminSurveyStore } from "../store";

export default {
  props: ["question"],
  data: () => ({
    isCreated: false,
    selectedOption: null,
  }),
  mounted() {
    this.question.choices = this.question.choices || [];

    if (this.question.SELECTION_JSON) {
      let ch = JSON.parse(this.question.SELECTION_JSON);

      if (isArray(ch)) return ch;
      if (ch.choices && isArray(ch.choices)) {
        this.question.choiceTitle = "Converted";
        this.question.choices = ch.choices;
        this.question.SELECTION_JSON = null;
      }
    }

    if (this.question.JSON_ID && this.survey.choices) {
      this.selectedOption = this.survey.choices.find((c) => c.JSON_ID == this.question.JSON_ID);
      this.optionChanged(this.selectedOption);
    }

    return [];
  },
  computed: {
    ...mapState(useAdminSurveyStore, ["survey"]),
    options() {
      let items = [];
      if (this.survey) items = this.survey.choices || [];

      items = [{ TITLE: "Create new", JSON_ID: -1 }, ...items];

      return items;
    },
  },
  methods: {
    addClick() {
      this.question.choices.push({ val: this.question.choices.length + 1, descr: "Empty" });
    },
    removeClick(idx) {
      this.question.choices.splice(idx, 1);
    },
    optionChanged(val) {
      if (val) {
        this.question.choices = val.choices || [];
        this.question.choiceTitle = val.TITLE;
        this.question.JSON_ID = val.JSON_ID;
      }
    },
  },
};
</script>
