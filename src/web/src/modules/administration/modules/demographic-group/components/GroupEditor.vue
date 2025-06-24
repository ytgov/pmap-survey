<template>
  <v-dialog v-model="visible" persistent max-width="700">
    <v-card v-if="selectedGroup">
      <v-toolbar color="primary" variant="dark" density="comfortable">
        <v-toolbar-title style="min-width: 300px">Edit Demographic Group</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="close" color="white"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-card-text>
        <v-text-field label="Group name" v-model="selectedGroup.NAME" variant="outlined" density="comfortable" />
        <v-select
          label="Survey"
          v-model="selectedGroup.SID"
          :items="surveys.filter((s) => s.ALLOW_DEMOGRAPHIC_GROUP == 1)"
          item-title="NAME"
          item-value="SID" />

        <v-divider class="mb-3" />

        <div class="d-flex">
          <h2>Values</h2>
          <v-spacer />

          <v-btn @click="addClick" color="info" class="mt-1 float-right" size="small">Add Value</v-btn>
        </div>

        <div v-if="selectedGroup.values?.length == 0" class="text-warning">None defined</div>

        <v-row v-else>
          <v-col cols="5"><label class="">Demographic</label></v-col>
          <v-col cols="3">Numeric Value</v-col>
          <v-col>String Value</v-col>
        </v-row>
        <v-row v-for="(value, index) in selectedGroup.values" :key="index">
          <v-col cols="5" class="pt-0">
            <v-select
              v-model="value.DEMOGRAPHIC"
              :items="demographics"
              item-title="DEMOGRAPHIC"
              item-children="DEMOGRAPHIC"
              variant="outlined"
              density="compact"
              required
              hide-details />
          </v-col>
          <v-col cols="3" class="pt-0">
            <v-text-field
              v-model.number="value.NVALUE"
              type="number"
              variant="outlined"
              density="compact"
              hide-details />
          </v-col>
          <v-col class="pt-0 d-flex">
            <v-text-field v-model="value.TVALUE" variant="outlined" density="compact" hide-details />
            <v-btn
              icon="mdi-delete"
              size="x-small"
              class="ml-2 mt-1"
              color="warning"
              variant="outlined"
              @click="removeValue(index)" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="mx-4 mb-2">
        <v-btn color="primary" variant="flat" :disabled="!isValid" @click="saveGroup()">Save</v-btn>
        <v-btn color="error" class="ml-3" size="small" variant="outlined" @click="deleteClick">Delete</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="yg_sun" variant="outlined" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useDemographicAdminStore } from "../store";
import { useAdminSurveyStore } from "../../survey/store";
import { isEmpty } from "lodash";

export default {
  name: "UserEditor",
  data: () => ({ demographics: [] as { DEMOGRAPHIC: string }[] }),
  computed: {
    ...mapState(useDemographicAdminStore, ["selectedGroup"]),
    ...mapState(useAdminSurveyStore, ["surveys"]),
    visible() {
      return this.selectedGroup ? true : false;
    },
    isValid() {
      if (!this.selectedGroup) return false;
      if (!this.selectedGroup.NAME || !this.selectedGroup.SID) return false;

      for (const value of this.selectedGroup.values || []) {
        if (value.DEMOGRAPHIC === "" || (value.NVALUE === null && isEmpty(value.TVALUE))) return false;
      }

      return true;
    },
  },
  async mounted() {
    this.demographics = await this.getDemographics();
  },
  methods: {
    ...mapActions(useDemographicAdminStore, ["unselectGroup", "saveGroup", "deleteGroup", "getDemographics"]),
    close() {
      this.unselectGroup();
    },
    async deleteClick() {
      if (!this.selectedGroup) return;

      const doDelete = confirm(
        `Are you sure you want to delete the group "${this.selectedGroup.NAME}"? This action cannot be undone.`
      );

      if (doDelete) {
        await this.deleteGroup();
        this.close();
      }
    },

    addClick() {
      if (!this.selectedGroup) return;

      this.selectedGroup.values = this.selectedGroup.values || [];

      this.selectedGroup.values.push({
        DEMOGRAPHIC_GROUP_ID: this.selectedGroup.ID,
        DEMOGRAPHIC: "",
        NVALUE: null,
        TVALUE: null,
      });
    },
    removeValue(index: number) {
      if (!this.selectedGroup || !this.selectedGroup.values) return;

      this.selectedGroup.values.splice(index, 1);
    },
  },
};
</script>
