export interface SlashCommandPayload {
  text?: string;
  trigger_id: string;
  channel_id: string;
  user_id: string;
}

export interface ViewSubmissionPayload {
  type: "view_submission";
  user: { id: string; username: string };
  view: {
    callback_id: "support_modal";
    private_metadata: string;
    state: { values: Record<string, any> };
  };
}
