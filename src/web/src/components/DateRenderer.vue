<template>
  <v-menu v-model="menu" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <v-text-field
        :model-value="formattedDate"
        :label="label"
        append-inner-icon="mdi-calendar"
        readonly
        clearable
        :error="error"
        :error-messages="errorMessages"
        @click:clear="updateDateAndCloseMenu(null)"
        v-bind="{ ...fieldOptions, ...menuProps }" />
    </template>

    <v-date-picker
      :model-value="date"
      v-bind="dateOptions"
      @update:model-value="updateDateAndCloseMenu"
      @vue:unmounted="validate" />
  </v-menu>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import moment from "moment";
import { VDatePicker, VTextField } from "vuetify/components";

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    dateOptions?: VDatePicker["$props"] | null;
    fieldOptions?: VTextField["$props"] | null;
    rules?: ((value: string | null) => string | boolean)[];
  }>(),
  {
    modelValue: null,
    label: "",
    dateOptions: null,
    fieldOptions: null,
    rules: () => [],
  }
);

const emit = defineEmits(["update:modelValue"]);

const menu = ref(false);
const date = ref<Date | null>(null);
const error = ref(false);
const errorMessages = ref<string>("");

watch(
  () => props.modelValue,
  (newValue) => {
    console.log("New date value:", newValue);

    if (newValue === null) {
      date.value = null;
      return;
    }

    const newDateTime = moment(newValue);
    date.value = newDateTime.toDate();
  },
  {
    immediate: true,
  }
);

const formattedDate = computed(() => {
  if (date.value === null) return null;

  const dateTime = moment(date.value);
  const dateString = dateTime.format("yyyy-MM-DD");
  return dateString;
});

function updateDateAndCloseMenu(newDate: unknown) {
  if (newDate instanceof Date) {
    date.value = newDate;
    emit("update:modelValue", newDate.toISOString());
  } else {
    date.value = null;
    emit("update:modelValue", null);
  }

  menu.value = false;
}

function validate() {
  errorMessages.value = "";
  error.value = false;

  props.rules.forEach((rule) => {
    const result = rule(props.modelValue);
    if (typeof result === "string") {
      errorMessages.value = result;
      error.value = true;
    }
  });
}
</script>
