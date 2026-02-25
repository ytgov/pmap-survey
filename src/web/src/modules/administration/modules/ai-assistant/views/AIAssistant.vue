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

  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="mb-4">
          <v-icon>mdi-chat-processing</v-icon>
          AI Assistant
        </h1>
      </v-col>
    </v-row>

    <!-- Connection Status -->
    <v-row>
      <v-col cols="12">
        <v-alert
          v-if="!isConnected && !isLoading"
          type="error"
          variant="tonal"
          class="mb-4">
          <v-row align="center">
            <v-col>
              <strong>Ollama Not Connected</strong>
              <p class="mb-0">Unable to connect to Ollama service. Please ensure Ollama is running on port 11434.</p>
            </v-col>
            <v-col cols="auto">
              <v-btn @click="checkConnection" color="primary" prepend-icon="mdi-refresh">
                Retry Connection
              </v-btn>
            </v-col>
          </v-row>
        </v-alert>

        <v-alert
          v-if="isConnected"
          type="success"
          variant="tonal"
          class="mb-4">
          <strong>Connected to Ollama</strong>
          <p class="mb-0">{{ models.length }} model(s) available</p>
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <!-- Chat Interface -->
      <v-col cols="12" md="8">
        <v-card elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Chat with AI</span>
            <div class="d-flex gap-2">
              <v-select
                v-model="selectedModel"
                :items="models"
                item-title="name"
                item-value="name"
                label="Model"
                density="compact"
                style="max-width: 250px"
                hide-details
                :disabled="!isConnected"></v-select>
              <v-btn
                @click="clearMessages"
                icon="mdi-delete"
                variant="text"
                size="small"
                :disabled="!hasMessages"></v-btn>
            </div>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text style="height: 500px; overflow-y: auto" ref="chatContainer">
            <div v-if="messages.length === 0" class="text-center text-grey pa-8">
              <v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
              <p class="text-h6 mt-4">Start a conversation</p>
              <p>Type a message below to chat with the AI assistant</p>
            </div>

            <div v-for="(message, index) in messages" :key="index" class="mb-4">
              <v-row :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
                <v-col cols="auto" style="max-width: 80%">
                  <v-card
                    :color="message.role === 'user' ? '#7A9A01' : 'grey-lighten-3'"
                    :class="message.role === 'user' ? 'text-white' : ''">
                    <v-card-text>
                      <div class="d-flex align-center mb-2">
                        <v-icon
                          :color="message.role === 'user' ? 'white' : 'grey-darken-2'"
                          size="small"
                          class="mr-2">
                          {{ message.role === 'user' ? 'mdi-account' : 'mdi-robot' }}
                        </v-icon>
                        <strong :class="message.role === 'user' ? 'text-white' : 'text-grey-darken-2'">
                          {{ message.role === 'user' ? 'You' : 'AI Assistant' }}
                        </strong>
                        <v-spacer></v-spacer>
                        <span class="text-caption" :class="message.role === 'user' ? 'text-white' : 'text-grey'">
                          {{ formatTime(message.timestamp) }}
                        </span>
                      </div>
                      <div style="white-space: pre-wrap">{{ message.content }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <div v-if="isLoading" class="mb-4">
              <v-row>
                <v-col cols="auto" style="max-width: 80%">
                  <v-card color="grey-lighten-3">
                    <v-card-text>
                      <div class="d-flex align-center mb-2">
                        <v-icon color="grey-darken-2" size="small" class="mr-2">mdi-robot</v-icon>
                        <strong class="text-grey-darken-2">AI Assistant</strong>
                      </div>
                      <v-progress-circular indeterminate color="primary" size="20"></v-progress-circular>
                      <span class="ml-2">Thinking...</span>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-4">
            <v-textarea
              v-model="newMessage"
              label="Type your message..."
              rows="2"
              variant="outlined"
              auto-grow
              :disabled="!isConnected || isLoading"
              @keydown.ctrl.enter="sendMessage"
              @keydown.meta.enter="sendMessage"
              hide-details>
            </v-textarea>
            <v-btn
              @click="sendMessage"
              color="primary"
              icon="mdi-send"
              :disabled="!newMessage.trim() || !isConnected || isLoading"
              class="ml-2"></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Sidebar -->
      <v-col cols="12" md="4">
        <!-- Model Management -->
        <v-card elevation="2" class="mb-4">
          <v-card-title>Model Management</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="model in models"
                :key="model.name"
                :title="model.name"
                :subtitle="`${formatBytes(model.size)}`">
                <template v-slot:append>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    @click="confirmDeleteModel(model.name)"
                    :disabled="isLoading"></v-btn>
                </template>
              </v-list-item>

              <v-list-item v-if="models.length === 0">
                <v-list-item-title class="text-grey">No models available</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Default Model Setting -->
        <v-card elevation="2" class="mb-4">
          <v-card-title>Default Model Setting</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-select
              v-model="defaultModelSelection"
              :items="models"
              item-title="name"
              item-value="name"
              label="Default Model"
              variant="outlined"
              density="compact"
              :disabled="!isConnected || models.length === 0"
              hint="This model will be used by default for AI features"
              persistent-hint></v-select>
            <v-btn
              @click="saveDefaultModel"
              color="primary"
              block
              class="mt-4"
              :disabled="!defaultModelSelection || isSavingDefault"
              :loading="isSavingDefault">
              <v-icon left>mdi-content-save</v-icon>
              Save Default Model
            </v-btn>
            <v-alert
              v-if="defaultModel"
              type="info"
              variant="tonal"
              class="mt-4"
              density="compact">
              Current default: <strong>{{ defaultModel }}</strong>
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Pull New Model -->
        <v-card elevation="2">
          <v-card-title>Download Model</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-text-field
              v-model="newModelName"
              label="Model name (e.g., llama2, mistral)"
              variant="outlined"
              density="compact"
              :disabled="!isConnected || isLoading"
              @keydown.enter="pullModel"></v-text-field>
            <v-btn
              @click="pullModel"
              color="primary"
              block
              :disabled="!newModelName.trim() || !isConnected || isLoading"
              :loading="isLoading">
              <v-icon left>mdi-download</v-icon>
              Download Model
            </v-btn>
            <v-alert type="info" variant="tonal" class="mt-4" density="compact">
              Popular models: llama2, mistral, codellama, phi
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- Delete Confirmation Dialog -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title>Delete Model?</v-card-title>
      <v-card-text>
        Are you sure you want to delete the model <strong>{{ modelToDelete }}</strong>?
        This action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="deleteDialog = false" variant="text">Cancel</v-btn>
        <v-btn @click="deleteModel" color="error" variant="text" :loading="isLoading">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { mapState, mapActions } from "pinia";
import { useAIAssistantStore } from "../store";

export default {
  name: "AIAssistant",
  data: () => ({
    breadcrumbs: [
      { title: "Home", to: "/administration", disabled: false },
      { title: "AI Assistant", disabled: false },
    ],
    newMessage: "",
    newModelName: "",
    deleteDialog: false,
    modelToDelete: "",
    defaultModelSelection: "",
  }),
  computed: {
    ...mapState(useAIAssistantStore, [
      "messages",
      "models",
      "selectedModel",
      "defaultModel",
      "isConnected",
      "isLoading",
      "isSavingDefault",
      "error",
      "hasMessages",
    ]),
  },
  async mounted() {
    const store = useAIAssistantStore();
    await store.checkConnection();
    await store.loadDefaultModel();
    this.defaultModelSelection = store.defaultModel;
  },
  methods: {
    async checkConnection() {
      const store = useAIAssistantStore();
      await store.checkConnection();
    },
    async sendMessage() {
      if (!this.newMessage.trim() || this.isLoading) return;

      const message = this.newMessage;
      this.newMessage = "";

      try {
        const store = useAIAssistantStore();
        await store.sendMessage(message);
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (error: any) {
        console.error("Failed to send message:", error);
      }
    },
    clearMessages() {
      const store = useAIAssistantStore();
      store.clearMessages();
    },
    async pullModel() {
      if (!this.newModelName.trim()) return;

      try {
        const store = useAIAssistantStore();
        await store.pullModel(this.newModelName);
        this.newModelName = "";
      } catch (error: any) {
        console.error("Failed to pull model:", error);
      }
    },
    confirmDeleteModel(modelName: string) {
      this.modelToDelete = modelName;
      this.deleteDialog = true;
    },
    async deleteModel() {
      try {
        const store = useAIAssistantStore();
        await store.deleteModel(this.modelToDelete);
        this.deleteDialog = false;
        this.modelToDelete = "";
      } catch (error: any) {
        console.error("Failed to delete model:", error);
      }
    },
    async saveDefaultModel() {
      if (!this.defaultModelSelection) return;
      try {
        const store = useAIAssistantStore();
        await store.saveDefaultModel(this.defaultModelSelection);
      } catch (error: any) {
        console.error("Failed to save default model:", error);
      }
    },
    formatTime(date: Date) {
      return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
    formatBytes(bytes: number) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    },
    scrollToBottom() {
      const container = this.$refs.chatContainer as HTMLElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
  },
  watch: {
    selectedModel(newModel) {
      const store = useAIAssistantStore();
      store.setModel(newModel);
    },
  },
};
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
