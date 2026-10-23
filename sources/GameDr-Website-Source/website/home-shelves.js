// Labels for shelves that are assembled by homepage features rather than by a
// game's stored genre. Keeping these keys in one place lets the public pages
// and the admin label editor use the same stable identifiers.
const HOME_SHELVES = [
  { key: 'Most Famous', en: 'Most Famous', fa: 'معروف‌ترین‌ها', kind: 'special' },
  { key: 'Lately Released', en: 'Latest games', fa: 'تازه‌ترین بازی‌ها', kind: 'home' },
  { key: 'Your taste', en: 'Your taste', fa: 'سلیقه شما', kind: 'home' },
  { key: 'Best Sellers', en: 'Best Sellers', fa: 'پرفروش‌ترین‌ها', kind: 'home' },
  { key: '2 Player Games', en: '2 Player Games', fa: 'بازی‌های دو نفره', kind: 'home' },
  { key: 'VR Supported Games', en: 'VR Supported Games', fa: 'بازی‌های پشتیبانی‌کننده از واقعیت مجازی', kind: 'home' },
];

module.exports = { HOME_SHELVES };
