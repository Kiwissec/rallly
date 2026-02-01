"use client";
import type { i18n } from "i18next";
import type React from "react";
import { useEffect, useState } from "react";
import {
  I18nextProvider,
  useTranslation as useTranslationOrg,
} from "react-i18next";

import { initI18next } from "./i18n";
import { defaultNS, fallbackLng } from "./settings";

export function useTranslation() {
  return useTranslationOrg("app");
}

export function I18nProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [i18nInstance, setI18nInstance] = useState<i18n | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadI18n = async () => {
      try {
        const result = await initI18next({ lng: locale });
        if (!cancelled) {
          setI18nInstance(result.i18n);
        }
      } catch (error) {
        console.error(
          `Failed to load locale "${locale}", falling back to "${fallbackLng}"`,
          error,
        );
        try {
          const fallbackResult = await initI18next({ lng: fallbackLng });
          if (!cancelled) {
            setI18nInstance(fallbackResult.i18n);
          }
        } catch (fallbackError) {
          console.error("Failed to load fallback locale", fallbackError);
        }
      }
    };

    loadI18n();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!i18nInstance) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18nInstance} defaultNS={defaultNS}>
      {children}
    </I18nextProvider>
  );
}
