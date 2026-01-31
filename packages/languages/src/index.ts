import { languages } from "./languages";

export type SupportedLocale = keyof typeof languages;

export const supportedLngs = Object.keys(languages);

export const defaultLocale = "zh-Hant";

export default languages;

export { languages };
