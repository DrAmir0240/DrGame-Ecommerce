/**
 * High-performance Multi-lingual Lexicon for instant translation of frequent gaming & e-commerce terms.
 * Zero network, zero latency, runs synchronously in < 0.1ms.
 *
 * Fully covers all 15 supported languages:
 * fa, en, ar, de, es, fr, ru, zh, ja, ko, tr, it, pt, hi, nl.
 */

import type { SupportedLocale } from '@/i18n/config';

export type LexiconTranslations = Partial<Record<SupportedLocale, string>> & {
  en: string;
};

export const DYNAMIC_LEXICON: Record<string, LexiconTranslations> = {
  // --- Platforms ---
  'پلی استیشن ۵': {
    en: 'PlayStation 5', ar: 'بلايستيشن 5', de: 'PlayStation 5', es: 'PlayStation 5',
    fr: 'PlayStation 5', ru: 'PlayStation 5', zh: 'PlayStation 5', ja: 'プレイステーション5',
    ko: '플레이스테이션 5', tr: 'PlayStation 5', it: 'PlayStation 5', pt: 'PlayStation 5',
    hi: 'प्लेस्टेशन 5', nl: 'PlayStation 5',
  },
  'پلی استیشن 5': {
    en: 'PlayStation 5', ar: 'بلايستيشن 5', de: 'PlayStation 5', es: 'PlayStation 5',
    fr: 'PlayStation 5', ru: 'PlayStation 5', zh: 'PlayStation 5', ja: 'プレイステーション5',
    ko: '플레이스테이션 5', tr: 'PlayStation 5', it: 'PlayStation 5', pt: 'PlayStation 5',
    hi: 'प्लेस्टेशन 5', nl: 'PlayStation 5',
  },
  'پلی استیشن ۴': {
    en: 'PlayStation 4', ar: 'بلايستيشن 4', de: 'PlayStation 4', es: 'PlayStation 4',
    fr: 'PlayStation 4', ru: 'PlayStation 4', zh: 'PlayStation 4', ja: 'プレイステーション4',
    ko: '플레이스테이션 4', tr: 'PlayStation 4', it: 'PlayStation 4', pt: 'PlayStation 4',
    hi: 'प्लेस्टेशन 4', nl: 'PlayStation 4',
  },
  'پلی استیشن 4': {
    en: 'PlayStation 4', ar: 'بلايستيشن 4', de: 'PlayStation 4', es: 'PlayStation 4',
    fr: 'PlayStation 4', ru: 'PlayStation 4', zh: 'PlayStation 4', ja: 'プレイステーション4',
    ko: '플레이스테이션 4', tr: 'PlayStation 4', it: 'PlayStation 4', pt: 'PlayStation 4',
    hi: 'प्लेस्टेशन 4', nl: 'PlayStation 4',
  },
  'ایکس باکس سری اس': {
    en: 'Xbox Series S', ar: 'إكسبوكس سيريس إس', de: 'Xbox Series S', es: 'Xbox Series S',
    fr: 'Xbox Series S', ru: 'Xbox Series S', zh: 'Xbox Series S', ja: 'Xbox Series S',
    ko: 'Xbox Series S', tr: 'Xbox Series S', it: 'Xbox Series S', pt: 'Xbox Series S',
    hi: 'एक्सबॉक्स सीरीज एस', nl: 'Xbox Series S',
  },
  'ایکس باکس سری ایکس': {
    en: 'Xbox Series X', ar: 'إكسبوكس سيريس إكس', de: 'Xbox Series X', es: 'Xbox Series X',
    fr: 'Xbox Series X', ru: 'Xbox Series X', zh: 'Xbox Series X', ja: 'Xbox Series X',
    ko: 'Xbox Series X', tr: 'Xbox Series X', it: 'Xbox Series X', pt: 'Xbox Series X',
    hi: 'एक्सबॉक्स सीरीज एक्स', nl: 'Xbox Series X',
  },
  'ایکس باکس وان': {
    en: 'Xbox One', ar: 'إكسبوكس ون', de: 'Xbox One', es: 'Xbox One',
    fr: 'Xbox One', ru: 'Xbox One', zh: 'Xbox One', ja: 'Xbox One',
    ko: 'Xbox One', tr: 'Xbox One', it: 'Xbox One', pt: 'Xbox One',
    hi: 'एक्सबॉक्स वन', nl: 'Xbox One',
  },
  'ایکس باکس': {
    en: 'Xbox', ar: 'إكسبوكس', de: 'Xbox', es: 'Xbox',
    fr: 'Xbox', ru: 'Xbox', zh: 'Xbox', ja: 'Xbox',
    ko: 'Xbox', tr: 'Xbox', it: 'Xbox', pt: 'Xbox',
    hi: 'एक्सबॉक्स', nl: 'Xbox',
  },
  'استیم': {
    en: 'Steam', ar: 'ستيم', de: 'Steam', es: 'Steam',
    fr: 'Steam', ru: 'Steam', zh: 'Steam', ja: 'Steam',
    ko: 'Steam', tr: 'Steam', it: 'Steam', pt: 'Steam',
    hi: 'स्टीम', nl: 'Steam',
  },
  'کامپیوتر': {
    en: 'PC', ar: 'الكمبيوتر', de: 'PC', es: 'PC',
    fr: 'PC', ru: 'ПК', zh: '电脑 / PC', ja: 'PC',
    ko: 'PC', tr: 'PC', it: 'PC', pt: 'PC',
    hi: 'पीसी', nl: 'PC',
  },
  'نینتندو سوییچ': {
    en: 'Nintendo Switch', ar: 'نينتندو سويتش', de: 'Nintendo Switch', es: 'Nintendo Switch',
    fr: 'Nintendo Switch', ru: 'Nintendo Switch', zh: 'Nintendo Switch', ja: 'ニンテンドースイッチ',
    ko: '닌텐도 스위치', tr: 'Nintendo Switch', it: 'Nintendo Switch', pt: 'Nintendo Switch',
    hi: 'निनटेंडो स्विच', nl: 'Nintendo Switch',
  },

  // --- Capacities & Account Types ---
  'اکانت قانونی': {
    en: 'Legal Account', ar: 'حساب قانوني', de: 'Offizielles Konto', es: 'Cuenta Oficial',
    fr: 'Compte Officiel', ru: 'Официальный аккаунт', zh: '正版账号', ja: '正規アカウント',
    ko: '정품 계정', tr: 'Orijinal Hesap', it: 'Account Ufficiale', pt: 'Conta Oficial',
    hi: 'आधिकारिक खाता', nl: 'Officieel Account',
  },
  'اکانت ظرفیتی': {
    en: 'Capacity Account', ar: 'حساب بسعة', de: 'Slot-Konto', es: 'Cuenta por Ranura',
    fr: 'Compte par Slot', ru: 'Аккаунт с разделением', zh: '共享容量账号', ja: 'スロットアカウント',
    ko: '슬롯 계정', tr: 'Kapasite Hesabı', it: 'Account a Slot', pt: 'Conta por Vaga',
    hi: 'क्षमता खाता', nl: 'Slot Account',
  },
  'ظرفیت کامل': {
    en: 'Full Capacity', ar: 'السعة الكاملة', de: 'Voller Zugriff', es: 'Capacidad Completa',
    fr: 'Capacité Complète', ru: 'Полный доступ', zh: '完整容量', ja: 'フル容量',
    ko: '전체 용량', tr: 'Tam Kapasite', it: 'Accesso Completo', pt: 'Capacidade Total',
    hi: 'पूर्ण क्षमता', nl: 'Volledige Capaciteit',
  },
  'ظرفیت اول': {
    en: 'Capacity 1', ar: 'السعة 1', de: 'Slot 1 (Offline)', es: 'Capacidad 1',
    fr: 'Capacité 1', ru: 'Слот 1', zh: '容量 1', ja: 'スロット1',
    ko: '슬롯 1', tr: 'Slot 1', it: 'Slot 1', pt: 'Vaga 1',
    hi: 'क्षमता 1', nl: 'Slot 1',
  },
  'ظرفیت دوم': {
    en: 'Capacity 2', ar: 'السعة 2', de: 'Slot 2 (Primär)', es: 'Capacidad 2',
    fr: 'Capacité 2', ru: 'Слот 2', zh: '容量 2', ja: 'スロット2',
    ko: '슬롯 2', tr: 'Slot 2', it: 'Slot 2', pt: 'Vaga 2',
    hi: 'क्षमता 2', nl: 'Slot 2',
  },
  'ظرفیت سوم': {
    en: 'Capacity 3', ar: 'السعة 3', de: 'Slot 3 (Sekundär)', es: 'Capacidad 3',
    fr: 'Capacité 3', ru: 'Слот 3', zh: '容量 3', ja: 'スロット3',
    ko: '슬롯 3', tr: 'Slot 3', it: 'Slot 3', pt: 'Vaga 3',
    hi: 'क्षमता 3', nl: 'Slot 3',
  },
  'ظرفیت ۲': {
    en: 'Capacity 2', ar: 'السعة 2', de: 'Slot 2 (Primär)', es: 'Capacidad 2',
    fr: 'Capacité 2', ru: 'Слот 2', zh: '容量 2', ja: 'スロット2',
    ko: '슬롯 2', tr: 'Slot 2', it: 'Slot 2', pt: 'Vaga 2',
    hi: 'क्षमता 2', nl: 'Slot 2',
  },
  'ظرفیت ۳': {
    en: 'Capacity 3', ar: 'السعة 3', de: 'Slot 3 (Sekundär)', es: 'Capacidad 3',
    fr: 'Capacité 3', ru: 'Слот 3', zh: '容量 3', ja: 'スロット3',
    ko: '슬롯 3', tr: 'Slot 3', it: 'Slot 3', pt: 'Vaga 3',
    hi: 'क्षमता 3', nl: 'Slot 3',
  },
  'ظرفیت ۱': {
    en: 'Capacity 1', ar: 'السعة 1', de: 'Slot 1 (Offline)', es: 'Capacidad 1',
    fr: 'Capacité 1', ru: 'Слот 1', zh: '容量 1', ja: 'スロット1',
    ko: '슬롯 1', tr: 'Slot 1', it: 'Slot 1', pt: 'Vaga 1',
    hi: 'क्षमता 1', nl: 'Slot 1',
  },
  'ظرفیت اختصاصی': {
    en: 'Dedicated Capacity', ar: 'سعة مخصصة', de: 'Exklusiver Slot', es: 'Capacidad Exclusiva',
    fr: 'Capacité Dédiée', ru: 'Выделенный слот', zh: '独享容量', ja: '専用スロット',
    ko: '전용 슬롯', tr: 'Özel Kapasite', it: 'Slot Dedicato', pt: 'Vaga Exclusiva',
    hi: 'समर्पित क्षमता', nl: 'Toegewijde Capaciteit',
  },
  'سی دی کی': {
    en: 'CD Key', ar: 'مفتاح المنتج', de: 'CD-Key', es: 'Clave de Producto',
    fr: 'Clé CD', ru: 'Ключ активации', zh: 'CD Key / 激活码', ja: 'CDキー',
    ko: 'CD 키', tr: 'CD Anahtarı', it: 'Chiave CD', pt: 'Chave de Ativação',
    hi: 'सीडी कुंजी', nl: 'CD Sleutel',
  },
  'گیفت کارت': {
    en: 'Gift Card', ar: 'بطاقة هدايا', de: 'Gutscheinkarte', es: 'Tarjeta de Regalo',
    fr: 'Carte Cadeau', ru: 'Подарочная карта', zh: '礼品卡', ja: 'ギフトカード',
    ko: '기프트 카드', tr: 'Hediye Kartı', it: 'Carta Regalo', pt: 'Cartão de Presente',
    hi: 'उपहार कार्ड', nl: 'Cadeaukaart',
  },
  'اشتراک': {
    en: 'Subscription', ar: 'اشتراك', de: 'Abonnement', es: 'Suscripción',
    fr: 'Abonnement', ru: 'Подписка', zh: '订阅', ja: 'サブスクリプション',
    ko: '구독', tr: 'Abonelik', it: 'Abbonamento', pt: 'Assinatura',
    hi: 'सदस्यता', nl: 'Abonnement',
  },
  'پلاس': {
    en: 'Plus', ar: 'بلس', de: 'Plus', es: 'Plus',
    fr: 'Plus', ru: 'Plus', zh: 'Plus', ja: 'Plus',
    ko: '플러스', tr: 'Plus', it: 'Plus', pt: 'Plus',
    hi: 'प्लस', nl: 'Plus',
  },

  // --- Regions ---
  'ریجن ترکیه': {
    en: 'Turkey Region', ar: 'ريجن تركيا', de: 'Region Türkei', es: 'Región Turquía',
    fr: 'Région Turquie', ru: 'Регион Турция', zh: '土耳其区', ja: 'トルコ地域',
    ko: '터키 지역', tr: 'Türkiye Bölgesi', it: 'Regione Turchia', pt: 'Região Turquia',
    hi: 'तुर्की क्षेत्र', nl: 'Regio Turkije',
  },
  'ریجن آمریکا': {
    en: 'US Region', ar: 'ريجن أمريكا', de: 'Region USA', es: 'Región EE.UU.',
    fr: 'Région États-Unis', ru: 'Регион США', zh: '美区', ja: '北米地域',
    ko: '미국 지역', tr: 'ABD Bölgesi', it: 'Regione USA', pt: 'Região EUA',
    hi: 'यूएस क्षेत्र', nl: 'Regio VS',
  },
  'ریجن انگلیس': {
    en: 'UK Region', ar: 'ريجن بريطانيا', de: 'Region UK', es: 'Región Reino Unido',
    fr: 'Région Royaume-Uni', ru: 'Регион Великобритания', zh: '英国区', ja: 'イギリス地域',
    ko: '영국 지역', tr: 'İngiltere Bölgesi', it: 'Regione UK', pt: 'Região Reino Unido',
    hi: 'यूके क्षेत्र', nl: 'Regio VK',
  },
  'ریجن اوکراین': {
    en: 'Ukraine Region', ar: 'ريجن أوكرانيا', de: 'Region Ukraine', es: 'Región Ucrania',
    fr: 'Région Ukraine', ru: 'Регион Украина', zh: '乌克兰区', ja: 'ウクライナ地域',
    ko: '우크라이나 지역', tr: 'Ukrayna Bölgesi', it: 'Regione Ucraina', pt: 'Região Ucrânia',
    hi: 'यूक्रेन क्षेत्र', nl: 'Regio Oekraïne',
  },
  'ریجن اروپا': {
    en: 'Europe Region', ar: 'ريجن أوروبا', de: 'Region Europa', es: 'Región Europa',
    fr: 'Région Europe', ru: 'Регион Европа', zh: '欧区', ja: '欧州地域',
    ko: '유럽 지역', tr: 'Avrupa Bölgesi', it: 'Regione Europa', pt: 'Região Europa',
    hi: 'यूरोप क्षेत्र', nl: 'Regio Europa',
  },
  'ریجن آرژانتین': {
    en: 'Argentina Region', ar: 'ريجن الأرجنتين', de: 'Region Argentinien', es: 'Región Argentina',
    fr: 'Région Argentine', ru: 'Регион Аргентина', zh: '阿根廷区', ja: 'アルゼンチン地域',
    ko: '아르헨티나 지역', tr: 'Arjantin Bölgesi', it: 'Regione Argentina', pt: 'Região Argentina',
    hi: 'अर्जेंटीना क्षेत्र', nl: 'Regio Argentinië',
  },
  'ریجن هند': {
    en: 'India Region', ar: 'ريجن الهند', de: 'Region Indien', es: 'Región India',
    fr: 'Région Inde', ru: 'Регион Индия', zh: '印度区', ja: 'インド地域',
    ko: '인도 지역', tr: 'Hindistan Bölgesi', it: 'Regione India', pt: 'Região Índia',
    hi: 'भारत क्षेत्र', nl: 'Regio India',
  },
  'ریجن ایران': {
    en: 'Iran Region', ar: 'ريجن إيران', de: 'Region Iran', es: 'Región Irán',
    fr: 'Région Iran', ru: 'Регион Иран', zh: '伊朗区', ja: 'イラン地域',
    ko: '이란 지역', tr: 'İran Bölgesi', it: 'Regione Iran', pt: 'Região Irã',
    hi: 'ईरान क्षेत्र', nl: 'Regio Iran',
  },
  'گلوبال': {
    en: 'Global', ar: 'عالمي', de: 'Global', es: 'Global',
    fr: 'Mondial', ru: 'Глобальный', zh: '全球通用', ja: 'グローバル',
    ko: '글로벌', tr: 'Küresel', it: 'Globale', pt: 'Global',
    hi: 'वैश्विक', nl: 'Wereldwijd',
  },

  // --- Statuses & Tags ---
  'تحویل فوری': {
    en: 'Instant Delivery', ar: 'تسليم فوري', de: 'Sofortige Lieferung', es: 'Entrega Inmediata',
    fr: 'Livraison Immédiate', ru: 'Мгновенная доставка', zh: '即时发货', ja: '即時配信',
    ko: '즉시 발송', tr: 'Anında Teslimat', it: 'Consegna Istantanea', pt: 'Entrega Imediata',
    hi: 'त्वरित डिलीवरी', nl: 'Directe Levering',
  },
  'تحویل آنی': {
    en: 'Instant Delivery', ar: 'تسليم فوري', de: 'Sofortige Lieferung', es: 'Entrega Inmediata',
    fr: 'Livraison Immédiate', ru: 'Мгновенная доставка', zh: '即时发货', ja: '即時配信',
    ko: '즉시 발송', tr: 'Anında Teslimat', it: 'Consegna Istantanea', pt: 'Entrega Imediata',
    hi: 'त्वरित डिलीवरी', nl: 'Directe Levering',
  },
  'تحویل ۱ الی ۳ ساعت': {
    en: '1 to 3 Hours Delivery', ar: 'تسليم خلال 1 إلى 3 ساعات', de: 'Lieferung in 1-3 Std.', es: 'Entrega en 1 a 3 Horas',
    fr: 'Livraison en 1 à 3 Heures', ru: 'Доставка 1-3 часа', zh: '1至3小时发货', ja: '1〜3時間で配信',
    ko: '1~3시간 배송', tr: '1-3 Saat İçinde Teslimat', it: 'Consegna in 1-3 Ore', pt: 'Entrega em 1 a 3 Horas',
    hi: '1 से 3 घंटे में डिलीवरी', nl: '1 tot 3 uur levering',
  },
  'موجود در انبار': {
    en: 'In Stock', ar: 'متوفر في المخزن', de: 'Auf Lager', es: 'En Stock',
    fr: 'En Stock', ru: 'В наличии', zh: '现货', ja: '在庫あり',
    ko: '재고 있음', tr: 'Stokta', it: 'Disponibile', pt: 'Em Estoque',
    hi: 'स्टॉक में है', nl: 'Op Voorraad',
  },
  'موجود': {
    en: 'In Stock', ar: 'متوفر', de: 'Auf Lager', es: 'En Stock',
    fr: 'En Stock', ru: 'В наличии', zh: '现货', ja: '在庫あり',
    ko: '재고 있음', tr: 'Stokta', it: 'Disponibile', pt: 'Em Estoque',
    hi: 'स्टॉक में है', nl: 'Op Voorraad',
  },
  'ناموجود': {
    en: 'Out of Stock', ar: 'غير متوفر', de: 'Ausverkauft', es: 'Agotado',
    fr: 'Rupture de Stock', ru: 'Нет в наличии', zh: '缺货', ja: '在庫切れ',
    ko: '품절', tr: 'Stokta Yok', it: 'Esaurito', pt: 'Esgotado',
    hi: 'स्टॉक खत्म', nl: 'Niet op Voorraad',
  },
  'پیش خرید': {
    en: 'Pre-Order', ar: 'طلب مسبق', de: 'Vorbestellung', es: 'Reserva',
    fr: 'Précommande', ru: 'Предзаказ', zh: '预购', ja: '予約注文',
    ko: '사전 예약', tr: 'Ön Sipariş', it: 'Pre-ordine', pt: 'Pré-venda',
    hi: 'प्री-ऑर्डर', nl: 'Pre-order',
  },
  'تخفیف ویژه': {
    en: 'Special Discount', ar: 'خصم خاص', de: 'Sonderrabatt', es: 'Descuento Especial',
    fr: 'Remise Spéciale', ru: 'Специальная скидка', zh: '特惠折扣', ja: '特別割引',
    ko: '특별 할인', tr: 'Özel İndirim', it: 'Sconto Speciale', pt: 'Desconto Especial',
    hi: 'विशेष छूट', nl: 'Speciale Korting',
  },
  'گارانتی دائم': {
    en: 'Lifetime Warranty', ar: 'ضمان دائم', de: 'Lebenslange Garantie', es: 'Garantía de por Vida',
    fr: 'Garantie à Vie', ru: 'Пожизненная гарантия', zh: '永久质保', ja: '無期限保証',
    ko: '평생 보증', tr: 'Ömür Boyu Garanti', it: 'Garanzia a Vita', pt: 'Garantia Vitalícia',
    hi: 'आजीवन वारंटी', nl: 'Levenslange Garantie',
  },
  'گارانتی تعویض': {
    en: 'Replacement Warranty', ar: 'ضمان استبدال', de: 'Austauschgarantie', es: 'Garantía de Reemplazo',
    fr: 'Garantie d\'Échange', ru: 'Гарантия замены', zh: '换货质保', ja: '交換保証',
    ko: '교환 보증', tr: 'Değişim Garantisi', it: 'Garanzia di Sostituzione', pt: 'Garantia de Substituição',
    hi: 'रिप्लेसमेंट वारंटी', nl: 'Vervangingsgarantie',
  },
  'پشتیبانی ۲۴ ساعته': {
    en: '24/7 Support', ar: 'دعم 24/7', de: '24/7 Support', es: 'Soporte 24/7',
    fr: 'Support 24/7', ru: 'Поддержка 24/7', zh: '24/7 全天候支持', ja: '24時間年中無休サポート',
    ko: '24/7 연중무휴 지원', tr: '7/24 Destek', it: 'Supporto 24/7', pt: 'Suporte 24/7',
    hi: '24/7 सहायता', nl: '24/7 Ondersteuning',
  },
  'پرفروش': {
    en: 'Best Seller', ar: 'الأكثر مبيعاً', de: 'Bestseller', es: 'Más Vendido',
    fr: 'Meilleure Vente', ru: 'Хит продаж', zh: '畅销热卖', ja: 'ベストセラー',
    ko: '베스트셀러', tr: 'Çok Satan', it: 'I più venduti', pt: 'Mais Vendido',
    hi: 'बेस्ट सेलर', nl: 'Bestseller',
  },
  'جدید': {
    en: 'New', ar: 'جديد', de: 'Neu', es: 'Nuevo',
    fr: 'Nouveau', ru: 'Новинка', zh: '最新', ja: '新着',
    ko: '신규', tr: 'Yeni', it: 'Nuovo', pt: 'Novo',
    hi: 'नया', nl: 'Nieuw',
  },
  'ویژه': {
    en: 'Featured', ar: 'مميز', de: 'Empfohlen', es: 'Destacado',
    fr: 'En Vedette', ru: 'Избранное', zh: '精选', ja: '注目',
    ko: '주요 추천', tr: 'Öne Çıkan', it: 'In Evidenza', pt: 'Destaque',
    hi: 'विशेष', nl: 'Aanbevolen',
  },

  // --- Common Categories & Genres ---
  'بازی های کنسول': {
    en: 'Console Games', ar: 'ألعاب الكونسول', de: 'Konsolenspiele', es: 'Juegos de Consola',
    fr: 'Jeux Console', ru: 'Консольные игры', zh: '主机游戏', ja: 'コンソールゲーム',
    ko: '콘솔 게임', tr: 'Konsol Oyunları', it: 'Giochi per Console', pt: 'Jogos de Console',
    hi: 'कंसोल गेम्स', nl: 'Console Games',
  },
  'بازی های کامپیوتر': {
    en: 'PC Games', ar: 'ألعاب الكمبيوتر', de: 'PC-Spiele', es: 'Juegos de PC',
    fr: 'Jeux PC', ru: 'Игры для ПК', zh: 'PC电脑游戏', ja: 'PCゲーム',
    ko: 'PC 게임', tr: 'PC Oyunları', it: 'Giochi per PC', pt: 'Jogos de PC',
    hi: 'पीसी गेम्स', nl: 'PC Games',
  },
  'بازی های رایگان': {
    en: 'Free Games', ar: 'ألعاب مجانية', de: 'Kostenlose Spiele', es: 'Juegos Gratis',
    fr: 'Jeux Gratuits', ru: 'Бесплатные игры', zh: '免费游戏', ja: '無料ゲーム',
    ko: '무료 게임', tr: 'Ücretsiz Oyunlar', it: 'Giochi Gratuiti', pt: 'Jogos Grátis',
    hi: 'मुफ्त गेम्स', nl: 'Gratis Spellen',
  },
  'اکشن': {
    en: 'Action', ar: 'أكشن', de: 'Action', es: 'Acción',
    fr: 'Action', ru: 'Экшен', zh: '动作', ja: 'アクション',
    ko: '액션', tr: 'Aksiyon', it: 'Azione', pt: 'Ação',
    hi: 'एक्शन', nl: 'Actie',
  },
  'ماجراجویی': {
    en: 'Adventure', ar: 'مغامرة', de: 'Abenteuer', es: 'Aventura',
    fr: 'Aventure', ru: 'Приключения', zh: '冒险', ja: 'アドベンチャー',
    ko: '어드벤처', tr: 'Macera', it: 'Avventura', pt: 'Aventura',
    hi: 'रोमांच', nl: 'Avontuur',
  },
  'شوتر': {
    en: 'Shooter', ar: 'إطلاق نار', de: 'Shooter', es: 'Disparos',
    fr: 'Tir', ru: 'Шутер', zh: '射击', ja: 'シューティング',
    ko: '슈팅', tr: 'Nişancı', it: 'Sparatutto', pt: 'Tiro',
    hi: 'शूटर', nl: 'Shooter',
  },
  'نقش آفرینی': {
    en: 'RPG', ar: 'تقمص أدوار', de: 'Rollenspiel (RPG)', es: 'Rol (RPG)',
    fr: 'Jeu de Rôle (RPG)', ru: 'РПГ', zh: '角色扮演 (RPG)', ja: 'RPG',
    ko: 'RPG', tr: 'Rol Yapma (RPG)', it: 'GDR', pt: 'RPG',
    hi: 'आरपीजी', nl: 'RPG',
  },
  'ورزشی': {
    en: 'Sports', ar: 'رياضة', de: 'Sport', es: 'Deportes',
    fr: 'Sports', ru: 'Спорт', zh: '体育竞技', ja: 'スポーツ',
    ko: '스포츠', tr: 'Spor', it: 'Sport', pt: 'Esportes',
    hi: 'खेल', nl: 'Sport',
  },
  'مسابقه‌ای': {
    en: 'Racing', ar: 'سباقات', de: 'Rennspiel', es: 'Carreras',
    fr: 'Course', ru: 'Гонки', zh: '赛车竞速', ja: 'レース',
    ko: '레이싱', tr: 'Yarış', it: 'Corse', pt: 'Corrida',
    hi: 'दौड़ / रेसिंग', nl: 'Racen',
  },
  'استراتژیک': {
    en: 'Strategy', ar: 'استراتيجية', de: 'Strategie', es: 'Estrategia',
    fr: 'Stratégie', ru: 'Стратегия', zh: '策略', ja: 'ストラテジー',
    ko: '전략', tr: 'Strateji', it: 'Strategia', pt: 'Estratégia',
    hi: 'रणनीति', nl: 'Strategie',
  },
  'ترسناک': {
    en: 'Horror', ar: 'رعب', de: 'Horror', es: 'Terror',
    fr: 'Horreur', ru: 'Хоррор', zh: '恐怖', ja: 'ホラー',
    ko: '공포', tr: 'Korku', it: 'Horror', pt: 'Terror',
    hi: 'हॉरर / भय', nl: 'Horror',
  },
  'شبیه‌ساز': {
    en: 'Simulation', ar: 'محاكاة', de: 'Simulation', es: 'Simulación',
    fr: 'Simulation', ru: 'Симулятор', zh: '模拟', ja: 'シミュレーション',
    ko: '시뮬레이션', tr: 'Simülasyon', it: 'Simulazione', pt: 'Simulação',
    hi: 'सिमुलेशन', nl: 'Simulatie',
  },
  'معمایی': {
    en: 'Puzzle', ar: 'ألغاز', de: 'Puzzle', es: 'Puzle',
    fr: 'Casse-tête', ru: 'Головоломка', zh: '解谜 / 益智', ja: 'パズル',
    ko: '퍼즐', tr: 'Bulmaca', it: 'Rompicapo', pt: 'Quebra-cabeça',
    hi: 'पहेली', nl: 'Puzzel',
  },
  'پازل': {
    en: 'Puzzle', ar: 'ألغاز', de: 'Puzzle', es: 'Puzle',
    fr: 'Casse-tête', ru: 'Головоломка', zh: '解谜 / 益智', ja: 'パズル',
    ko: '퍼즐', tr: 'Bulmaca', it: 'Rompicapo', pt: 'Quebra-cabeça',
    hi: 'पहेली', nl: 'Puzzel',
  },
  'مبارزه‌ای': {
    en: 'Fighting', ar: 'قتال', de: 'Kampfspiel', es: 'Lucha',
    fr: 'Combat', ru: 'Файтинг', zh: '格斗', ja: '格闘',
    ko: '격투', tr: 'Dövüş', it: 'Picchiaduro', pt: 'Luta',
    hi: 'फाइटिंग', nl: 'Vechten',
  },
  'جهان باز': {
    en: 'Open World', ar: 'عالم مفتوح', de: 'Open World', es: 'Mundo Abierto',
    fr: 'Monde Ouvert', ru: 'Открытый мир', zh: '开放世界', ja: 'オープンワールド',
    ko: '오픈 월드', tr: 'Açık Dünya', it: 'Mondo Aperto', pt: 'Mundo Aberto',
    hi: 'खुली दुनिया', nl: 'Open Wereld',
  },
  'خانوادگی': {
    en: 'Family', ar: 'عائلي', de: 'Familie', es: 'Familiar',
    fr: 'Famille', ru: 'Семейные', zh: '家庭娱乐', ja: 'ファミリー',
    ko: '가족', tr: 'Aile', it: 'Famiglia', pt: 'Família',
    hi: 'पारिवारिक', nl: 'Familie',
  },

  // --- Blog Categories & Tutorials ---
  'آموزش': {
    en: 'Tutorials', ar: 'شروحات', de: 'Anleitungen', es: 'Tutoriales',
    fr: 'Tutoriels', ru: 'Обучение', zh: '教程', ja: 'チュートリアル',
    ko: '튜토리얼', tr: 'Rehber', it: 'Guide', pt: 'Tutoriais',
    hi: 'ट्यूटोरियल', nl: 'Handleidingen',
  },
  'اخبار': {
    en: 'News', ar: 'أخبار', de: 'Neuigkeiten', es: 'Noticias',
    fr: 'Actualités', ru: 'Новости', zh: '新闻', ja: 'ニュース',
    ko: '뉴스', tr: 'Haberler', it: 'Notizie', pt: 'Notícias',
    hi: 'समाचार', nl: 'Nieuws',
  },
  'راهنما': {
    en: 'Guide', ar: 'دليل', de: 'Leitfaden', es: 'Guía',
    fr: 'Guide', ru: 'Руководство', zh: '攻略', ja: 'ガイド',
    ko: '가이드', tr: 'Kılavuz', it: 'Guida', pt: 'Guia',
    hi: 'गाइड', nl: 'Gids',
  },
  'نقد و بررسی': {
    en: 'Reviews', ar: 'المراجعات', de: 'Rezensionen', es: 'Reseñas',
    fr: 'Critiques', ru: 'Обзоры', zh: '评测', ja: 'レビュー',
    ko: '리뷰', tr: 'İncelemeler', it: 'Recensioni', pt: 'Análises',
    hi: 'समीक्षाएं', nl: 'Recensies',
  },
  'نقد و بررسی و مقالات': {
    en: 'Reviews & Articles', ar: 'المراجعات والمقالات', de: 'Rezensionen & Artikel', es: 'Reseñas y Artículos',
    fr: 'Critiques & Articles', ru: 'Обзоры и статьи', zh: '评测与文章', ja: 'レビュー＆記事',
    ko: '리뷰 및 기사', tr: 'İncelemeler ve Makaleler', it: 'Recensioni e Articoli', pt: 'Análises e Artigos',
    hi: 'समीक्षाएं और लेख', nl: 'Recensies & Artikelen',
  },
  'اخبار و رویدادهای کنسول': {
    en: 'Console News & Events', ar: 'أخبار وفعاليات الكونسول', de: 'Konsolen-News & Events', es: 'Noticias y Eventos de Consola',
    fr: 'Actualités & Événements Console', ru: 'Новости и события консолей', zh: '主机新闻与活动', ja: 'コンソールニュース＆イベント',
    ko: '콘솔 뉴스 및 이벤트', tr: 'Konsol Haberleri ve Etkinlikler', it: 'Notizie ed Eventi Console', pt: 'Notícias e Eventos de Console',
    hi: 'कंसोल समाचार और कार्यक्रम', nl: 'Console Nieuws & Evenementen',
  },
  'آموزش و انتقال دیتا': {
    en: 'Tutorials & Data Transfer', ar: 'الشروحات ونقل البيانات', de: 'Anleitungen & Datentransfer', es: 'Tutoriales y Transferencia de Datos',
    fr: 'Tutoriels & Transfert de Données', ru: 'Обучение и передача данных', zh: '教程与数据传输', ja: 'チュートリアル＆データ転送',
    ko: '튜토리얼 및 데이터 전송', tr: 'Rehber ve Veri Aktarımı', it: 'Tutorial e Trasferimento Dati', pt: 'Tutoriais e Transferência de Dados',
    hi: 'ट्यूटोरियल और डेटा ट्रांसफर', nl: 'Handleidingen & Gegevensoverdracht',
  },
  'آموزش و راهنما': {
    en: 'Tutorials & Guides', ar: 'الشروحات والأدلة', de: 'Anleitungen & Leitfäden', es: 'Tutoriales y Guías',
    fr: 'Tutoriels & Guides', ru: 'Обучение и руководства', zh: '教程与指南', ja: 'チュートリアル＆ガイド',
    ko: '튜토리얼 및 가이드', tr: 'Rehber ve Kılavuzlar', it: 'Tutorial e Guide', pt: 'Tutoriais e Guias',
    hi: 'ट्यूटोरियल और गाइड', nl: 'Handleidingen & Gidsen',
  },
  'اخبار و مقالات': {
    en: 'News & Articles', ar: 'الأخبار والمقالات', de: 'Neuigkeiten & Artikel', es: 'Noticias y Artículos',
    fr: 'Actualités & Articles', ru: 'Новости и статьи', zh: '新闻与文章', ja: 'ニュース＆記事',
    ko: '뉴스 및 기사', tr: 'Haberler ve Makaleler', it: 'Notizie e Articoli', pt: 'Notícias e Artigos',
    hi: 'समाचार और लेख', nl: 'Nieuws & Artikelen',
  },

  // --- Parts, Downloads & Tiers ---
  'پیشنهاد ویژه': {
    en: 'Special Offer', ar: 'عرض خاص', de: 'Sonderangebot', es: 'Oferta Especial',
    fr: 'Offre Spéciale', ru: 'Спецпредложение', zh: '特惠活动', ja: '特別オファー',
    ko: '특별 제안', tr: 'Özel Teklif', it: 'Offerta Speciale', pt: 'Oferta Especial',
    hi: 'विशेष प्रस्ताव', nl: 'Speciale Aanbieding',
  },
  'بازی جدید': {
    en: 'New Game', ar: 'لعبة جديدة', de: 'Neues Spiel', es: 'Nuevo Juego',
    fr: 'Nouveau Jeu', ru: 'Новая игра', zh: '新游戏', ja: '新作ゲーム',
    ko: '새 게임', tr: 'Yeni Oyun', it: 'Nuovo Gioco', pt: 'Novo Jogo',
    hi: 'नया खेल', nl: 'Nieuw Spel',
  },
  'پارت اول': {
    en: 'Part 1', ar: 'الجزء 1', de: 'Teil 1', es: 'Parte 1',
    fr: 'Partie 1', ru: 'Часть 1', zh: '第 1 部分', ja: 'パート1',
    ko: '파트 1', tr: 'Bölüm 1', it: 'Parte 1', pt: 'Parte 1',
    hi: 'भाग 1', nl: 'Deel 1',
  },
  'پارت دوم': {
    en: 'Part 2', ar: 'الجزء 2', de: 'Teil 2', es: 'Parte 2',
    fr: 'Partie 2', ru: 'Часть 2', zh: '第 2 部分', ja: 'パート2',
    ko: '파트 2', tr: 'Bölüm 2', it: 'Parte 2', pt: 'Parte 2',
    hi: 'भाग 2', nl: 'Deel 2',
  },
  'پارت سوم': {
    en: 'Part 3', ar: 'الجزء 3', de: 'Teil 3', es: 'Parte 3',
    fr: 'Partie 3', ru: 'Часть 3', zh: '第 3 部分', ja: 'パート3',
    ko: '파트 3', tr: 'Bölüm 3', it: 'Parte 3', pt: 'Parte 3',
    hi: 'भाग 3', nl: 'Deel 3',
  },
  'پارت چهارم': {
    en: 'Part 4', ar: 'الجزء 4', de: 'Teil 4', es: 'Parte 4',
    fr: 'Partie 4', ru: 'Часть 4', zh: '第 4 部分', ja: 'パート4',
    ko: '파트 4', tr: 'Bölüm 4', it: 'Parte 4', pt: 'Parte 4',
    hi: 'भाग 4', nl: 'Deel 4',
  },
  'پارت پنجم': {
    en: 'Part 5', ar: 'الجزء 5', de: 'Teil 5', es: 'Parte 5',
    fr: 'Partie 5', ru: 'Часть 5', zh: '第 5 部分', ja: 'パート5',
    ko: '파트 5', tr: 'Bölüm 5', it: 'Parte 5', pt: 'Parte 5',
    hi: 'भाग 5', nl: 'Deel 5',
  },
  'فایل دیتا': {
    en: 'Data File', ar: 'ملف البيانات', de: 'Datendatei', es: 'Archivo de Datos',
    fr: 'Fichier de Données', ru: 'Файл данных', zh: '数据包文件', ja: 'データファイル',
    ko: '데이터 파일', tr: 'Veri Dosyası', it: 'File Dati', pt: 'Arquivo de Dados',
    hi: 'डेटा फ़ाइल', nl: 'Gegevensbestand',
  },
  'دیتا اصلی': {
    en: 'Main Data', ar: 'البيانات الأساسية', de: 'Hauptdaten', es: 'Datos Principales',
    fr: 'Données Principales', ru: 'Основные данные', zh: '本体数据', ja: 'メインデータ',
    ko: '메인 데이터', tr: 'Ana Veri', it: 'Dati Principali', pt: 'Dados Principais',
    hi: 'मुख्य डेटा', nl: 'Hoofdgegevens',
  },
  'زیرنویس فارسی': {
    en: 'Persian Subtitles', ar: 'ترجمة فارسية', de: 'Persische Untertitel', es: 'Subtítulos en Persa',
    fr: 'Sous-titres Persans', ru: 'Персидские субтитры', zh: '波斯语字幕', ja: 'ペルシャ語字幕',
    ko: '페르시아어 자막', tr: 'Farsça Altyazı', it: 'Sottotitoli in Persiano', pt: 'Legendas em Persa',
    hi: 'फ़ारसी उपशीर्षक', nl: 'Perzische Ondertiteling',
  },
  'دوبله فارسی': {
    en: 'Persian Voice-over', ar: 'دبلجة فارسية', de: 'Persische Sprachausgabe', es: 'Doblaje al Persa',
    fr: 'Doublage Persan', ru: 'Персидская озвучка', zh: '波斯语配音', ja: 'ペルシャ語吹き替え',
    ko: '페르시아어 더빙', tr: 'Farsça Dublaj', it: 'Doppiaggio in Persiano', pt: 'Dublagem em Persa',
    hi: 'फ़ारसी डबिंग', nl: 'Perzische Nasynchronisatie',
  },
  'چیت و ترینر': {
    en: 'Cheats & Trainers', ar: 'غش وتدريب', de: 'Cheats & Trainer', es: 'Trucos y Trainers',
    fr: 'Cheats & Trainers', ru: 'Читы и трейнеры', zh: '作弊码与修改器', ja: 'チート＆トレーナー',
    ko: '치트 및 트레이너', tr: 'Hileler ve Trainer', it: 'Trucchi e Trainer', pt: 'Cheats e Trainers',
    hi: 'चीट्स और ट्रेनर', nl: 'Cheats & Trainers',
  },
  'محتوای دانلودی': {
    en: 'DLC', ar: 'محتوى قابل للتحميل', de: 'DLC', es: 'DLC',
    fr: 'DLC', ru: 'DLC / Дополнение', zh: 'DLC 扩展内容', ja: 'DLC',
    ko: 'DLC', tr: 'DLC', it: 'DLC', pt: 'DLC',
    hi: 'डीएलसी', nl: 'DLC',
  },
  'اشتراک برنزی': {
    en: 'Bronze Subscription', ar: 'اشتراك برونزي', de: 'Bronze-Abo', es: 'Suscripción Bronce',
    fr: 'Abonnement Bronze', ru: 'Бронзовая подписка', zh: '青铜订阅', ja: 'ブロンズサブスク',
    ko: '브론즈 구독', tr: 'Bronz Abonelik', it: 'Abbonamento Bronzo', pt: 'Assinatura Bronze',
    hi: 'कांस्य सदस्यता', nl: 'Brons Abonnement',
  },
  'اشتراک نقره‌ای': {
    en: 'Silver Subscription', ar: 'اشتراك فضي', de: 'Silber-Abo', es: 'Suscripción Plata',
    fr: 'Abonnement Argent', ru: 'Серебряная подписка', zh: '白银订阅', ja: 'シルバーサブスク',
    ko: '실버 구독', tr: 'Gümüş Abonelik', it: 'Abbonamento Argento', pt: 'Assinatura Prata',
    hi: 'रजत सदस्यता', nl: 'Zilver Abonnement',
  },
  'اشتراک طلایی': {
    en: 'Gold Subscription', ar: 'اشتراك ذهبي', de: 'Gold-Abo', es: 'Suscripción Oro',
    fr: 'Abonnement Or', ru: 'Золотая подписка', zh: '黄金订阅', ja: 'ゴールドサブスク',
    ko: '골드 구독', tr: 'Altın Abonelik', it: 'Abbonamento Oro', pt: 'Assinatura Ouro',
    hi: 'स्वर्ण सदस्यता', nl: 'Goud Abonnement',
  },
  'اشتراک رایگان': {
    en: 'Free Subscription', ar: 'اشتراك مجاني', de: 'Kostenloses Abo', es: 'Suscripción Gratuita',
    fr: 'Abonnement Gratuit', ru: 'Бесплатная подписка', zh: '免费订阅', ja: '無料サブスク',
    ko: '무료 구독', tr: 'Ücretsiz Abonelik', it: 'Abbonamento Gratuito', pt: 'Assinatura Gratuita',
    hi: 'मुफ्त सदस्यता', nl: 'Gratis Abonnement',
  },
  'طرح رایگان': {
    en: 'Free Plan', ar: 'الخطة المجانية', de: 'Kostenloser Tarif', es: 'Plan Gratuito',
    fr: 'Forfait Gratuit', ru: 'Бесплатный план', zh: '免费套餐', ja: '無料プラン',
    ko: '무료 플랜', tr: 'Ücretsiz Plan', it: 'Piano Gratuito', pt: 'Plano Gratuito',
    hi: 'मुफ्त योजना', nl: 'Gratis Plan',
  },
  'طرح برنزی': {
    en: 'Bronze Plan', ar: 'الخطة البرونزية', de: 'Bronze-Tarif', es: 'Plan Bronce',
    fr: 'Forfait Bronze', ru: 'Бронзовый план', zh: '青铜套餐', ja: 'ブロンズプラン',
    ko: '브론즈 플랜', tr: 'Bronz Plan', it: 'Piano Bronzo', pt: 'Plano Bronze',
    hi: 'कांस्य योजना', nl: 'Brons Plan',
  },
  'طرح نقره‌ای': {
    en: 'Silver Plan', ar: 'الخطة الفضية', de: 'Silber-Tarif', es: 'Plan Plata',
    fr: 'Forfait Argent', ru: 'Серебряный план', zh: '白银套餐', ja: 'シルバープラン',
    ko: '실버 플랜', tr: 'Gümüş Plan', it: 'Piano Argento', pt: 'Plano Prata',
    hi: 'रजत योजना', nl: 'Zilver Plan',
  },
  'طرح طلایی': {
    en: 'Gold Plan', ar: 'الخطة الذهبية', de: 'Gold-Tarif', es: 'Plan Oro',
    fr: 'Forfait Or', ru: 'Золотой план', zh: '黄金套餐', ja: 'ゴールドプラン',
    ko: '골드 플랜', tr: 'Altın Plan', it: 'Piano Oro', pt: 'Plano Ouro',
    hi: 'स्वर्ण योजना', nl: 'Goud Plan',
  },

  // --- Plan Features ---
  'دانلود نامحدود': {
    en: 'Unlimited Download', ar: 'تحميل غير محدود', de: 'Unbegrenzter Download', es: 'Descargas Ilimitadas',
    fr: 'Téléchargement Illimité', ru: 'Безлимитная загрузка', zh: '无限下载', ja: '無制限ダウンロード',
    ko: '무제한 다운로드', tr: 'Sınırsız İndirme', it: 'Download Illimitato', pt: 'Download Ilimitado',
    hi: 'असीमित डाउनलोड', nl: 'Onbeperkt Downloaden',
  },
  'سرعت دانلود حداکثری': {
    en: 'Maximum Download Speed', ar: 'أقصى سرعة تحميل', de: 'Maximale Download-Geschwindigkeit', es: 'Velocidad Máxima de Descarga',
    fr: 'Vitesse Maximale de Téléchargement', ru: 'Максимальная скорость скачивания', zh: '极速满速下载', ja: '最大ダウンロード速度',
    ko: '최대 다운로드 속도', tr: 'Maksimum İndirme Hızı', it: 'Massima Velocità di Download', pt: 'Velocidade Máxima de Download',
    hi: 'अधिकतम डाउनलोड गति', nl: 'Maximale Downloadsnelheid',
  },
  'پشتیبانی اختصاصی': {
    en: 'Dedicated Support', ar: 'دعم مخصص', de: 'Dedizierter Support', es: 'Soporte Dedicado',
    fr: 'Support Dédié', ru: 'Персональная поддержка', zh: '专属客服支持', ja: '専任サポート',
    ko: '전담 지원', tr: 'Özel Destek', it: 'Supporto Dedicato', pt: 'Suporte Dedicado',
    hi: 'समर्पित सहायता', nl: 'Toegewijde Ondersteuning',
  },
  'امکان بازی آنلاین': {
    en: 'Online Play Support', ar: 'إمكانية اللعب أونلاين', de: 'Online-Spiel-Unterstützung', es: 'Compatible con Juego Online',
    fr: 'Support du Jeu en Ligne', ru: 'Поддержка онлайн-игры', zh: '支持联机在线游玩', ja: 'オンラインプレイ対応',
    ko: '온라인 플레이 지원', tr: 'Çevrimiçi Oyun Desteği', it: 'Supporto per Gioco Online', pt: 'Suporte para Jogos Online',
    hi: 'ऑनलाइन खेल समर्थन', nl: 'Online Spelen Ondersteuning',
  },
  'بازی آفلاین بدون محدودیت': {
    en: 'Unlimited Offline Play', ar: 'لعب أوفلاين بلا حدود', de: 'Unbegrenztes Offline-Spielen', es: 'Juego Offline Ilimitado',
    fr: 'Jeu Hors-ligne Illimité', ru: 'Безлимитная игра оффлайн', zh: '无限制单机离线游玩', ja: '無制限オフラインプレイ',
    ko: '무제한 오프라인 플레이', tr: 'Sınırsız Çevrimdışı Oyun', it: 'Gioco Offline Illimitato', pt: 'Jogo Offline Ilimitado',
    hi: 'असीमित ऑफलाइन खेल', nl: 'Onbeperkt Offline Spelen',
  },
};

