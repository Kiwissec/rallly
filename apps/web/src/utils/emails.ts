import type { SupportedEmailProviders } from "@rallly/emails";
import { EmailClient } from "@rallly/emails";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";

import { env } from "@/env";
import { getInstanceBrandingConfig } from "@/features/branding/queries";

const logger = createLogger("emails");

// Supported locales for email templates (must match packages/emails/locales/)
const emailSupportedLocales = new Set([
  "ca",
  "cs",
  "da",
  "de",
  "en",
  "es",
  "eu",
  "fi",
  "fr",
  "hr",
  "hu",
  "it",
  "ja",
  "ko",
  "nl",
  "no",
  "pl",
  "pt",
  "pt-BR",
  "ru",
  "sk",
  "sv",
  "th",
  "tr",
  "vi",
  "zh-Hant",
]);

/**
 * Normalize a locale to a supported email locale.
 * This handles migration from removed locales (e.g., "zh" -> "zh-Hant").
 */
function normalizeEmailLocale(locale?: string): string {
  if (!locale) return "en";
  if (emailSupportedLocales.has(locale)) {
    return locale;
  }
  // Migration: zh (removed) -> zh-Hant
  if (locale === "zh") {
    return "zh-Hant";
  }
  return "en";
}

export const getEmailClient = async (locale?: string) => {
  const brandingConfig = await getInstanceBrandingConfig();
  const normalizedLocale = normalizeEmailLocale(locale);

  return new EmailClient({
    provider: {
      name: (process.env.EMAIL_PROVIDER as SupportedEmailProviders) ?? "smtp",
    },
    mail: {
      from: {
        name: env.NOREPLY_EMAIL_NAME,
        address: env.NOREPLY_EMAIL || env.SUPPORT_EMAIL,
      },
    },
    config: {
      logoUrl: brandingConfig.logoIcon,
      baseUrl: absoluteUrl(),
      domain: absoluteUrl().replace(/(^\w+:|^)\/\//, ""),
      supportEmail: env.SUPPORT_EMAIL,
      primaryColor: brandingConfig.primaryColor.light,
      appName: brandingConfig.appName,
      hideAttribution: brandingConfig.hideAttribution,
    },
    locale: normalizedLocale,
    onError: (e) => {
      logger.error({ error: e }, "Email client error");
      Sentry.captureException(e);
    },
  });
};
