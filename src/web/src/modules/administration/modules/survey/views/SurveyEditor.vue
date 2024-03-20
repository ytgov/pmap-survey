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

  <div class="d-flex">
    <h1>Survey Editor</h1>
    <v-spacer />
    <v-btn color="info" variant="tonal" @click="openPreview">Preview</v-btn>
  </div>

  <base-card showHeader="" heading="" elevation="0" v-if="survey">
    <v-row class="mb-2">
      <v-col cols="12" md="6">
        <v-text-field label="Title" v-model="survey.NAME" />
        <v-textarea label="Display text" v-model="survey.DESCRIPTION" hide-details />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field label="Page title" v-model="survey.PAGE_TITLE" />
        <v-textarea label="Page intro" v-model="survey.PAGE_INTRO" hide-details />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field label="Contact email" v-model="survey.CONTACT_EMAIL" hide-details />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field label="Contact question" v-model="survey.CONTACT_QUESTION" hide-details />
      </v-col>
      <v-col cols="12" md="12">
        <v-text-field label="Email from" v-model="survey.FROM_EMAIL" persistent-hint :hint="fromLabel" />
      </v-col>
    </v-row>

    *** If question has responses, don't let changes happen<br />
    <div class="d-flex">
      <v-btn
        color="primary"
        variant="flat"
        @click="saveClick"
        class="mr-5"
        :disabled="survey.responses && survey.responses.length > 0"
        >Save</v-btn
      >
      <v-btn color="yg_sun" variant="outlined" @click="close">Close</v-btn>
      <span class="mt-5 ml-4 text-warning" v-if="survey.responses && survey.responses.length > 0"
        >This survey has respones and cannot be edited</span
      >
      <v-spacer></v-spacer>
      <v-btn color="error" variant="tonal" @click="deleteClick">Delete</v-btn>
    </div>

    <v-divider class="my-3" />

    <v-row>
      <v-col>
        <div class="d-flex">
          <h2>Questions</h2>
          <v-spacer />

          <v-btn
            @click="addQuestionClick"
            color="info"
            class="mt-1 float-right"
            size="small"
            :disabled="survey.responses && survey.responses.length > 0"
            >Add Question</v-btn
          >
        </div>

        <v-divider />

        <v-list variant="flat">
          <div v-for="(question, idx) of survey.questions">
            <question-editor
              :question="question"
              :index="idx"
              :disabled="survey.responses && survey.responses.length > 0"></question-editor>
            <v-divider />
          </div> </v-list
      ></v-col>
      <v-col>
        <h2>Choices</h2>

        <v-divider />

        <v-list variant="flat">
          <div v-for="(choice, idx) of survey.choices">
            <v-list-item> {{ choice.TITLE }}: {{ choice.choices.length }} options </v-list-item>
            <v-divider />
          </div> </v-list
      ></v-col>
    </v-row>
  </base-card>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useAdminSurveyStore } from "../store";
import QuestionEditor from "../components/QuestionEditor.vue";

export default {
  data: () => ({
    fromLabel: `FORMAT: "Name" <EMAIL.ADDRESS>`,
  }),
  components: { QuestionEditor },
  computed: {
    ...mapState(useAdminSurveyStore, ["survey"]),

    breadcrumbs() {
      return [
        {
          title: "Administration",
          to: "/administration",
        },
        {
          title: "Surveys",
          to: "/administration/surveys",
        },
        {
          title: this.survey ? this.survey.NAME : "",
          to: "",
        },
      ];
    },
  },
  async mounted() {
    if (!this.survey) {
      await this.loadSurveys();
      this.selectById(parseInt(this.$route.params.SID as string));
    }
  },
  methods: {
    ...mapActions(useAdminSurveyStore, [
      "loadSurveys",
      "selectById",
      "unselect",
      "select",
      "update",
      "create",
      "addQuestion",
      "delete",
    ]),
    close() {
      this.$router.push("/administration/surveys");
      this.unselect();
    },
    addQuestionClick() {
      this.addQuestion();
    },
    async saveClick() {
      if (this.survey && this.survey.SID) {
        this.update().then(() => {
          //this.close();
        });
      } else {
        this.create().then(() => {
          //this.close();
        });
      }
    },
    async deleteClick() {
      this.delete().then(() => {
        this.close();
      });
    },
    openPreview() {
      if (this.survey) window.open(`/preview/${this.survey.SID}`);
    },
  },
};
</script>
