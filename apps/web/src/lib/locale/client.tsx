"use client";
import { defaultLocale, supportedLngs } from "@rallly/languages";
import { toast } from "@rallly/ui/sonner";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { LOCALE_COOKIE_NAME } from "@/lib/locale/constants";

/**
 * Normalize a locale to a supported locale.
 * This handles migration from removed locales (e.g., "zh" -> "zh-Hant").
 */
function normalizeLocale(locale: string): string {
  if (supportedLngs.includes(locale)) {
    return locale;
  }
  // Migration: zh (removed) -> zh-Hant
  if (locale === "zh") {
    return "zh-Hant";
  }
  return defaultLocale;
}

export function LocaleSync({ userLocale }: { userLocale: string }) {
  const { locale } = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  // Normalize userLocale to prevent infinite loop when user has an unsupported locale in database
  const normalizedUserLocale = normalizeLocale(userLocale);

  React.useEffect(() => {
    // update the cookie with the user locale if it's different from the current locale
    if (locale !== normalizedUserLocale) {
      setLocaleCookie(normalizedUserLocale);
      toast.info(
        t("localeSyncToast", {
          defaultValue: "Your language preferences changed",
        }),
        {
          action: {
            label: "Refresh",
            onClick: () => {
              router.refresh();
            },
          },
        },
      );
    }
  }, [locale, normalizedUserLocale, router.refresh, t]);

  return null;
}

export function setLocaleCookie(locale: string) {
  Cookies.set(LOCALE_COOKIE_NAME, locale, { path: "/" });
}
