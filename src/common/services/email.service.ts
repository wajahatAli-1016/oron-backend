import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter?: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly fromAddress: string;
  private readonly enabled: boolean;
  private readonly inviteTtlMinutes: number;

  constructor() {
    const ttlRaw = parseInt(process.env.INVITE_TTL_MINUTES || '60', 10);
    this.inviteTtlMinutes = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 60;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const configuredFrom = process.env.SMTP_FROM;
    const smtpHost = (host || '').toLowerCase();
    const isGmailSmtp = smtpHost.includes('gmail');
    const configuredFromDomain = configuredFrom?.split('@')[1]?.toLowerCase();
    const smtpUserDomain = user?.split('@')[1]?.toLowerCase();

    // With Gmail SMTP, using a different "from" domain can pass sendMail
    // but silently fail delivery (DMARC/SPF alignment issues).
    const shouldForceSmtpUserAsFrom =
      Boolean(isGmailSmtp && user && configuredFrom && configuredFromDomain !== smtpUserDomain);

    if (shouldForceSmtpUserAsFrom) {
      this.logger.warn(
        `SMTP_FROM (${configuredFrom}) does not match SMTP_USER domain for Gmail SMTP. Using SMTP_USER as from address.`,
      );
    }

    this.fromAddress =
      (shouldForceSmtpUserAsFrom ? user : configuredFrom) ||
      user ||
      `no-reply@${process.env.APP_DOMAIN || 'oron.com'}`;
    this.enabled = Boolean(host && user && pass);

    this.logger.log(`SMTP Configuration - Host: ${host}, Port: ${port}, User: ${user ? 'set' : 'not set'}, From: ${this.fromAddress}`);

    if (!this.enabled) {
      this.logger.warn('SMTP is not configured. Email delivery will be skipped.');
      return;
    }

    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('Email transporter created successfully');
  }

  async sendFacilityAdminCredentials(
    email: string,
    firstName: string,
    password: string,
    facilityName: string,
  ) {
    this.logger.log(`Attempting to send facility admin email to ${email}, enabled: ${this.enabled}`);

    if (!this.enabled || !this.transporter) {
      this.logger.warn(`Skipping facility admin email send because SMTP is not configured: ${email}`);
      return;
    }

    const subject = `Your Oron SeniorCare Account for ${facilityName}`;
    const text = `Hello ${firstName},\n\nYour account has been created for Oron SeniorCare.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease sign in with above credentials\n\nRegards,\nOron Health`;
    const html = `<p>Hello ${firstName},</p><p>Your account has been created for Oron SeniorCare.</p><p><strong>Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p><p>Please sign in with above credentials</p><p>Regards,<br/>Oron Health</p>`;

    try {
      this.logger.log(`Sending email to ${email} from ${this.fromAddress}`);
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(
        `Email sent. Message ID: ${info.messageId}, accepted: ${(info.accepted || []).join(',')}, rejected: ${(info.rejected || []).join(',')}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send facility admin email to ${email}`, error as any);
      throw new InternalServerErrorException('Failed to send facility admin credentials email');
    }
  }

  async sendSetPasswordLink(email: string, firstName: string, setPasswordUrl: string, contextName?: string) {
    this.logger.log(`Attempting to send set-password email to ${email}, enabled: ${this.enabled}`);

    if (!this.enabled || !this.transporter) {
      this.logger.warn(`Skipping set-password email send because SMTP is not configured: ${email}`);
      return;
    }

    const subject = contextName
      ? `Set your Oron SeniorCare password for ${contextName}`
      : 'Set your Oron SeniorCare password';

    const text =
      `Hello ${firstName},\n\n` +
      `Your Oron SeniorCare account has been created.\n\n` +
      `To set your password, use the "Set Your Password" button in this email. For your security, the invitation expires in ${this.describeInviteTtl()} and can only be used once.\n\n` +
      `If you did not expect this email, you can ignore it.\n\n` +
      `Regards,\nOron Health\n\n` +
      `5539 N Mesa\nEl Paso, TX 79912`;

    const headline = contextName ? `Your ${contextName} account is ready` : 'Your account is ready';
    const href = this.escapeHtmlAttr(setPasswordUrl);

    const mainInnerHtml = `
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;">
                <tr>
                  <td align="center" bgcolor="#16a34a" style="
                    border-radius:14px;
                    box-shadow:0 10px 24px rgba(22,163,74,0.28);
                  ">
                    <a
                      href="${href}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        display:inline-block;
                        padding:16px 28px;
                        color:#ffffff;
                        font-size:15px;
                        font-weight:700;
                        text-decoration:none;
                        border-radius:14px;
                      "
                    >
                      Set Your Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="
                margin:20px 0 0 0;
                font-size:14px;
                line-height:24px;
                color:#64748b;
              ">
                For your security, this invitation expires in ${this.escapeHtml(this.describeInviteTtl())} and can only be used once.
              </p>`;

    const html = this.buildBrandedTransactionalEmail({
      documentTitle: 'Oron SeniorCare — Set password',
      badgeLabel: 'Account setup',
      badgeBg: '#dcfce7',
      badgeColor: '#166534',
      headline,
      greetingName: firstName,
      introParagraphs: [
        'Your Oron SeniorCare account has been successfully created. To securely access your dashboard and begin managing your facility, please set your password using the button below.',
      ],
      mainInnerHtml,
    });

    try {
      this.logEmailLogoUsage('set-password');
      this.logger.log(`Sending set-password email to ${email} from ${this.fromAddress}`);
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(
        `Email sent. Message ID: ${info.messageId}, accepted: ${(info.accepted || []).join(',')}, rejected: ${(info.rejected || []).join(',')}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send set-password email to ${email}`, error as any);
      throw new InternalServerErrorException('Failed to send set-password email');
    }
  }

  async sendPasswordResetOtp(email: string, firstName: string, otp: string, ttlMinutes: number) {
    this.logger.log(`Attempting to send password reset OTP to ${email}, enabled: ${this.enabled}`);

    if (!this.enabled || !this.transporter) {
      this.logger.warn(`Skipping password reset OTP send because SMTP is not configured: ${email}`);
      return;
    }

    const subject = 'Your Oron SeniorCare password reset code';
    const text =
      `Hello ${firstName},\n\n` +
      `Use the following one-time code to reset your password:\n\n` +
      `${otp}\n\n` +
      `This code expires in ${ttlMinutes} minutes.\n\n` +
      `If you did not request a password reset, you can ignore this email.\n\n` +
      `Regards,\nOron Health`;

    const otpSafe = this.escapeHtml(otp);
    const ttlLabel = ttlMinutes === 1 ? '1 minute' : `${ttlMinutes} minutes`;

    const mainInnerHtml = `
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;width:100%;">
                <tr>
                  <td align="center" style="padding:0;">
                    <div style="
                      display:inline-block;
                      margin:0 auto;
                      padding:20px 28px;
                      background:#f8fafc;
                      border:2px solid #e2e8f0;
                      border-radius:16px;
                      font-family:Consolas,'Courier New',Courier,monospace;
                      font-size:32px;
                      font-weight:700;
                      letter-spacing:0.45em;
                      color:#0f172a;
                      line-height:1.2;
                      text-align:center;
                    ">
                      ${otpSafe}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="
                margin:28px 0 0 0;
                font-size:14px;
                line-height:24px;
                color:#64748b;
                text-align:center;
              ">
                This code expires in <strong style="color:#334155;">${this.escapeHtml(ttlLabel)}</strong>.
                Enter it on the password reset screen before it expires.
              </p>`;

    const html = this.buildBrandedTransactionalEmail({
      documentTitle: 'Oron SeniorCare — Password reset',
      badgeLabel: 'Password reset',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      headline: 'Your verification code',
      greetingName: firstName,
      introParagraphs: [
        'We received a request to reset the password for your Oron SeniorCare account. Use the one-time code below to continue.',
      ],
      mainInnerHtml,
    });

    try {
      this.logEmailLogoUsage('password-reset OTP');
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(
        `Password reset OTP email sent. Message ID: ${info.messageId}, accepted: ${(info.accepted || []).join(',')}, rejected: ${(info.rejected || []).join(',')}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP email to ${email}`, error as any);
      throw new InternalServerErrorException('Failed to send password reset OTP email');
    }
  }

  /** Reads and normalizes `EMAIL_LOGO_URL` (trim; strip wrapping quotes from .env). */
  private sanitizeEmailLogoUrl(): string {
    let logoUrl = (process.env.EMAIL_LOGO_URL || '').trim();
    if ((logoUrl.startsWith('"') && logoUrl.endsWith('"')) || (logoUrl.startsWith("'") && logoUrl.endsWith("'"))) {
      logoUrl = logoUrl.slice(1, -1).trim();
    }
    return logoUrl;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private escapeHtmlAttr(text: string): string {
    return this.escapeHtml(text).replace(/'/g, '&#39;');
  }

  private logEmailLogoUsage(kind: string): void {
    const logoUrl = this.sanitizeEmailLogoUrl();
    if (logoUrl) {
      this.logger.log(`${kind} email: using EMAIL_LOGO_URL for header image`);
    } else {
      this.logger.warn(`EMAIL_LOGO_URL is not set; ${kind} email will show branding without logo image`);
    }
  }

  /**
   * Shared table-based HTML layout for transactional emails (set password, OTP, etc.).
   * Inserts `EMAIL_LOGO_URL` when set; logo is scaled inside a fixed tile to avoid layout gaps.
   */
  private buildBrandedTransactionalEmail(opts: {
    documentTitle: string;
    badgeLabel: string;
    badgeBg: string;
    badgeColor: string;
    headline: string;
    greetingName: string;
    introParagraphs: string[];
    mainInnerHtml: string;
  }): string {
    const logoUrl = this.sanitizeEmailLogoUrl();
    const logoImgSrc = logoUrl ? this.escapeHtmlAttr(logoUrl) : '';
    const headline = this.escapeHtml(opts.headline);
    const name = this.escapeHtml(opts.greetingName);
    const title = this.escapeHtml(opts.documentTitle);
    const badgeLabel = this.escapeHtml(opts.badgeLabel);

    const introHtml = opts.introParagraphs
      .map(
        (para, i) =>
          `<p style="margin:${i === 0 ? '16px' : '16px'} 0 0 0;font-size:16px;line-height:28px;color:#475569;">${this.escapeHtml(para)}</p>`,
      )
      .join('');

    const logoCell = logoImgSrc
      ? `<td valign="middle" style="padding:0;vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      <tr>
                       <td
                          style="
                            width:54px;
                            height:54px;
                            background:#ffffff;
                            border-radius:16px;
                            text-align:center;
                            vertical-align:middle;
                            line-height:0;
                            font-size:0;
                            box-shadow:0 8px 20px rgba(0,0,0,0.15);
                            overflow:hidden;
                            padding:0;
                          "
                        >
                          <img
                            src="${logoImgSrc}"
                            width="54"
                            height="54"
                            alt="Oron"
                            border="0"
                            style="
                              display:block;
                              width:54px;
                              height:54px;
                              object-fit:cover;
                              border:0;
                              outline:none;
                              text-decoration:none;
                              margin:0;
                              padding:0;
                            "
                          />
                        </td>
                        <td style="padding-left:16px;vertical-align:middle;">
                          <div style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.4px;line-height:1.2;">
                            ORON Care
                          </div>
                          <div style="color:rgba(255,255,255,0.88);font-size:13px;margin-top:4px;line-height:1.3;">
                            SeniorCare Platform
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>`
      : `<td valign="middle" style="padding:0;vertical-align:middle;">
                    <div style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.4px;line-height:1.2;">
                      ORON Care
                    </div>
                    <div style="color:rgba(255,255,255,0.88);font-size:13px;margin-top:4px;line-height:1.3;">
                      SeniorCare Platform
                    </div>
                  </td>`;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;border-collapse:collapse;">
          <tr>
            <td style="background:linear-gradient(135deg,#0E649B 0%,#8E44AD 100%);border-radius:24px 24px 0 0;padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  ${logoCell}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:44px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <div style="margin-bottom:22px;">
                <span style="
                  background:${opts.badgeBg};
                  color:${opts.badgeColor};
                  padding:8px 14px;
                  border-radius:999px;
                  font-size:12px;
                  font-weight:700;
                  letter-spacing:0.3px;
                  text-transform:uppercase;
                ">${badgeLabel}</span>
              </div>
              <h1 style="margin:0;font-size:30px;line-height:38px;color:#0f172a;font-weight:700;">
                ${headline}
              </h1>
              <p style="margin:24px 0 0 0;font-size:16px;line-height:28px;color:#475569;">
                Hello <strong style="color:#0f172a;">${name}</strong>,
              </p>
              ${introHtml}
              ${opts.mainInnerHtml}
              <div style="height:1px;background:#e2e8f0;margin:36px 0 28px 0;"></div>
              <p style="margin:0;font-size:13px;line-height:24px;color:#64748b;">
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-top:none;
              border-radius:0 0 24px 24px;
              padding:24px 36px 28px 36px;
              text-align:center;
            ">
              <div style="height:1px;background:#e2e8f0;margin:0 0 20px 0;"></div>
              <div style="font-size:13px;line-height:22px;color:#64748b;margin-bottom:14px;">
                5539 N Mesa<br/>El Paso, TX 79912
              </div>
              <div style="font-size:12px;color:#94a3b8;">
                &copy; ORON Care. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private describeInviteTtl(): string {
    const m = this.inviteTtlMinutes;
    if (m === 60) {
      return 'one hour';
    }
    if (m === 120) {
      return 'two hours';
    }
    if (m < 60) {
      return `${m} minutes`;
    }
    if (m % 60 === 0) {
      return `${m / 60} hours`;
    }
    return `${m} minutes`;
  }
}
