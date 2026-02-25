export interface AIChatLog {
  LOG_ID: number;
  QUESTION_ID: number;
  MODEL: string;
  USER_MESSAGE: string;
  ASSISTANT_MESSAGE: string;
  PROMPT_EVAL_COUNT?: number;
  EVAL_COUNT?: number;
  TOTAL_DURATION?: number;
  CREATED_AT: Date;
}

export interface AIChatLog_Create {
  QUESTION_ID: number;
  MODEL: string;
  USER_MESSAGE: string;
  ASSISTANT_MESSAGE: string;
  PROMPT_EVAL_COUNT?: number;
  EVAL_COUNT?: number;
  TOTAL_DURATION?: number;
}
