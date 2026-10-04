import nodemailer from "nodemailer";

type EmailAttachment = {
  cid?: string;
  contentType?: string;
  filename?: string;
  path: string;
}

type SendEmailOptions = {
  attachments?: EmailAttachment[];
  html: string;
  subject: string;
  text?: string;
  to: string;
}

const getRequiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is required to send email`);
  }

  return value;
};

const getMailTransporter = () => {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port,
    secure: port === 465,
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });
};

export const sendEmail = async ({
  attachments,
  html,
  subject,
  text,
  to,
}: SendEmailOptions) => {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  await getMailTransporter().sendMail({
    attachments,
    from,
    to,
    subject,
    text,
    html,
  });
};
