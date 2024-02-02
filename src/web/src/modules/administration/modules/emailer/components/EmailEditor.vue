<template>
  <v-dialog v-model="visible" persistent max-width="500">
    <v-card v-if="question">
      <v-toolbar color="primary" variant="dark" title="Edit Question">
        <v-spacer></v-spacer>
        <v-btn icon @click="close" color="white"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-card-text>
        <v-text-field label="Title" v-model="question.TITLE" variant="outlined" density="comfortable"></v-text-field>
        <v-textarea
          label="Display text"
          v-model="question.DISPLAY_TEXT"
          variant="outlined"
          rows="3"
          density="comfortable"></v-textarea>
          
        <v-text-field label="Owner" v-model="question.OWNER" variant="outlined" density="comfortable"></v-text-field>
        <v-text-field type="number" label="State" v-model="question.STATE" variant="outlined" density="comfortable"></v-text-field>
        <v-text-field type="number" label="Max answer" v-model="question.MAX_ANSWERS" variant="outlined" density="comfortable"></v-text-field>
        <v-text-field type="number" label="Ratings per tranche" v-model="question.RATINGS_PER_TRANCHE" variant="outlined" density="comfortable"></v-text-field>
        <v-text-field type="number" label="Current rating tranche" v-model="question.CURRENT_RATING_TRANCHE" variant="outlined" density="comfortable"></v-text-field>
      </v-card-text>
      <v-card-actions class="mx-4 mb-2">
        <v-btn color="primary" variant="flat" @click="saveClick">Save</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="yg_sun" variant="outlined" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useEmailerStore } from "../store";

export default {
  name: "UserEditor",
  data: () => ({}),
  computed: {
    ...mapState(useEmailerStore, ["question"]),
    visible() {
      return this.question ? true : false;
    },
  },
  methods: {
    ...mapActions(useEmailerStore, ["unselect", "update", "create"]),
    close() {
      this.unselect();
    },
    async saveClick() {
      if (this.question && this.question.ID) {
        this.update().then(() => {
          this.close();
        });
      } else {
        this.create().then(() => {
          this.close();});
      }
    },
  },
};
</script>
