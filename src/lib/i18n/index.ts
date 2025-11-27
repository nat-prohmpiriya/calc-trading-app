import { browser } from '$app/environment';
import { init, register, locale } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('th', () => import('./locales/th.json'));

init({
  fallbackLocale: defaultLocale,
  initialLocale: browser ? window.localStorage.getItem('locale') ?? defaultLocale : defaultLocale
});

export { locale };
