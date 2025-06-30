// slack-command.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { App, LogLevel } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.DEBUG,
});

const modalView = {
  type: 'modal',
  callback_id: 'support_ticket_modal',
  title: {
    type: 'plain_text',
    text: 'New Support Ticket',
  },
  submit: {
    type: 'plain_text',
    text: 'Submit',
  },
  close: {
    type: 'plain_text',
    text: 'Cancel',
  },
  blocks: [
    {
      type: 'input',
      block_id: 'request_type_block',
      label: {
        type: 'plain_text',
        text: 'Request Type',
      },
      element: {
        type: 'static_select',
        action_id: 'request_type',
        placeholder: {
          type: 'plain_text',
          text: 'Select request type',
        },
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Technical Support',
            },
            value: 'technical_support',
          },
          {
            text: {
              type: 'plain_text',
              text: 'CA Assistance',
            },
            value: 'ca_assistance',
          },
          {
            text: {
              type: 'plain_text',
              text: 'Other',
            },
            value: 'other',
          },
        ],
      },
    },
    {
      type: 'input',
      block_id: 'priority_block',
      label: {
        type: 'plain_text',
        text: 'Priority Level',
      },
      element: {
        type: 'static_select',
        action_id: 'priority',
        placeholder: {
          type: 'plain_text',
          text: 'Select priority',
        },
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Critical',
            },
            value: 'critical',
          },
          {
            text: {
              type: 'plain_text',
              text: 'Urgent',
            },
            value: 'urgent',
          },
          {
            text: {
              type: 'plain_text',
              text: 'Important',
            },
            value: 'important',
          },
          {
            text: {
              type: 'plain_text',
              text: 'Desirable',
            },
            value: 'desirable',
          },
        ],
      },
    },
    {
      type: 'input',
      block_id: 'subject_block',
      label: {
        type: 'plain_text',
        text: 'Subject',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'subject',
        placeholder: {
          type: 'plain_text',
          text: 'Brief title (max 100 chars)',
        },
        max_length: 100,
      },
    },
    {
      type: 'input',
      block_id: 'description_block',
      label: {
        type: 'plain_text',
        text: 'Description',
      },
      element: {
        type: 'plain_text_input',
        action_id: 'description',
        multiline: true,
        placeholder: {
          type: 'plain_text',
          text: 'Describe the issue (max 1000 chars)',
        },
        max_length: 1000,
      },
    },
    {
      type: 'input',
      block_id: 'affected_users_block',
      label: {
        type: 'plain_text',
        text: 'Affected User(s)',
      },
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: 'affected_users',
        placeholder: {
          type: 'plain_text',
          text: 'e.g. John Doe, @jane',
        },
      },
    },
    {
      type: 'input',
      block_id: 'additional_context_block',
      label: {
        type: 'plain_text',
        text: 'Additional Context',
      },
      optional: true,
      element: {
        type: 'plain_text_input',
        action_id: 'additional_context',
        multiline: true,
        placeholder: {
          type: 'plain_text',
          text: 'Links, screenshots, or notes',
        },
      },
    },
  ],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { command, trigger_id } = req.body;

    if (command === '/balance' || command === '/balance new') {
      try {
        await app.client.views.open({
          trigger_id,
          view: modalView,
        });
        return res.status(200).send();
      } catch (error) {
        console.error('Failed to open modal:', error);
        return res.status(500).send('Error opening modal');
      }
    }
  }
  return res.status(404).send('Not found');
}
