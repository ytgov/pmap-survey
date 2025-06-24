<template>
  <div>
    <v-btn color="primary" variant="tonal" size="small" class="mr-5" @click="doShow">Add Demographic Group</v-btn>

    <v-dialog v-model="showEdit" width="600px" transition="dialog-bottom-transition" persistent>
      <template v-slot:default="{ isActive }">
        <v-card>
          <v-toolbar color="primary" density="comfortable">
            <v-toolbar-title class="text-white" style="">Add Demographic Group</v-toolbar-title>
            <v-spacer> </v-spacer>
            <v-toolbar-items>
              <v-btn icon="mdi-close" @click="doClose"></v-btn>
            </v-toolbar-items>
          </v-toolbar>
          <v-card-text class="pt-5">
            <v-text-field v-model="chosenOne.NAME" dense outlined label="Group name" />
            <v-select
              v-model="chosenOne.SID"
              :items="surveys.filter((s) => s.ALLOW_DEMOGRAPHIC_GROUP == 1)"
              item-title="NAME"
              item-value="SID"
              dense
              outlined
              label="Survey" />

            <v-btn color="primary" class="mt-0 mb-3" @click="doAdd" :disabled="!chosenOne.NAME || !chosenOne.SID"
              >Add
            </v-btn>
          </v-card-text>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { mapActions, mapState } from "pinia";
import { DemographicGroup, useDemographicAdminStore } from "../store";
import { useAdminSurveyStore } from "../../survey/store";

export default {
  components: {},
  name: "AddEmployee",
  props: ["onComplete", "onError"],
  data: () => ({
    showEdit: false,
    chosenOne: { NAME: "", SID: 0 } as DemographicGroup | Partial<DemographicGroup>,
  }),
  computed: {
    ...mapState(useAdminSurveyStore, ["surveys"]),
  },
  methods: {
    ...mapActions(useDemographicAdminStore, ["addGroup", "selectGroup"]),
    doShow() {
      this.showEdit = true;
      this.chosenOne = {};
    },
    doClose() {
      this.showEdit = false;
      this.chosenOne = {};
    },
    doAdd() {
      this.addGroup(this.chosenOne).then((resp: any) => {
        if (resp && resp.error) {
          if (this.onError) this.onError(resp.error[0]);
          return;
        }

        if (this.onComplete) this.onComplete(resp);

        this.doClose();
      });
    },
  },
};
</script>
