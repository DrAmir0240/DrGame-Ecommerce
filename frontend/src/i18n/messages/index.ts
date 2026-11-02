/**
 * Message catalog loader.
 *
 * Every page / section owns its own namespace file under `messages/<locale>/<file>.json`.
 * Each locale folder assembles those files into one bundle (see `build.ts`), so
 * `t('gamesPage.title')` works no matter which file the key lives in.
 *
 * Adding a locale = add `messages/<locale>/` + one import line below, and register
 * it in `src/i18n/config.ts`.
 */

import type { SupportedLocale } from '../config';

import faBundle from './fa';
import enBundle from './en';
import arBundle from './ar';
import deBundle from './de';
import esBundle from './es';
import frBundle from './fr';
import ruBundle from './ru';
import zhBundle from './zh';
import jaBundle from './ja';
import koBundle from './ko';
import trBundle from './tr';
import itBundle from './it';
import ptBundle from './pt';
import hiBundle from './hi';
import nlBundle from './nl';

type Dict = { [key: string]: any };

export const MESSAGES: Record<SupportedLocale, Dict> = {
  fa: faBundle,
  en: enBundle,
  ar: arBundle,
  de: deBundle,
  es: esBundle,
  fr: frBundle,
  ru: ruBundle,
  zh: zhBundle,
  ja: jaBundle,
  ko: koBundle,
  tr: trBundle,
  it: itBundle,
  pt: ptBundle,
  hi: hiBundle,
  nl: nlBundle,
};

export default MESSAGES;
