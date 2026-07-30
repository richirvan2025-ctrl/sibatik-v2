import nodemailer, { type Transporter } from "nodemailer";

/**
 * Modul pengiriman email.
 *
 * Membaca konfigurasi SMTP dari environment variables (EMAIL_*) yang sudah ada
 * di .env. Jika konfigurasi tidak lengkap, email dinonaktifkan secara aman
 * (fungsi sendMail hanya mencatat log dan tidak melempar error), sehingga alur
 * pembuatan tiket / komentar tetap berjalan meski email gagal.
 */

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_FROM,
} = process.env;

const isEmailConfigured = Boolean(
  EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASSWORD
);

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isEmailConfigured) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: EMAIL_SECURE === "true", // true untuk 465, false untuk 587 (STARTTLS)
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });

  return transporter;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Mengirim satu email. Tidak pernah melempar error ke pemanggil — kegagalan
 * hanya dicatat lewat console.error agar tidak menggagalkan request utama.
 * Mengembalikan true jika email terkirim, false jika dilewati/gagal.
 */
export async function sendMail(options: SendMailOptions): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn(
      "[mailer] Email dilewati: konfigurasi EMAIL_* tidak lengkap di .env"
    );
    return false;
  }

  const recipients = Array.isArray(options.to)
    ? options.to.filter(Boolean)
    : options.to;

  if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
    return false;
  }

  try {
    await t.sendMail({
      from: EMAIL_FROM || EMAIL_USER,
      to: recipients,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error("[mailer] Gagal mengirim email:", error);
    return false;
  }
}

/**
 * Verifikasi koneksi SMTP. Berguna untuk endpoint diagnostik / testing.
 */
export async function verifyMailer(): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;
  try {
    await t.verify();
    return true;
  } catch (error) {
    console.error("[mailer] Verifikasi SMTP gagal:", error);
    return false;
  }
}

export { isEmailConfigured };
