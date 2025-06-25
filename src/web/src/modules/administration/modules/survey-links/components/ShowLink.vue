<template>
  <div>
    <v-dialog v-model="visible" width="700px" transition="dialog-bottom-transition" persistent>
      <template v-slot:default="{ isActive }">
        <v-card v-if="selectedLink">
          <v-toolbar color="info" density="comfortable">
            <v-toolbar-title class="text-white">Survey Link</v-toolbar-title>
            <v-spacer> </v-spacer>
            <v-toolbar-items>
              <v-btn icon="mdi-close" @click="unselectLink"></v-btn>
            </v-toolbar-items>
          </v-toolbar>

          <v-card-text class="pt-5">
            <v-text-field
              :model-value="selectedLink.survey?.NAME"
              dense
              outlined
              readonly
              label="Survey (with auto-participant allowed)" />

            <v-text-field
              :model-value="selectedLink.group?.NAME"
              dense
              outlined
              readonly
              label="Demographic group (optional)" />

            <QRCodeVue3
              :value="surveyUrl"
              :width="200"
              :height="200"
              :download="true"
              :downloadOptions="{
                name: `survey-link-${selectedLink.SL_TOKEN}`,
              }"
              image="/yukon.svg"
              :cornersSquareOptions="{ type: 'square' }"
              :imageOptions="{ margin: 1 }"
              :dotsOptions="{
                type: 'square',
                color: '#000',
              }" />
            <br />
            <v-text-field
              :model-value="surveyUrl"
              append-inner-icon="mdi-content-copy"
              readonly
              hide-details
              @click:append-inner="copyToClipboard" />
            <br />

            <v-btn color="warning" class="mt-0" @click="doDelete">Delete </v-btn>
          </v-card-text>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useLinksAdminStore } from "../store";
import QRCodeVue3 from "qrcode-vue3";

export default {
  components: { QRCodeVue3 },
  name: "AddEmployee",
  props: ["onComplete", "onError"],
  data: () => ({}),
  computed: {
    ...mapState(useLinksAdminStore, ["selectedLink"]),
    visible() {
      return this.selectedLink ? true : false;
    },
    surveyUrl() {
      if (this.selectedLink) {
        return `${window.location.origin}/survey-link/${this.selectedLink.SL_TOKEN}`;
      }
      return "";
    },
  },
  methods: {
    ...mapActions(useLinksAdminStore, ["addLink", "unselectLink", "deleteLink"]),

    async doDelete() {
      if (this.selectedLink) {
        const confirmed = confirm("Are you sure you want to delete this survey link?");

        if (!confirmed) return;

        await this.deleteLink(this.selectedLink.ID);
        this.unselectLink();
      }
    },

    copyToClipboard() {
      if (this.surveyUrl) {
        navigator.clipboard.writeText(this.surveyUrl).then(
          () => {
            this.$emit("success", "Survey link copied to clipboard");
          },
          (err) => {
            this.$emit("error", "Failed to copy survey link: " + err);
          }
        );
      }
    },
  },
};
</script>
