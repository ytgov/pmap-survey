<template>
  <v-dialog v-model="visible" persistent max-width="800">
    <v-card v-if="survey">
      <v-toolbar color="primary" variant="dark" title="Choices Editor">
        <v-spacer></v-spacer>
        <v-btn icon @click="visible = false" color="white"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-card-text>
        <v-text-field
          label="List name"
          v-model="selectedChoices.TITLE"
          :hint="nameAlreadyExists ? 'This name already exists' : ''"
          :error="nameAlreadyExists"
          :readonly="disabled"
          class="mb-3"
          persistent-hint />

        <div v-for="(choice, idx) of selectedChoices.choices">
          <v-row>
            <v-col cols="3"><v-text-field label="Value" v-model="choice.val" hide-details /></v-col>
            <v-col cols="9" class="d-flex">
              <v-text-field label="Description" v-model="choice.descr" hide-details />
              <v-btn
                @click="removeClick(idx)"
                color="warning"
                class="my-0 ml-3"
                icon="mdi-delete"
                size="small"
                :disabled="disabled"></v-btn>
            </v-col>
          </v-row>
          <v-divider class="my-2" />
        </div>
        <v-btn color="info" @click="addChoiceClick" :disabled="disabled">Add Choice</v-btn>

        <div class="d-flex mb-2">
          <v-btn color="primary" class="mt-5" @click="saveClick" :disabled="disabled || !canSave">Save</v-btn>
          <v-spacer />
          <v-btn color="warning" variant="tonal" class="mt-5" @click="visible = false" :disabled="disabled"
            >close</v-btn
          >
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useAdminSurveyStore } from "../store";

export default {
  props: ["survey", "disabled"],
  data: () => ({ visible: false, otherNames: [] as string[] }),
  computed: {
    ...mapState(useAdminSurveyStore, ["survey", "selectedChoices"]),
    canSave() {
      return !this.otherNames.includes(this.selectedChoices.TITLE);
    },
    nameAlreadyExists() {
      return this.otherNames.includes(this.selectedChoices.TITLE);
    },
  },
  methods: {
    ...mapActions(useAdminSurveyStore, ["saveSurveyChoices"]),
    show() {
      this.otherNames = this.survey.choices
        .filter((n: any) => this.selectedChoices.JSON_ID != n.JSON_ID)
        .map((c: any) => c.TITLE);
      this.visible = true;
    },

    removeClick(idx: number) {
      this.selectedChoices.choices.splice(idx, 1);
    },

    addChoiceClick() {
      this.selectedChoices.choices.push({ val: this.selectedChoices.choices.length + 1, descr: "Empty" });
    },
    async saveClick() {
      await this.saveSurveyChoices();
      this.visible = false;
    },
  },
};
</script>
