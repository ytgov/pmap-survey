<template>
  <div>
    <v-label style="text-overflow: inherit; overflow: visible; white-space: inherit">{{ question.ASK }}</v-label>

    <!-- Fallback Textarea (when AI service is unavailable) -->
    <v-row class="mt-3" v-if="serviceUnavailable">
      <v-col>
        <v-textarea
          v-model="fallbackAnswer"
          class="mt-4"
          :counter="question.MAX_LENGTH ?? 2000"
          :maxlength="question.MAX_LENGTH ?? 2000"
          persistent-counter
          @update:model-value="updateFallbackAnswer"></v-textarea>
      </v-col>
    </v-row>

    <!-- Conversation Thread Display (when AI service is available) -->
    <v-row class="mt-3" v-else>
      <v-col>
        <v-card variant="outlined" class="ai-conversation">
          <v-card-text style="max-height: 400px; overflow-y: auto" ref="chatContainer">
            <div v-for="(message, index) in conversationThread" :key="index" class="mb-3">
              <v-row :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
                <v-col cols="auto" style="max-width: 85%">
                  <v-card
                    :color="message.role === 'user' ? '#7A9A01' : 'grey-lighten-4'"
                    :class="message.role === 'user' ? 'text-white' : ''"
                    elevation="1">
                    <v-card-text class="pa-3">
                      <div class="d-flex align-center mb-1">
                        <v-icon :color="message.role === 'user' ? 'white' : 'grey-darken-2'" size="small" class="mr-2">
                          {{ message.role === "user" ? "mdi-account" : "mdi-robot" }}
                        </v-icon>
                        <strong
                          class="text-caption"
                          :class="message.role === 'user' ? 'text-white' : 'text-grey-darken-2'">
                          {{ message.role === "user" ? "You" : "AI" }}
                        </strong>
                      </div>
                      <div style="white-space: pre-wrap">{{ message.content }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <div v-if="isLoading" class="mb-3">
              <v-row>
                <v-col cols="auto" style="max-width: 85%">
                  <v-card color="grey-lighten-4" elevation="1">
                    <v-card-text class="pa-3">
                      <div class="d-flex align-center">
                        <v-icon color="grey-darken-2" size="small" class="mr-2">mdi-robot</v-icon>
                        <v-progress-circular indeterminate color="primary" size="16"></v-progress-circular>
                        <span class="ml-2 text-caption">Thinking...</span>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-3">
            <v-textarea
              v-model="newMessage"
              label="Type your response..."
              rows="2"
              variant="outlined"
              auto-grow
              density="compact"
              :disabled="isLoading"
              @keydown.ctrl.enter="sendMessage"
              @keydown.meta.enter="sendMessage"
              hide-details>
            </v-textarea>
            <v-btn
              @click="sendMessage"
              color="primary"
              icon="mdi-send"
              size="small"
              :disabled="!newMessage.trim() || isLoading"
              class="ml-2"></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick, watch } from "vue";
import axios from "axios";
import { apiBaseUrl } from "@/config";

const props = defineProps(["question"]);
const emit = defineEmits(["answerChanged"]);

const conversationThread = ref([]);
const newMessage = ref("");
const isLoading = ref(false);
const chatContainer = ref(null);
const serviceUnavailable = ref(false);
const fallbackAnswer = ref("");

const API_BASE = apiBaseUrl + "/api/ai";

onMounted(async () => {
  // Check if AI service is available
  // Note: This requires Ollama to be running at http://localhost:11434 (or configured OLLAMA_BASE_URL)
  // Start Ollama with: `ollama serve` or use Docker: `docker-compose -f docker-compose.dev.yaml up -d`
  try {
    await axios.get(`${API_BASE}`);
    serviceUnavailable.value = false;
  } catch (error) {
    console.error("AI service is not available. Ollama may not be running:", error);
    serviceUnavailable.value = true;

    // Load existing answer into fallback textarea
    if (props.question && props.question.answer) {
      try {
        // Try to parse as conversation first
        const savedConversation = JSON.parse(props.question.answer);
        if (Array.isArray(savedConversation)) {
          // If it's a conversation, extract text from it
          fallbackAnswer.value = savedConversation
            .filter((msg) => msg.role !== "system")
            .map((msg) => `${msg.role === "user" ? "You" : "AI"}: ${msg.content}`)
            .join("\n\n");
        } else {
          fallbackAnswer.value = props.question.answer;
        }
      } catch (e) {
        // If not JSON, treat as plain text
        fallbackAnswer.value = props.question.answer;
      }
    }
    return;
  }

  // Load conversation from question answer if it exists
  if (props.question && props.question.answer) {
    try {
      const savedConversation = JSON.parse(props.question.answer);
      if (Array.isArray(savedConversation)) {
        // Filter out system messages since backend will add them
        conversationThread.value = savedConversation.filter(msg => msg.role !== 'system');
      }
    } catch (e) {
      // If parsing fails, start fresh
      conversationThread.value = [];
    }
  }
});

function updateFallbackAnswer() {
  props.question.answer = fallbackAnswer.value;
  emit("answerChanged", fallbackAnswer.value);
}

async function sendMessage() {
  if (!newMessage.value.trim() || isLoading.value) return;

  const userMessageContent = newMessage.value.trim();
  newMessage.value = "";

  // Add user message to thread
  const userMessage = {
    role: "user",
    content: userMessageContent,
    timestamp: new Date(),
  };
  conversationThread.value.push(userMessage);

  isLoading.value = true;

  try {
    // Prepare messages for API (exclude system messages - backend will add the correct one)
    const apiMessages = conversationThread.value
      .filter(msg => msg.role !== 'system')
      .map(({ role, content }) => ({
        role,
        content,
      }));

    console.log("Sending messages to AI:", apiMessages);

    const response = await axios.post(`${API_BASE}/chat`, {
      messages: apiMessages,
      questionId: props.question.QID,
    });

    // Add AI response to thread
    const aiMessage = {
      role: "assistant",
      content: response.data.data.message.content,
      timestamp: new Date(),
    };
    conversationThread.value.push(aiMessage);

    // Save conversation to answer
    saveConversation();

    // Scroll to bottom
    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    console.error("Failed to send message to AI:", error);
    // Remove user message if API call failed
    conversationThread.value.pop();

    // If chat fails, mark service as unavailable and switch to fallback mode
    serviceUnavailable.value = true;

    // Convert conversation to fallback text
    fallbackAnswer.value = conversationThread.value
      .filter((msg) => msg.role !== "system")
      .map((msg) => `${msg.role === "user" ? "You" : "AI"}: ${msg.content}`)
      .join("\n\n");
  } finally {
    isLoading.value = false;
  }
}

function saveConversation() {
  const conversationData = JSON.stringify(conversationThread.value);
  props.question.answer = conversationData;
  emit("answerChanged", conversationData);
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

// Watch for changes to conversation thread
watch(
  conversationThread,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
  },
  { deep: true }
);
</script>

<style scoped>
.ai-conversation {
  background-color: #fafafa;
}
</style>
