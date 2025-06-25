<template>
  <div>
    <v-btn color="primary" variant="tonal" size="small" class="mr-5" @click="doShow">Add Survey Link</v-btn>

    <v-dialog v-model="showEdit" width="700px" transition="dialog-bottom-transition" persistent>
      <template v-slot:default="{ isActive }">
        <v-card>
          <v-toolbar color="info" density="comfortable">
            <v-toolbar-title class="text-white" style="">Add Survey Link</v-toolbar-title>
            <v-spacer> </v-spacer>
            <v-toolbar-items>
              <v-btn icon="mdi-close" @click="doClose"></v-btn>
            </v-toolbar-items>
          </v-toolbar>

          <v-card-text class="pt-5">
            <v-select
              v-model="survey"
              :items="surveys.filter((s) => s.ALLOW_AUTO_PARTICIPANT == 1)"
              item-title="NAME"
              item-value="SID"
              dense
              outlined
              label="Survey (with auto-participant allowed)"
              @update:model-value="demographicGroup = null" />

            <v-select
              v-model="demographicGroup"
              :items="groups.filter((g) => g.SID == (survey ?? 0))"
              item-title="NAME"
              item-value="ID"
              dense
              outlined
              clearable
              label="Demographic group (optional)">
            </v-select>

            <v-btn color="primary" class="mt-0 mb-3" @click="doAdd" :disabled="!survey">Add </v-btn>
          </v-card-text>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useLinksAdminStore } from "../store";
import { useDemographicAdminStore } from "@/modules/administration/modules/demographic-group/store";
import { useAdminSurveyStore } from "../../survey/store";

export default {
  name: "AddLink",
  data: () => ({
    survey: null as number | null,
    demographicGroup: null as number | null,

    showEdit: false,
  }),
  computed: {
    ...mapState(useAdminSurveyStore, ["surveys"]),
    ...mapState(useDemographicAdminStore, ["groups"]),
  },
  async mounted() {
    await this.getAllGroups();
  },
  methods: {
    ...mapActions(useDemographicAdminStore, ["getAllGroups"]),
    ...mapActions(useLinksAdminStore, ["addLink"]),
    doShow() {
      this.showEdit = true;
      this.survey = null;
      this.demographicGroup = null;
    },
    doClose() {
      this.showEdit = false;
      this.survey = null;
      this.demographicGroup = null;
    },
    doAdd() {
      if (!this.survey) return;

      this.addLink(this.survey, this.demographicGroup).then((resp: any) => {
        if (resp && resp.error) {
          this.survey = null;
          this.demographicGroup = null;
          return;
        }

        this.doClose();
      });
    },
  },
};
</script>
