import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { command, trigger_id } = req.body;

  if (command !== "/support-request") {
    return res.status(400).send("Invalid command");
  }

  try {
    await slack.views.open({
      trigger_id,
      view: {
        type: "modal",
        callback_id: "support_modal",
        title: { type: "plain_text", text: "Submit Support Ticket" },
        submit: { type: "plain_text", text: "Submit" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "subject",
            label: { type: "plain_text", text: "Subject" },
            element: { type: "plain_text_input", action_id: "input" }
          },
          {
            type: "input",
            block_id: "description",
            label: { type: "plain_text", text: "Description" },
            element: { type: "plain_text_input", action_id: "input", multiline: true }
          },
          {
            type: "input",
            block_id: "priority",
            label: { type: "plain_text", text: "Priority" },
            element: {
              type: "static_select",
              action_id: "input",
              options: [
                { text: { type: "plain_text", text: "Critical" }, value: "Critical" },
                { text: { type: "plain_text", text: "Urgent" }, value: "Urgent" },
                { text: { type: "plain_text", text: "Important" }, value: "Important" },
                { text: { type: "plain_text", text: "Desirable" }, value: "Desirable" }
              ]
            }
          }
        ]
      }
    });

    res.status(200).send();
  } catch (error) {
    console.error("Slack error", error);
    res.status(500).send("Failed to open modal");
  }
}