/**
 * Attempts to translate string using the lexicon.
 * 1. Checks exact match.
 * 2. If no exact match, replaces known tokens (e.g. "اکانت قانونی ... ظرفیت ۲").
 * 3. Falls back to English for any non-Persian language if a specific language is missing.
 */
export function translateWithLexicon(
  text: string,
  targetLang: SupportedLocale
): { translated: string; isFullyTranslated: boolean } {
  if (!text || typeof text !== 'string') {
    return { translated: '', isFullyTranslated: true };
  }

  const trimmed = text.trim();

  // 1. Exact match
  const exact = DYNAMIC_LEXICON[trimmed];
  if (exact) {
    const direct = exact[targetLang];
    if (direct) {
      return { translated: direct, isFullyTranslated: true };
    }
    // Fallback to English for any non-Persian locale if direct target key is absent
    if (targetLang !== 'fa' && exact.en) {
      return { translated: exact.en, isFullyTranslated: true };
    }
  }

  // 2. Token-based replacement for composite product titles
  let workingText = trimmed;
  let replacedCount = 0;

  // Sort keys by length descending to replace longest phrases first
  const keys = Object.keys(DYNAMIC_LEXICON).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    if (workingText.includes(key)) {
      const replacement =
        DYNAMIC_LEXICON[key][targetLang] ||
        (targetLang !== 'fa' ? DYNAMIC_LEXICON[key].en : undefined);

      if (replacement) {
        workingText = workingText.split(key).join(replacement);
        replacedCount++;
      }
    }
  }

  // If no Persian characters remain, or replacements were made for a non-fa locale
  const hasRemainingPersian = /[\u0600-\u06FF]/.test(workingText);

  return {
    translated: workingText,
    isFullyTranslated:
      (!hasRemainingPersian && replacedCount > 0) ||
      (replacedCount > 0 && targetLang !== 'fa'),
  };
}
