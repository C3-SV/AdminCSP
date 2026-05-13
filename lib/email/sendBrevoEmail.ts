import "server-only";

type BrevoRecipient = {
  email: string;
  name?: string;
};

type SendBrevoEmailInput = {
  to: BrevoRecipient;
  templateId: number;
  params: Record<string, unknown>;
};

type BrevoSendEmailResponse = {
  messageId?: string;
  [key: string]: unknown;
};

function getBrevoApiKey() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: BREVO_API_KEY");
  }
  if (apiKey.startsWith("xsmtpsib-")) {
    throw new Error(
      "BREVO_API_KEY appears to be an SMTP key (xsmtpsib-...). Use a Brevo API key (xkeysib-...) for /v3/smtp/email.",
    );
  }
  return apiKey;
}

export async function sendBrevoEmail({
  to,
  templateId,
  params,
}: SendBrevoEmailInput): Promise<BrevoSendEmailResponse> {
  const apiKey = getBrevoApiKey();

  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim();
  const replyToEmail = process.env.BREVO_REPLY_TO_EMAIL?.trim();
  const replyToName = process.env.BREVO_REPLY_TO_NAME?.trim();

  const body: Record<string, unknown> = {
    to: [{ email: to.email, name: to.name }],
    templateId,
    params,
  };

  if (senderEmail) {
    body.sender = {
      email: senderEmail,
      name: senderName || undefined,
    };
  }

  if (replyToEmail) {
    body.replyTo = {
      email: replyToEmail,
      name: replyToName || undefined,
    };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let responseJson: BrevoSendEmailResponse = {};
  if (responseText) {
    try {
      responseJson = JSON.parse(responseText) as BrevoSendEmailResponse;
    } catch {
      responseJson = {};
    }
  }

  if (!response.ok) {
    const errorMessage =
      typeof responseJson.message === "string"
        ? responseJson.message
        : `Brevo request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return responseJson;
}
