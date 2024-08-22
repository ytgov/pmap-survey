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
        v-model="batch.survey"
        density="compact"
        label="Surveys"
        :items="surveys"
        @update:model-value="surveyChanged"
        item-title="NAME"
        item-value="SID"
        hide-details
        class="ml-2"></v-select>
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
        <v-btn @click="openEditor" color="primary" variant="tonal" class="float-right" :disabled="!batch.survey"
          >Add Participants</v-btn
        >
      </v-col>
    </v-row>

    <v-data-table :search="search" :headers="headers" :items="participants">
      <template v-slot:item.actions="{ item }">
        <div v-if="item.EMAIL">
          <v-btn
            icon="mdi-delete"
            variant="tonal"
            color="warning"
            size="x-small"
            @click="deleteClick(item.TOKEN)"></v-btn>
        </div>
      </template>
      <template v-slot:item.email="{ item }">
        <div v-if="item.EMAIL">
          <v-btn
            icon="mdi-email"
            variant="tonal"
            color="warning"
            size="x-small"
            @click="emailClick(item.TOKEN)"></v-btn>
        </div>
      </template>

      <template v-slot:item.TOKEN="{ item }">
        {{ trimToken(item.TOKEN) }}
      </template>

      <template v-slot:item.CREATE_DATE="{ item }">
        {{ formatDate(item.CREATE_DATE) }}
      </template>
      <template v-slot:item.SENT_DATE="{ item }">
        {{ formatDate(item.SENT_DATE) }}
      </template>
      <template v-slot:item.RESENT_DATE="{ item }">
        {{ formatDate(item.RESENT_DATE) }}
      </template>
      <template v-slot:item.RESPONSE_DATE="{ item }">
        {{ formatDate(item.RESPONSE_DATE) }}
      </template>
    </v-data-table>

    <v-btn
      v-if="participants && participants.length > 0"
      color="warning"
      variant="text"
      size="small"
      @click="deleteNoResponseClick">
      <v-icon class="mr-2">mdi-delete</v-icon>
      Clear all who haven't responded
    </v-btn>

    <ConfirmDialog ref="confirm"></ConfirmDialog>

    <v-dialog v-model="visible" persistent max-width="700">
      <v-card>
        <v-toolbar color="primary" variant="dark" title="Add Participants">
          <v-spacer></v-spacer>
          <v-btn icon @click="closeEditor" color="white"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text>
          <v-text-field
            label="Token prefix"
            maxlength="3"
            v-model="batch.prefix"
            density="comfortable"
            variant="outlined" />
          <v-file-input
            v-model="csvFile"
            variant="outlined"
            density="comfortable"
            accept="text/csv"
            label="Choose a CSV to import"></v-file-input>

          <div v-if="csvFile && csvFile.length > 0">
            <v-label class="mb-3">
              This CSV parser assumes:<br />
              1) The first row in the file contains headers - it is skipped during parsing <br />
              2) The first header is always EMAIL <br />
              3) Any additional headers are demographics and match existing values
            </v-label>
          </div>

          <v-textarea
            v-model="batch.participants"
            variant="outlined"
            density="comfortable"
            bg-color="white"
            rows="8"
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
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useParticipantsStore } from "../store";
import { useAdminSurveyStore } from "../../survey/store";
import moment from "moment";
import { parse as csvParser } from "csv-parse/browser/esm";

import { useNotificationStore } from "@/store/NotificationStore";

const notify = useNotificationStore();

export default {
  components: { ConfirmDialog },
  data: () => ({
    participantType: "",
    headers: [
      { title: "", key: "actions", width: "60px" },
      { title: "Token", key: "TOKEN" },
      { title: "Email", key: "EMAIL" },
      { title: "Create Date", key: "CREATE_DATE" },
      { title: "Sent Date", key: "SENT_DATE" },
      { title: "Resent Date", key: "RESENT_DATE" },
      { title: "Response Date", key: "RESPONSE_DATE" },
      { title: "", key: "email", width: "60px" },
    ],
    search: "",
    parseMessage: "",
    visible: false,
    csvFile: [],
    parsedCsv: "",
  }),
  computed: {
    ...mapWritableState(useParticipantsStore, ["batch"]),
    ...mapState(useParticipantsStore, ["isLoading", "batchIsValid", "participants"]),
    ...mapState(useAdminSurveyStore, { surveys: "activeSurveys" }),

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
  },
  beforeMount() {
    this.loadItems();
    this.loadSurveys();
  },
  unmounted() {
    this.unselect();
  },
  methods: {
    ...mapActions(useParticipantsStore, [
      "parse",
      "create",
      "getParticipants",
      "deleteParticipant",
      "deleteStaleParticipants",
      "unselect",
      "manualSend",
    ]),
    ...mapActions(useAdminSurveyStore, ["loadSurveys"]),

    async loadItems() {
      //await this.getAllUsers();
    },
    rowClick(event: Event, thing: any) {
      //this.selectUser(clone(thing.item.value));
    },
    async parseClick() {
      if (this.csvFile && this.csvFile.length > 0) {
        let file = this.csvFile[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = async (end) => {
            const fileContent = end.target?.result;
            const records = new Array<any>();
            const parser = csvParser({ delimiter: "," });

            parser.on("readable", () => {
              let record;
              while ((record = parser.read()) !== null) {
                records.push(record);
              }
            });
            parser.on("error", function (err) {
              console.error(err.message);
            });

            parser.write(fileContent);
            parser.end();

            let headers = records.shift();

            if (headers[0] && headers[0].toLowerCase() != "email") {
              console.log("THIS FILE NEEDS HEADERS");

              notify.notify({
                text: "This CSV File doesn't have the EMAIL header row",
                icon: "mdi-thumb-down",
                variant: "error",
              });
              return;
            }

            let emails = records.map((r) => r[0]);

            this.batch.fileData = { headers, records };
            this.batch.participants = emails.join(", ");

            let items = await this.parse(true);
            this.parseMessage = `${items.valid.length} valid email address and ${items.invalid.length} invalid`;
          };

          reader.readAsText(file);
        }
      } else {
        this.batch.fileData = {};
        let items = await this.parse();
        this.parseMessage = `${items.valid.length} valid email address and ${items.invalid.length} invalid`;
      }
    },
    async saveClick() {
      await this.create()
        .then(() => {
          this.closeEditor();
        })
        .catch(() => {
          console.log("ERROR IN THEN");
        });
    },
    async surveyChanged() {
      await this.getParticipants(this.batch.survey);
    },
    async deleteClick(participantId: any) {
      (this.$refs.confirm as any).show(
        "Delete this participant?",
        "Click confirm below to delete the selected participant.",
        async () => {
          await this.deleteParticipant(this.batch.survey, participantId);
        },
        () => {}
      );
    },

    deleteNoResponseClick() {
      (this.$refs.confirm as any).show(
        "Delete stale participants?",
        "Click confirm below to delete all participants who have not yet responsed.",
        async () => {
          await this.deleteStaleParticipants(this.batch.survey);
        },
        () => {}
      );
    },

    async emailClick(participantId: any) {
      (this.$refs.confirm as any).show(
        "Send email to this participant?",
        "Click confirm below to send a single email using the supplied token. This will use the email format defined in the emailer for this survey. Please ensure it is setup before proceeding.",
        async () => {
          await this.manualSend(this.batch.survey, participantId);
        },
        () => {}
      );
    },
    formatDate(input: any) {
      if (input) return moment(input).format("YYYY-MM-DD @ hh:mm a");
      return "";
    },
    trimToken(input: string) {
      return `${input.substring(0, 8)} ... ${input.substring(input.length - 6)}`;
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
