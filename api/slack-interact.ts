// pages/api/slack-interact.ts
import { NextApiRequest, NextApiResponse } from 'next';
import qs from 'qs';
import axios from 'axios';

const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const payload = qs.parse(req.body).payload as string;
    const parsed = JSON.parse(payload);

    if (parsed.type === 'view_submission' && parsed.view.callback_id === 'support_ticket_modal') {
      const values = parsed.view.state.values;
      const user = parsed.user.username;

      const ticketData = {
        slack_user: user,
        request_type: values.request_type_block.request_type.selected_option?.value,
        priority: values.priority_block.priority.selected_option?.value,
        subject: values.subject_block.subject.value,
        description: values.description_block.description.value,
        affected_users: values.affected_users_block?.affected_users?.value || '',
        additional_context: values.additional_context_block?.additional_context?.value || '',
      };

      // Optional: send to GHL webhook
      await axios.post(GHL_WEBHOOK_URL!, ticketData);

      return res.status(200).json({ response_action: 'clear' });
    }

    return res.status(200).end();
  } catch (err) {
    console.error('Slack Interact Error:', err);
    return res.status(500).send('Internal Server Error');
  }
}
