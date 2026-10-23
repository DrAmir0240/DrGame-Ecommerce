(function (root) {
  'use strict';

  const PLAYSTATION_DEFAULT_AVATAR = 'https://static-resource.np.community.playstation.net/avatar_xl/default/Defaultavatar_xl.png';

  // Original avatar artwork served by PlayStation's profile and Store CDNs.
  // Keep the URLs direct and render them without cropping or image effects.
  const catalog = Object.freeze([
    { id: 'kratos', name_en: 'Kratos', name_fa: 'کراتوس', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2001_xl.png' },
    { id: 'atreus', name_en: 'Atreus', name_fa: 'آترئوس', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2002_xl.png' },
    { id: 'ellie', name_en: 'Ellie', name_fa: 'الی', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2073_xl.png' },
    { id: 'joel', name_en: 'Joel', name_fa: 'جوئل', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2080_xl.png' },
    { id: 'aloy', name_en: 'Aloy', name_fa: 'اِلوی', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_E/E2096_xl.png' },
    { id: 'ratchet', name_en: 'Ratchet', name_fa: 'رچت', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2103_xl.png' },
    { id: 'sackboy', name_en: 'Sackboy', name_fa: 'سک‌بوی', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_E/E2109_xl.png' },
    { id: 'spider-man', name_en: 'Spider-Man', name_fa: 'مرد عنکبوتی', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2114_xl.png' },
    { id: 'miles-morales', name_en: 'Miles Morales', name_fa: 'مایلز مورالس', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2117_xl.png' },
    { id: 'miles-morales-neon', name_en: 'Miles Morales · Neon', name_fa: 'مایلز مورالس · نئونی', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2118_xl.png' },
    { id: 'nathan-drake', name_en: 'Nathan Drake', name_fa: 'نیتن دریک', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/UP90001004025_XL.png' },
    { id: 'bloodborne-hunter', name_en: 'Bloodborne Hunter', name_fa: 'شکارچی بلادبورن', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_J/J2060_xl.png' },
    { id: 'jak', name_en: 'Jak', name_fa: 'جک', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A0005_XL.png' },
    { id: 'journey-traveler', name_en: 'Journey Traveler', name_fa: 'مسافر Journey', image: 'https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2011_xl.png' },
    { id: 'astro-bot', name_en: 'Astro Bot', name_fa: 'آسترو بات', image: 'https://psn-rsc.prod.dl.playstation.net/psn-rsc/avatar/JP9000/PPSA21559_00-PREORDERAVATAR01_C931593F47B5D7394549_xl.png' },
    { id: 'jin-sakai', name_en: 'Jin Sakai', name_fa: 'جین ساکای', image: 'https://psn-rsc.prod.dl.playstation.net/psn-rsc/avatar/EP9000/CUSA13323_00-AV00000000000001_62CCBEC7437D02076B02_xl.png' },
    { id: 'dina', name_en: 'Dina', name_fa: 'دینا', image: 'https://image.api.playstation.com/cdn/UP9000/CUSA07820_00/wvJCTO4Ez6oxbTOLRK8HAHU4I9lo2rlo.png' },
    { id: 'jesse', name_en: 'Jesse', name_fa: 'جسی', image: 'https://image.api.playstation.com/cdn/UP9000/CUSA07820_00/QnccaKZCCOY0iTi1QEJgLYKJ0zhkQgB7.png' },
    { id: 'elena-fisher', name_en: 'Elena Fisher', name_fa: 'النا فیشر', image: 'https://image.api.playstation.com/cdn/HP9000/CUSA00912_00/AzZf7nNNJj6KmPv8OlGDoEXMSHfqlyNGKmaBvR6i0nSNqEdYePetmTN00M4n1rOK.png' },
    { id: 'sly-cooper', name_en: 'Sly Cooper', name_fa: 'اسلای کوپر', image: 'https://image.api.playstation.com/cdn/UP9000/CUSA00223_00/w1ucD8fBBxPnnDJ7CNJoDLTw0D76zt15.png' },
  ]);

  // Keep previously saved choices resolvable for existing accounts without
  // continuing to show the old, narrow selection in the registration picker.
  const legacyCatalog = Object.freeze([
    { id: 'atoi', name_en: 'Atoi', name_fa: 'آتوئی', image: 'https://psn-rsc.prod.dl.playstation.net/psn-rsc/avatar/EP9000/CUSA00562_00-AV00000000000002_0C5D37A040B43F5AC850_xl.png' },
    { id: 'iota-closeup', name_en: 'Iota Close-up', name_fa: 'آیوتا · نمای نزدیک', image: 'https://image.api.playstation.com/cdn/UP9000/CUSA01607_00/kpGAZPyOMMItKy2rRoD6QosC3OlRiL1r.png' },
    { id: 'atoi-stamp', name_en: 'Atoi Stamp', name_fa: 'آتوئی · تمبر', image: 'https://image.api.playstation.com/cdn/UP9000/CUSA01607_00/PlingZRFKZWwMyazLK36DYnShN4dxqTJ.png' },
    { id: 'iota-stamp', name_en: 'Iota Stamp', name_fa: 'آیوتا · تمبر', image: 'https://image.api.playstation.com/cdn/UP9000/CUSA01607_00/rjdxjpb7bJMKc5fg1CjsuBVGUb9nXUg0.png' },
    { id: 'evil-newton', name_en: 'Evil Newton', name_fa: 'نیوتن شرور', image: 'https://image.api.playstation.com/cdn/UP9000/CUSA00473_00/bUWAZTNr6Exo5jaZz7yWVCgnLRxxrZ59.png' },
    { id: 'oddsock', name_en: 'Oddsock', name_fa: 'آدساک', image: 'https://image.api.playstation.com/cdn/EP9000/CUSA00762_00/f217M3hAazE2LHd98kHNc7oeIRG5IauT.png' },
    { id: 'captain-pud', name_en: 'Captain Pud', name_fa: 'کاپیتان پاد', image: 'https://image.api.playstation.com/cdn/UP9000/CUSA00473_00/YSDy80klcCmHiU9amzsoY0soiroqdqZr.png' },
  ]);

  const byId = new Map([...catalog, ...legacyCatalog].map(avatar => [avatar.id, avatar]));
  const fallback = catalog[0];

  const loadSequentially = images => {
    for (const image of images) {
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.onerror = () => {
        if (image.dataset.psnFallbackApplied) {
          image.removeAttribute('src');
          return;
        }
        image.dataset.psnFallbackApplied = 'true';
        image.src = PLAYSTATION_DEFAULT_AVATAR;
      };
      image.src = image.dataset.avatarSrc || PLAYSTATION_DEFAULT_AVATAR;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = { catalog, legacyCatalog, fallback, byId, PLAYSTATION_DEFAULT_AVATAR };
  else {
    root.DRT_AVATAR_CATALOG = catalog;
    root.DRT_PLAYSTATION_DEFAULT_AVATAR = PLAYSTATION_DEFAULT_AVATAR;
    root.drtAvatarImageUrl = id => (byId.get(String(id || '')) || fallback).image;
    root.drtLoadAvatarImagesSequentially = loadSequentially;
  }
})(typeof window === 'undefined' ? globalThis : window);
