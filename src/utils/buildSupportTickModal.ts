export interface ModalMeta {
  channel_id: string;
  user_id: string;
}

export function buildSupportTicketModal(meta: ModalMeta) {
  return {
    type: "modal",
    callback_id: "support_modal",
    private_metadata: JSON.stringify(meta),

    title: { type: "plain_text", text: "Submit Support Ticket", emoji: true },
    submit: { type: "plain_text", text: "Create", emoji: true },
    close: { type: "plain_text", text: "Cancel", emoji: true },

    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🆘  Need a hand?", emoji: true },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Fill in the details below – we’ll create a ClickUp task *instantly*.",
          },
        ],
      },
      {
        type: "input",
        block_id: "request_type",
        label: { type: "plain_text", text: "Request Type" },
        element: {
          type: "static_select",
          action_id: "input",
          placeholder: { type: "plain_text", text: "Select one" },
          options: [
            {
              text: { type: "plain_text", text: "💻  Technical Support" },
              value: "Technical Support",
            },
            {
              text: { type: "plain_text", text: "📊  CA Assistance" },
              value: "CA Assistance",
            },
            { text: { type: "plain_text", text: "💡  Other" }, value: "Other" },
          ],
        },
      },
      {
        type: "input",
        block_id: "priority",
        label: { type: "plain_text", text: "Priority" },
        element: {
          type: "static_select",
          action_id: "input",
          placeholder: { type: "plain_text", text: "Choose…" },
          options: [
            {
              text: { type: "plain_text", text: "🚨  Urgent" },
              value: "urgent",
            },
            { text: { type: "plain_text", text: "🔴  High" }, value: "high" },
            {
              text: { type: "plain_text", text: "🟡  Normal" },
              value: "normal",
            },
            { text: { type: "plain_text", text: "🟢  Low" }, value: "low" },
          ],
        },
      },
      {
        type: "input",
        block_id: "subject",
        label: { type: "plain_text", text: "Subject" },
        element: {
          type: "plain_text_input",
          action_id: "input",
          placeholder: {
            type: "plain_text",
            text: "Short summary – e.g. “Login error”",
          },
          max_length: 100,
        },
      },
      {
        type: "input",
        block_id: "description",
        label: { type: "plain_text", text: "Detailed Description" },
        element: {
          type: "plain_text_input",
          action_id: "input",
          placeholder: {
            type: "plain_text",
            text: "Steps to reproduce, screenshots, etc.",
          },
          multiline: true,
          max_length: 1000,
        },
      },
    ],
  };
}
