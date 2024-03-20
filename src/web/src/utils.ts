import moment from "moment";
import markdownit from "markdown-it";

export function FormatDate(input: Date): string {
  return moment.utc(input).format("MMMM D, YYYY");
}

export function PrettyDate(input: Date): string {
  return moment.utc(input).format("dddd, MMM Do YYYY");
}

export function FormatDateAndTime(input: Date): string {
  return `${FormatDate(input)} @ ${FormatTime(input)}`;
}

export function FormatTime(input: Date): string {
  return moment.utc(input).format("h:mm A");
}

export function FormatYesNo(input: any): string {
  if (input && (input == true || input == "y" || input == "Y" || input == 1)) return "Yes";
  return "No";
}

export function RenderMarkdown(input: string): { output: string; isMarkdown: boolean } {
  let containsNewlines = input.includes("\\n");
  let containsHash = input.includes("#");

  if (containsNewlines || containsHash) {
    return { output: markdownit().render(input), isMarkdown: true };
  }

  return { output: input, isMarkdown: false };
}
