const axios = require('axios');
const prisma = require('./db');

async function getCredentials() {
  const envToken = (process.env.WHATSAPP_TOKEN || '').trim();
  const envPhoneId = (process.env.PHONE_ID || '').trim();

  try {
    const dbSettings = await prisma.businessSettings.findUnique({ where: { id: 1 } });
    const token = (envToken || dbSettings?.whatsappToken || '').trim();
    const phoneId = (envPhoneId || dbSettings?.whatsappPhoneId || '').trim();
    const isMock = !token || token.startsWith('your_') || token === 'mock_token' || !phoneId || phoneId.startsWith('your_');
    return { token, phoneId, isMock };
  } catch (e) {
    console.error('[WhatsApp Service] Error reading DB settings:', e.message);
  }

  const isMock = !envToken || envToken.startsWith('your_') || envToken === 'mock_token' || !envPhoneId || envPhoneId.startsWith('your_');
  return { token: envToken, phoneId: envPhoneId, isMock };
}

/**
 * Sends a plain text WhatsApp message to a customer.
 */
async function sendMessage(to, text) {
  const { token, phoneId, isMock } = await getCredentials();
  if (isMock) {
    console.log(`[WhatsApp Outbound Text] To: ${to} | Body: ${text}`);
    return { mock: true, success: true };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[WhatsApp Service Error] Text message send failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Sends interactive quick reply buttons to a customer.
 */
async function sendButtons(to, text, buttons) {
  const { token, phoneId, isMock } = await getCredentials();
  if (isMock) {
    const btnLabels = buttons.map(b => `[${b.reply.title} (ID: ${b.reply.id})]`).join(' ');
    console.log(`[WhatsApp Outbound Buttons] To: ${to} | Prompt: ${text} | Options: ${btnLabels}`);
    return { mock: true, success: true };
  }

  if (buttons.length > 3) {
    console.warn(`[WhatsApp Service] WARNING: Action buttons count is ${buttons.length}. Meta limits quick reply lists to 3 buttons. Truncating.`);
    buttons = buttons.slice(0, 3);
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: text },
          action: {
            buttons: buttons
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending WhatsApp buttons message:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Sends a pre-approved utility message template.
 */
async function sendTemplate(to, templateName, variables) {
  const { token, phoneId, isMock } = await getCredentials();
  if (isMock) {
    console.log(`[WhatsApp Outbound Template] To: ${to} | Name: ${templateName} | Variables: ${JSON.stringify(variables)}`);
    return { mock: true, success: true };
  }

  try {
    const parameters = variables.map(v => ({ type: 'text', text: String(v) }));
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: parameters
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Error sending WhatsApp template (${templateName}):`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Sends a list message (dropdown menu) to a customer.
 */
async function sendList(to, text, buttonLabel, rows) {
  const { token, phoneId, isMock } = await getCredentials();
  if (isMock) {
    const listLabels = rows.map(r => `[${r.title} (ID: ${r.id})]`).join(' ');
    console.log(`[WhatsApp Outbound List] To: ${to} | Prompt: ${text} | Button: ${buttonLabel} | Options: ${listLabels}`);
    return { mock: true, success: true };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: text },
          action: {
            button: buttonLabel,
            sections: [
              {
                title: 'Options',
                rows: rows
              }
            ]
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp list message:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = {
  sendMessage,
  sendButtons,
  sendTemplate,
  sendList,
  isMockMode: () => getCredentials().isMock
};
