<template>
  <v-dialog v-model="visible" persistent max-width="500">
    <v-card v-if="selectedUser">
      <v-toolbar color="primary" variant="dark" title="Edit User">
        <v-spacer></v-spacer>
        <v-btn icon @click="close" color="white"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>
      <v-card-text>
        <v-text-field
          label="Name"
          v-model="selectedUser.display_name"
          readonly
          variant="outlined"
          density="comfortable"
          append-inner-icon="mdi-lock"></v-text-field>
        <v-text-field
          label="Email"
          v-model="selectedUser.EMAIL"
          readonly
          variant="outlined"
          density="comfortable"
          append-inner-icon="mdi-lock"></v-text-field>
        <v-select
          label="Status"
          v-model="selectedUser.STATUS"
          :items="['Active', 'Inactive']"
          variant="outlined"
          density="comfortable"></v-select>

        <v-row v-if="selectedUser.STATUS == 'Active'">
          <v-col>
            <v-checkbox
              label="System Admin"
              v-model="selectedUser.IS_ADMIN"
              variant="outlined"
              density="comfortable"
              @update:model-value="toggleSystemAdmin" />
          </v-col>
        </v-row>
        <v-select
          v-if="!selectedUser.IS_ADMIN"
          v-model="selectedUser.ROLE"
          :items="['Owner']"
          clearable
          label="Role"></v-select>
        <v-select
          v-if="selectedUser.STATUS == 'Active' && !selectedUser.IS_ADMIN"
          label="Surveys to Manage"
          v-model="selectedUser.surveys"
          multiple
          clearable
          :items="surveys"
          item-title="NAME"
          item-value="SID"></v-select>
      </v-card-text>
      <v-card-actions class="mx-4 mb-2">
        <v-btn color="primary" variant="flat" @click="saveUser()">Save</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="yg_sun" variant="outlined" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useUserAdminStore } from "../store";
import { useAdminSurveyStore } from "../../survey/store";

export default {
  name: "UserEditor",
  data: () => ({}),
  computed: {
    ...mapState(useUserAdminStore, ["selectedUser"]),
    ...mapState(useAdminSurveyStore, ["surveys"]),
    visible() {
      return this.selectedUser ? true : false;
    },
  },
  methods: {
    ...mapActions(useUserAdminStore, ["unselectUser", "saveUser"]),
    close() {
      this.unselectUser();
    },
    toggleSystemAdmin(value: unknown) {
      if (!this.selectedUser) return;

      console.log("toggleSystemAdmin", value);

      if (value === true) this.selectedUser.ROLE = null;
    },
  },
};
</script>
