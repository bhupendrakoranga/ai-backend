type EmailTemplateOptions = {
  actionLabel?: string;
  actionUrl?: string;
  body: string;
  heroImageSrc?: string;
  previewText: string;
  title: string;
}

type PasswordResetEmailOptions = {
  expiresInMinutes: number;
  firstName: string;
  resetUrl: string;
}

const renderEmailTemplate = ({
  actionLabel,
  actionUrl,
  body,
  heroImageSrc,
  previewText,
  title,
}: EmailTemplateOptions) => {
  const heroImage = heroImageSrc
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
        <tr>
          <td align="center">
            <img src="${heroImageSrc}" alt="" width="210" style="display: block; max-width: 210px; width: 48%; height: auto;" />
          </td>
        </tr>
      </table>
    `
    : "";

  const actionButton =
    actionLabel && actionUrl
      ? `
        <tr>
          <td align="center" style="padding: 30px 0 8px;">
            <a href="${actionUrl}" style="display: inline-block; border-radius: 8px; background: #8e2363; box-shadow: 0 12px 24px rgba(142, 35, 99, 0.24); color: #ffffff; font-size: 15px; font-weight: 700; line-height: 1; padding: 16px 28px; text-decoration: none;">
              ${actionLabel}
            </a>
          </td>
        </tr>
      `
      : "";

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f8f1f6; color: #3f3f42; font-family: Arial, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
      ${previewText}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8f1f6; padding: 36px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; overflow: hidden; border: 1px solid #f0dbe8; border-radius: 18px; background: #ffffff; box-shadow: 0 24px 60px rgba(75, 31, 57, 0.14);">
            <tr>
              <td style="background: #8e2363; background-image: linear-gradient(135deg, #8e2363 0%, #b8327e 100%); padding: 34px 34px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <p style="display: inline-block; margin: 0 0 18px; border: 1px solid rgba(255, 255, 255, 0.32); border-radius: 999px; color: #f9ddec; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; padding: 8px 12px; text-transform: uppercase;">
                        Account Security
                      </p>
                      <h1 style="margin: 0; color: #ffffff; font-size: 30px; line-height: 1.22;">
                        ${title}
                      </h1>
                      <p style="margin: 12px 0 0; color: #f7d7e8; font-size: 15px; line-height: 1.6;">
                        Secure password assistance for your account.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 34px;">
                ${heroImage}
                ${body}
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${actionButton}
                </table>
                <p style="margin: 30px 0 0; border-top: 1px solid #f0e4eb; color: #77777b; font-size: 13px; line-height: 1.7; padding-top: 20px;">
                  If you did not request this email, you can safely ignore it.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin: 18px 0 0; color: #9a9aa0; font-size: 12px;">
            This is an automated message. Please do not reply.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};

export const renderPasswordResetEmail = ({
  expiresInMinutes,
  firstName,
  resetUrl,
}: PasswordResetEmailOptions) => {
  return renderEmailTemplate({
    title: "Reset your password",
    previewText: "Use this secure link to reset your password.",
    heroImageSrc: "cid:login-illustration",
    body: `
      <p style="margin: 0 0 16px; color: #535356; font-size: 16px; line-height: 1.7;">
        Hi ${firstName},
      </p>
      <p style="margin: 0; color: #535356; font-size: 16px; line-height: 1.7;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0 0;">
        <tr>
          <td style="background: #fbf4f8; border: 1px solid #efd6e4; border-radius: 12px; padding: 16px 18px;">
            <p style="margin: 0; color: #8e2363; font-size: 14px; font-weight: 700; line-height: 1.4;">
              Link expires in ${expiresInMinutes} minutes
            </p>
            <p style="margin: 6px 0 0; color: #77777b; font-size: 13px; line-height: 1.6;">
              For your security, this reset link can only be used for password recovery.
            </p>
          </td>
        </tr>
      </table>
    `,
    actionLabel: "Reset Password",
    actionUrl: resetUrl,
  });
};
