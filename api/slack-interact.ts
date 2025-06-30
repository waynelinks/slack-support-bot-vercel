import axios from "axios";

export default async function handler(req, res) {
	if (req.method !== "POST") return res.status(405).send("Method not allowed");

	const payload = JSON.parse(req.body.payload);

  const metadata = JSON.parse(payload.view.private_metadata || "{}");
	const channelId = metadata.channel_id;
	const userId = metadata.user_id;


	if (
		payload.type === "view_submission" &&
		payload.view.callback_id === "support_modal"
	) {
		const values = payload.view.state.values;

		const requestType = values.request_type.input.selected_option.value;
		const priority = values.priority.input.selected_option.value;
		const subject = values.subject.input.value;
		const description = values.description.input.value;
		const slackUser = payload.user.username;

		try {
			if (!process.env.GHL_WEBHOOK_URL) {
				throw new Error('GHL_WEBHOOK_URL is not defined');
			}
			await axios.post(process.env.GHL_WEBHOOK_URL, {
				slack_user: slackUser,
				slack_user_id: userId,
				slack_channel_id: channelId,
				request_type: requestType,
				priority,
				subject,
				description,
			});

			return res.status(200).json({ response_action: "clear" });
		} catch (err) {
			console.error("Error sending to GHL:", err);
			return res.status(200).json({
				response_action: "errors",
				errors: {
					subject: "Failed to send ticket to GHL",
				},
			});
		}
	}

	return res.status(200).send();
}