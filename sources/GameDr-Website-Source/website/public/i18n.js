// Shared language switcher for every page. Loaded before each page's own
// inline script. Persian (fa) renders right-to-left; English stays ltr.

const TRANSLATIONS = {
  en: {
    nav_store: 'Store',
    nav_platform: 'Platform',
    nav_ps4: 'PS4',
    nav_ps5: 'PS5',
    nav_psvr2: 'PS VR2',
    nav_xbox360: 'Xbox 360',
    nav_nintendo_switch: 'Nintendo Switch',
    nav_games: 'Games',
    nav_ps_plus: 'PS Plus',
    nav_accessories: 'Accessories',
    nav_news: 'News',
    nav_support: 'Support',
    nav_latest: 'Latest games',
    nav_two_player: '2 Player games',
    nav_vr: 'VR supported games',
    nav_plans: 'Subscription plans',
    nav_free_plan: 'Free plan',
    nav_payload: 'Payload tools',
    nav_gamepad: 'Gamepad tester',
    nav_contact: 'Contact us',
    nav_request: 'Request a game',
    nav_ideas: 'Ideas and proposals',
    nav_all_games: 'All Games',
    nav_with_subtitle: 'With Subtitle',
    search_placeholder: 'Search 300+ games...',
    lang_toggle: 'فارسی',

    drawer_all_categories: 'All Categories',
    drawer_platform_label: 'Platform',
    drawer_tools: 'Tools',
    drawer_payload_hint: 'PlayStation digital tools',

    site_intro: 'GameDr ir makes PlayStation content easier to explore. Browse PS4 and PS5 games, compare download options, and choose with confidence.',

    learn_heading: 'Learn',
    learn_body: 'Find practical guides for exploring and using PS4 and PS5 game content.',
    learn_video_label: 'Add a tutorial video at',

    copy_heading: 'Jailbreak',
    copy_body: 'Browse available PS4 and PS5 game files, account-based options, and subtitles.',

    payload_heading: 'Payload',
    payload_body: 'Review each PlayStation digital item’s details and requirements before use.',

    back_home: '← Back to home',

    featured_heading: 'Latest games',
    nav_subscription: 'Subscription',
    req_title: "Request a game or subtitle",
    req_intro: "Can't find a game, or want subtitles for one? Tell us and we will do our best.",
    req_type: "What do you need?",
    req_type_game: "A new game",
    req_type_subtitle: "A subtitle",
    req_type_other: "Something else",
    req_game: "Game name",
    req_game_ph: "e.g. Elden Ring",
    req_details: "Details (optional)",
    req_details_ph: "Language, version, which video… anything that helps us.",
    req_contact: "How can we reach you? (email, Telegram or phone)",
    req_send: "Send request",
    req_thanks: "Thank you! We got your request.",
    req_merged: "Thank you! Other people asked for this too, so it moves up our list.",
    req_auto_add: "Request received. We’ll check the game catalog and add it automatically when we can confirm an exact match. If we can’t, our team will review it.",
    req_nav: "Request a game / subtitle",
    req_game_btn: "Request a subtitle",
    legal_terms: "Terms of Service",
    legal_privacy: "Privacy Policy",
    legal_refund: "Refund Policy",
    legal_updated: "Last updated",
    legal_loading: "Loading…",
    legal_back: "← Back to home",
    reg_agree_pre: "I agree to the ",
    reg_agree_mid: " and the ",
    reg_agree_post: ".",
    reg_agree_needed: "Please tick the box to accept the terms.",
    code_title: "Discount code",
    code_placeholder: "Enter your code",
    code_apply: "Apply",
    code_remove: "Remove",
    code_active: "Code {code} is active: {percent}% off {what}",
    code_used_next: "It is used automatically on your next matching purchase.",
    code_gift: "Gift codes are no longer supported.",
    code_login: "Log in to use a code.",
    code_error: "This code could not be used.",
    code_what_files: "file unlocks",
    code_what_packs: "subscriptions",
    code_what_plans: "subscriptions",
    code_and: " and ",
    inv_title: "Weekly sales rewards",
    inv_text: "Signups and invitations alone earn no commission. Only admin-approved marketers earn from qualifying subscription sales.",
    inv_your_code: "Your invitation code",
    inv_copy: "Copy code",
    inv_copy_link: "Copy invite link",
    inv_copied: "Copied!",
    inv_friends: "Team sales this week",
    inv_friends_invited: "Friends invited",
    inv_earned: "Payable commission (toman)",
    inv_next: "Pending commission (toman)",
    inv_limit_reached: "Invite reward limit reached",
    inv_paused: "Rewards are paused",
    inv_tree_title: "Weekly progress",
    inv_tree_note: "Your rank stays fixed for this week; current sales set next week’s rank.",
    inv_tree_empty: "Your invitation tree is empty so far.",
    inv_level: "Level {level}",
    inv_customers: "customers",
    inv_none: "No commission entries yet.",
    inv_off: "Only admin-approved marketers can earn commissions. Signup and inviting alone earn nothing.",
    reg_invite: "Invitation code (optional)",
    reg_invite_ok: "✓ Valid. This links your account to {inviter}; signup itself earns no commission.",
    reg_invite_bad: "Invitation code not found.",
    prof_login: "Log in or sign up",
    prof_view: "Your profile",
    prof_invite_hint: "Share your marketer code for attributed sales",
    earnings_status_approved: "Approved marketer account",
    earnings_status_pending: "This account is not approved as a marketer yet.",
    earnings_rank: "Rank for this week",
    earnings_next_rank: "Rank based on this week’s sales",
    earnings_layers: "Commission layers open this week",
    earnings_no_rank: "No rank",
    earnings_sponsor: "Linked marketer",
    earnings_order: "Subscription order",
    earnings_pending: "Pending",
    earnings_paid: "Settled (simulated)",
    earnings_reversed: "Reversed",
    earnings_debt: "Commission reversal debt: {amount} toman",
    earnings_direct: "Direct commission",
    tokens_referral: "Marketer referral code (optional)",
    tokens_referral_hint: "Only codes for admin-approved marketers can receive commission credit.",
    currency_toman: "toman",
    rel_heading: "Related games",
    rel_series: "Same series",
    rel_company: "Same studio: {company}",
    rel_genre: "Same genre: {category}",
    foryou_heading: "Your taste",
    foryou_popular: "Popular right now",
    foryou_personal: "Picked for you based on the files you downloaded",
    foryou_series: "More from the same series as {seed}",
    foryou_company: "Same studio as {seed} ({company})",
    foryou_genre: "Because you downloaded {seed}",
    ph_status_ok: "Phone verified",
    ph_status_no: "Phone not verified",
    ph_verify_btn: "Verify phone",
    ph_send: "Send code by SMS",
    ph_code: "6-digit code from SMS",
    ph_confirm: "Confirm phone",
    ph_sent: "We sent an SMS with a 6-digit code to {phone}.",
    ph_dev: "SMS sending is not set up yet, so no SMS was sent. The site owner can read the code in the admin dashboard.",
    ph_done: "Your phone number is verified. Thank you!",
    ph_number: "Phone number",
    ph_resend_in: "Send a new code in {s}s",
    ph_resend: "Send a new code",
    ph_iran_only: "SMS verification currently works for Iranian mobile numbers only.",
    reg_first: "First name",
    reg_last: "Last name",
    reg_username: "Username",
    reg_phone: "Phone number (e.g. +989121234567)",
    reg_login_id: "Email or username",
    reg_user_ok: "Username is available",
    reg_user_taken: "This username is not available",
    reg_user_hint: "3-20 characters: letters, numbers, _ or .",
    reg_phone_note: "We will verify your phone number by SMS later.",
    verify_expires_in: "Code expires in",
    verify_expired: "This code has expired. Send a new code.",
    verify_title: "Verify your email",
    verify_text: "We sent a 6-digit code to {email}. Enter it below to finish creating your account.",
    verify_code: "6-digit code",
    verify_btn: "Verify and create account",
    verify_resend: "Send a new code",
    verify_resend_in: "Send a new code in {s}s",
    verify_change: "Use a different email",
    verify_sent: "A new code was sent.",
    verify_dev: "Email sending is not set up yet, so no email was sent. The site owner can read the code in the admin dashboard.",
    verify_expires: "The code is valid for {m} minutes.",
    nav_home: 'Home',
    nav_gamepad: "Gamepad Tester",
    gp_heading: "Gamepad Tester",
    gp_intro: "Plug in or pair your controller, then press any button. Every button, stick, trigger, motor and sensor lights up so you can see exactly which part works and which is broken.",
    gp_sub_tagline: "Check every button & stick",
    gp_reload: "Reload tester",
    gp_tip: "Tip: if your controller is not detected, press a button on it and make sure no other app is using it.",
    file_free: "Free",
    file_owned: "Unlocked",
    file_unlock: "Unlock",
    file_login: "Log in to unlock",
    file_confirm: "Unlock this game using {price} GB of your plan's download quota?",
    file_unlocked: "Unlocked! You can download it now.",
    game_unlock: "Unlock full game",
    game_price_short: "GB download quota",
    game_unlock_confirm: "Unlock this entire game and its files using {price} GB of your plan's download quota?",
    game_unlocked: "Game unlocked! All its files are ready to download.",
    file_not_enough: "Not enough download quota. This game needs {price} GB and you have {balance} GB left.",
    file_get_tokens: "Choose a plan",
    wallet_login: "Log in",
    wallet_tokens: "Download quota left",
    wallet_buy_more: "View plan details",
    wallet_get_from_plan: "Choose a subscription plan",
    tokens_heading: "Download quota",
    tokens_intro: "Your plan's remaining download quota is used to unlock games by their full size.",
    tokens_plan_cta_heading: "Need more download quota?",
    tokens_plan_cta_body: "Choose or renew a subscription to get a new download allowance.",
    tokens_balance: "Download quota remaining",
    tokens_packs: "Subscription plans",
    tokens_buy: "Choose a plan",
    tokens_bonus: "included",
    tokens_popular: "Most popular",
    tokens_test_banner: "Test mode: purchases are simulated and no real money is charged.",
    tokens_pending: "Subscription order received. Access starts after payment is confirmed.",
    tokens_bought: "Done! Your subscription and download quota are active.",
    tokens_login_needed: "Log in to view your download quota history.",
    tokens_history: "Download usage",
    tokens_orders: "Subscription orders",
    tokens_none: "Nothing yet.",
    status_pending: "Waiting for confirmation",
    status_paid: "Paid",
    status_rejected: "Rejected",
    tokens_how_to_pay: "How to pay",
    account_heading: "Account",
    account_login: "Log in",
    account_register: "Create account",
    avatar_picker_title: "Choose an avatar",
    avatar_picker_note: "Pick the avatar you want to use for your account.",
    avatar_picker_change: "Change avatar",
    account_name: "Your name",
    account_email: "Email",
    account_password: "Password (8+ characters)",
    account_logout: "Log out",
    account_welcome: "Welcome",
    account_plan: "Current plan",
    account_no_plan: "No active plan",
    account_until: "until",
    account_have: "Already have an account? Log in",
    account_new: "New here? Create an account",
    account_error: "Something went wrong. Try again.",
    profile_alerts: "Account alerts",
    profile_notifications: "Notifications",
    profile_devices: "Connected devices",
    profile_support: "Contact support",
    profile_ideas: "Ideas and proposals",
    profile_quick_links: "Quick links",
    game_reaction_prompt: "What do you think of this game?",
    game_reaction_like: "Like",
    game_reaction_dislike: "Dislike",
    game_reaction_liked: "You liked this game.",
    game_reaction_disliked: "You disliked this game.",
    game_reaction_login_required: "Log in to vote on this game.",
    game_reaction_like_count: "{count} likes",
    game_reaction_dislike_count: "{count} dislikes",
    about_heading: "About GameDr ir",
    about_intro: "GameDr ir helps PlayStation players find digital content, understand their options, and manage downloads with confidence.",
    about_access: "Quick access",
    about_rules: "Terms and responsibilities",
    about_privacy: "Privacy",
    legal_terms_intro: "Using GameDr ir means accepting the website rules and the responsibilities that apply to the available content and services.",
    legal_privacy_intro: "We use account information to provide downloads, subscriptions, support and account security. Read the privacy policy for the full details.",
    sub_includes: "download data",
    sub_subscribe: "Subscribe",
    sub_done: "Your subscription is active and your download quota is ready.",
    sub_pending: "Request received. Your plan starts when the payment is confirmed.",
    free_plan_active: "Free plan active",
    free_plan_activated: "Free access is active for Watch Dogs 2, GTA V, Rocket League, Mortal Kombat 11, and Brawlhalla.",
    free_plan_already_active: "Your free plan is already active and includes only the five listed games.",
    sub_login: "Log in to subscribe",
    report_btn: "Report a problem",
    report_title: "Report a problem",
    report_intro: "What is wrong with this page?",
    report_reason_unrelated: "Unrelated content",
    report_reason_age: "Over-age / inappropriate screenshot",
    report_reason_broken: "Broken file or download",
    report_reason_wrong: "Wrong game information",
    report_reason_other: "Something else",
    report_details: "Tell us more (what did you see?)",
    report_email: "Your email (optional, if you want a reply)",
    report_submit: "Send report",
    report_cancel: "Cancel",
    report_thanks: "Thank you! Your report was sent and will be reviewed.",
    report_error: "Could not send the report. Please try again.",
    report_pick: "Please choose what is wrong.",
    nav_contact: "Contact Us",
    contact_heading: "Contact Us",
    contact_intro: "Have a question or need help? Send us a message and we will get back to you.",
    contact_name: "Your name",
    contact_email: "Email (optional)",
    contact_message: "Your message",
    contact_send: "Send message",
    contact_sent: "Thank you! Your message was sent.",
    contact_error: "Could not send your message. Please try again.",
    contact_info_heading: "Get in touch",
    contact_phone_label: "Phone",
    contact_email_label: "Email",
    contact_address_label: "Address",
    contact_hours_label: "Hours",
    sub_tagline: 'More speed, more download data, better gaming',
    sub_tag_new: 'Plans',
    sub_eyebrow: 'MORE SPEED · MORE DOWNLOAD DATA · BETTER GAMING',
    sub_full_access: 'FULL ACCESS',
    sub_heading: 'Choose your plan. Download faster.',
    sub_intro: 'Choose your plan by its download speed, supported games, and the amount of game data you can use.',
    plan_usage_warning: 'When your quota is used, you cannot unlock more games. Unlocked games stay available until the 30-day plan expires.',
    plan_data_quota: '{quota} of game downloads',
    plan_required: 'An active paid subscription is required for this game. Choose a plan to continue.',
    free_games_heading: 'Included games · no download quota required',
    plan_free_warning: 'Free access is limited to these five games. Other titles are not included in the free plan.',
    sub_period_note: 'Paid plans last 30 days. Free access covers only the five games listed below, with no size limit.',
    plan_free_summary: 'This plan only gives access to these 5 games, with unlimited download size.',
    plan_bronze_summary: 'An affordable start with dedicated speed and 500 GB of game downloads.',
    plan_silver_summary: 'A balanced plan with more platforms and 1 TB of game downloads.',
    plan_gold_summary: 'Premium platform access, faster downloads, and 2.2 TB of game downloads.',
    plan_bronze_name: 'Bronze',
    plan_silver_name: 'Silver',
    plan_gold_name: 'Gold',
    plan_bronze_price: '698,000 toman',
    plan_silver_price: '1,198,000 toman',
    plan_gold_price: '2,098,000 toman',
    plan_per_month: '/ 30 days',
    plan_feature_1: 'PlayStation game access',
    plan_feature_2: 'Account and download details',
    plan_feature_3: 'Sed do eiusmod tempor',
    plan_choose: 'Choose plan',
    latest_heading: 'Latest games',
    two_player_heading: '2 Player Games',
    vr_heading: 'VR Supported Games',
    profile_request: 'Request a game',
    profile_games: 'Purchased games',
    profile_activity: 'Download & order history',
    bestsellers_heading: 'Best Sellers',
    bestsellers_empty: 'No sales yet. Best-selling games will appear here.',
    all_categories_btn: 'All categories',
    view_all_btn: 'View All Games →',

    hero_title_default: 'Explore 300+ PlayStation games',
    pill_all: 'All games',
    pill_with_subtitle: 'With subtitle',
    no_results: 'No games match your search.',

    back_all_games: '← All games',
    screenshots_heading: 'Gameplay Screenshots',
    description_heading: 'About',
    game_details_kicker: 'PlayStation profile',
    game_details_heading: 'Game details',
    game_details_source: 'Based on PlayStation Store details',
    game_details_source_curated: 'Curated game summary',
    game_details_recognition: 'Recognition & studio',
    game_details_studio: 'Creator studio',
    game_details_awards: 'Awards',
    game_details_studio_awards: 'Studio recognition',
    game_details_no_awards: 'No awards listed',
    game_details_story_label: 'The heart of the game',
    game_details_story_heading: 'The story',
    game_details_support: 'Play features',
    game_details_support_heading: 'What the game supports',
    game_details_metacritic: 'Metacritic',
    game_details_critic_score: 'Critic score',
    game_details_awards_source: 'The Game Awards',
    game_details_esrb_mature: 'ESRB Mature 17+',
    game_details_content: 'Content descriptors',
    game_details_not_listed: 'Not listed',
    game_details_supported: 'Supported',
    game_details_not_supported: 'Not supported',
    game_details_dualsense: 'DualSense haptics',
    game_details_vr: 'VR support',
    game_details_online: 'Online play',
    game_details_players: 'Players',
    game_details_playtime: 'Play time',
    game_details_varies: 'Varies by play style',
    game_details_playtime_source: 'Playtime source',
    game_details_age: 'Age rating',
    game_details_platforms: 'Platforms',
    game_tag_single_player: 'Single-player',
    game_tag_multiplayer: 'Multiplayer',
    game_tag_age: 'Age {age}',
    loading: 'Loading…',
    not_found: 'Game not found',
    no_clips: 'No clips uploaded for this game yet.',
    files_heading: 'Files',
    files_none: 'There is no file for this content at the moment.',
    files_unavailable: 'not available yet',
    files_request: 'Request this content',
    download_btn: 'Download',
    back_home: '← Home',
    downloads_kicker: 'Download center',
    downloads_heading: 'Your downloads',
    downloads_intro: 'Track active downloads and review your completed files in one place.',
    downloads_status_kicker: 'Live status',
    downloads_document_title: 'Downloads · Dr Game',

    footer_tagline: 'GameDr ir makes it easier to discover PlayStation games and the digital content around them.',
    footer_follow_us: 'Follow Us',
    footer_contact: 'Contact',
    footer_copyright: '© 2026 Dr Game.',
  },
  fa: {
    nav_store: 'فروشگاه',
    nav_platform: 'پلتفرم',
    nav_ps4: 'PS4',
    nav_ps5: 'PS5',
    nav_psvr2: 'PS VR2',
    nav_xbox360: 'ایکس‌باکس ۳۶۰',
    nav_nintendo_switch: 'نینتندو سوییچ',
    nav_games: 'بازی‌ها',
    nav_ps_plus: 'پلی‌استیشن پلاس',
    nav_accessories: 'لوازم جانبی',
    nav_news: 'اخبار',
    nav_support: 'پشتیبانی',
    nav_latest: 'تازه‌ترین بازی‌ها',
    nav_two_player: 'بازی‌های دو نفره',
    nav_vr: 'بازی‌های واقعیت مجازی',
    nav_plans: 'پلن‌های اشتراک',
    nav_free_plan: 'پلن رایگان',
    nav_payload: 'ابزارهای پیلوت',
    nav_gamepad: 'تست دسته',
    nav_contact: 'تماس با ما',
    nav_request: 'درخواست بازی',
    nav_ideas: 'ایده‌ها و پیشنهادها',
    nav_all_games: 'همه بازی‌ها',
    nav_with_subtitle: 'دارای زیرنویس',
    search_placeholder: 'جستجو در بیش از ۳۰۰ بازی...',
    lang_toggle: 'English',

    drawer_all_categories: 'همه دسته‌ها',
    drawer_platform_label: 'پلتفرم',
    drawer_tools: 'ابزارها',
    drawer_payload_hint: 'ابزارهای دیجیتال پلی‌استیشن',

    site_intro: 'در GameDr ir دسترسی به محتوای پلی‌استیشن ساده‌تر است. بازی‌های PS4 و PS5 و گزینه‌های دانلود را بررسی کن و با آگاهی انتخاب کن.',

    learn_heading: 'آموزش',
    learn_body: 'راهنماهای کوتاه و کاربردی برای پیدا کردن و استفاده از محتوای بازی‌های PS4 و PS5.',
    learn_video_label: 'یک ویدیوی آموزشی را در مسیر زیر اضافه کنید',

    copy_heading: 'جیلبریک',
    copy_body: 'فایل‌های بازی PS4 و PS5، گزینه‌های اکانتی و زیرنویس‌های موجود را بررسی کنید.',

    payload_heading: 'پیلود',
    payload_body: 'پیش از استفاده از هر محتوای دیجیتال پلی‌استیشن، توضیحات و شرایط آن را بخوانید.',

    back_home: 'بازگشت به خانه ←',

    featured_heading: 'تازه‌ترین بازی‌ها',
    nav_subscription: 'اشتراک',
    req_title: "درخواست بازی یا زیرنویس",
    req_intro: "بازی‌ای را پیدا نمی‌کنید یا برای بازی‌ای زیرنویس می‌خواهید؟ به ما بگویید، تمام تلاشمان را می‌کنیم.",
    req_type: "چه چیزی لازم دارید؟",
    req_type_game: "یک بازی جدید",
    req_type_subtitle: "یک زیرنویس",
    req_type_other: "چیز دیگر",
    req_game: "نام بازی",
    req_game_ph: "مثلاً Elden Ring",
    req_details: "توضیحات (اختیاری)",
    req_details_ph: "زبان، نسخه، کدام ویدیو… هر چیزی که به ما کمک کند.",
    req_contact: "چطور با شما تماس بگیریم؟ (ایمیل، تلگرام یا تلفن)",
    req_send: "ارسال درخواست",
    req_thanks: "ممنون! درخواست شما را دریافت کردیم.",
    req_merged: "ممنون! دیگران هم این را خواسته‌اند، پس در فهرست ما بالاتر می‌رود.",
    req_auto_add: "درخواست شما ثبت شد. فهرست بازی‌ها را بررسی می‌کنیم و اگر تطبیق دقیق پیدا شود، بازی خودکار اضافه خواهد شد؛ در غیر این صورت تیم ما آن را بررسی می‌کند.",
    req_nav: "درخواست بازی / زیرنویس",
    req_game_btn: "درخواست زیرنویس",
    legal_terms: "شرایط استفاده",
    legal_privacy: "حریم خصوصی",
    legal_refund: "بازگشت وجه",
    legal_updated: "آخرین به‌روزرسانی",
    legal_loading: "در حال بارگذاری…",
    legal_back: "→ بازگشت به خانه",
    reg_agree_pre: "با ",
    reg_agree_mid: " و ",
    reg_agree_post: " موافقم.",
    reg_agree_needed: "برای ادامه، تیک پذیرش شرایط را بزنید.",
    code_title: "کد تخفیف",
    code_placeholder: "کد خود را وارد کنید",
    code_apply: "اعمال",
    code_remove: "حذف",
    code_active: "کد {code} فعال است: {percent}٪ تخفیف برای {what}",
    code_used_next: "در خرید بعدیِ مرتبط به‌صورت خودکار استفاده می‌شود.",
    code_gift: "کدهای هدیه دیگر پشتیبانی نمی‌شوند.",
    code_login: "برای استفاده از کد وارد شوید.",
    code_error: "این کد قابل استفاده نیست.",
    code_what_files: "باز کردن فایل‌ها",
    code_what_packs: "اشتراک‌ها",
    code_what_plans: "اشتراک‌ها",
    code_and: " و ",
    inv_title: "پاداش فروش هفتگی",
    inv_text: "ثبت‌نام و دعوت به‌تنهایی پورسانتی ندارند. فقط بازاریاب‌های تأییدشده از فروش واجد شرایط اشتراک پورسانت می‌گیرند.",
    inv_your_code: "کد دعوت شما",
    inv_copy: "کپی کد",
    inv_copy_link: "کپی لینک دعوت",
    inv_copied: "کپی شد!",
    inv_friends: "فروش تیم در این هفته",
    inv_friends_invited: "دوستان دعوت‌شده",
    inv_earned: "پورسانت قابل پرداخت (تومان)",
    inv_next: "پورسانت در انتظار (تومان)",
    inv_limit_reached: "سقف پاداش دعوت تکمیل شده است",
    inv_paused: "پاداش‌ها متوقف هستند",
    inv_tree_title: "پیشرفت هفتگی",
    inv_tree_note: "رتبه در طول این هفته ثابت است؛ فروش این هفته رتبه هفته بعد را تعیین می‌کند.",
    inv_tree_empty: "درخت دعوت شما هنوز شاخه‌ای ندارد.",
    inv_level: "سطح {level}",
    inv_customers: "مشتری",
    inv_none: "هنوز پورسانتی ثبت نشده است.",
    inv_off: "فقط بازاریاب‌های تأییدشده پورسانت می‌گیرند. ثبت‌نام و دعوت به‌تنهایی پاداشی ندارند.",
    reg_invite: "کد دعوت (اختیاری)",
    reg_invite_ok: "✓ معتبر است. حساب شما به {inviter} وصل می‌شود؛ ثبت‌نام به‌تنهایی پورسانتی ندارد.",
    reg_invite_bad: "کد دعوت پیدا نشد.",
    prof_login: "ورود یا ثبت‌نام",
    prof_view: "پروفایل شما",
    prof_invite_hint: "کد بازاریاب را برای ثبت فروش معرفی‌شده به اشتراک بگذارید",
    earnings_status_approved: "حساب بازاریاب تأیید شده است",
    earnings_status_pending: "این حساب هنوز به‌عنوان بازاریاب تأیید نشده است.",
    earnings_rank: "رتبه این هفته",
    earnings_next_rank: "رتبه بر اساس فروش این هفته",
    earnings_layers: "لایه‌های پورسانت فعال در این هفته",
    earnings_no_rank: "بدون رتبه",
    earnings_sponsor: "بازاریاب معرف",
    earnings_order: "سفارش اشتراک",
    earnings_pending: "در انتظار",
    earnings_paid: "تسویه شبیه‌سازی‌شده",
    earnings_reversed: "برگشت‌خورده",
    earnings_debt: "بدهی برگشت پورسانت: {amount} تومان",
    earnings_direct: "پورسانت مستقیم",
    tokens_referral: "کد معرفی بازاریاب (اختیاری)",
    tokens_referral_hint: "فقط کد بازاریاب‌های تأییدشده توسط مدیر برای پورسانت معتبر است.",
    currency_toman: "تومان",
    rel_heading: "بازی‌های مرتبط",
    rel_series: "همان مجموعه",
    rel_company: "همان استودیو: {company}",
    rel_genre: "همان سبک: {category}",
    foryou_heading: "سلیقه شما",
    foryou_popular: "محبوب‌ترین‌ها",
    foryou_personal: "بر اساس فایل‌هایی که دانلود کردید انتخاب شد",
    foryou_series: "ادامه‌ی همان مجموعه‌ی {seed}",
    foryou_company: "همان استودیوی {seed} ({company})",
    foryou_genre: "چون از {seed} دانلود کردید",
    ph_status_ok: "شماره تأیید شده",
    ph_status_no: "شماره تأیید نشده",
    ph_verify_btn: "تأیید شماره",
    ph_send: "ارسال کد با پیامک",
    ph_code: "کد ۶ رقمی پیامک",
    ph_confirm: "تأیید شماره",
    ph_sent: "پیامکی با کد ۶ رقمی به {phone} ارسال شد.",
    ph_dev: "ارسال پیامک هنوز راه‌اندازی نشده و پیامکی ارسال نشد. مدیر سایت می‌تواند کد را در داشبورد مدیریت ببیند.",
    ph_done: "شماره موبایل شما تأیید شد. ممنون!",
    ph_number: "شماره موبایل",
    ph_resend_in: "ارسال کد جدید تا {s} ثانیه دیگر",
    ph_resend: "ارسال کد جدید",
    ph_iran_only: "تأیید با پیامک فعلاً فقط برای شماره‌های موبایل ایران کار می‌کند.",
    reg_first: "نام",
    reg_last: "نام خانوادگی",
    reg_username: "نام کاربری",
    reg_phone: "شماره موبایل (مثال: ‎+989121234567)",
    reg_login_id: "ایمیل یا نام کاربری",
    reg_user_ok: "نام کاربری آزاد است",
    reg_user_taken: "این نام کاربری در دسترس نیست",
    reg_user_hint: "۳ تا ۲۰ کاراکتر: حروف انگلیسی، عدد، _ یا .",
    reg_phone_note: "شماره موبایل شما بعداً با پیامک تأیید می‌شود.",
    verify_expires_in: "اعتبار کد",
    verify_expired: "اعتبار این کد تمام شد. کد جدید بفرستید.",
    verify_title: "تأیید ایمیل",
    verify_text: "یک کد ۶ رقمی به {email} فرستادیم. برای تکمیل ساخت حساب، آن را اینجا وارد کنید.",
    verify_code: "کد ۶ رقمی",
    verify_btn: "تأیید و ساخت حساب",
    verify_resend: "ارسال کد جدید",
    verify_resend_in: "ارسال کد جدید تا {s} ثانیه دیگر",
    verify_change: "استفاده از ایمیل دیگر",
    verify_sent: "کد جدید ارسال شد.",
    verify_dev: "ارسال ایمیل هنوز راه‌اندازی نشده و ایمیلی ارسال نشد. مدیر سایت می‌تواند کد را در داشبورد مدیریت ببیند.",
    verify_expires: "کد تا {m} دقیقه اعتبار دارد.",
    nav_home: 'خانه',
    nav_gamepad: "تست دسته",
    gp_heading: "تست دسته",
    gp_intro: "دسته‌ات را وصل یا جفت کن و هر دکمه‌ای را بزن. همه‌ی دکمه‌ها، آنالوگ‌ها، تریگرها، موتورهای لرزش و سنسورها روشن می‌شوند تا ببینی کدام بخش سالم است و کدام خراب.",
    gp_sub_tagline: "تست همه‌ی دکمه‌ها و آنالوگ‌ها",
    gp_reload: "بارگذاری دوباره",
    gp_tip: "نکته: اگر دسته شناسایی نشد، یک دکمه‌اش را بزن و مطمئن شو برنامه‌ی دیگری از آن استفاده نمی‌کند.",
    file_free: "رایگان",
    file_owned: "باز شده",
    file_unlock: "باز کردن",
    file_login: "برای باز کردن وارد شوید",
    file_confirm: "این بازی با مصرف {price} گیگابایت از سهمیه دانلود پلن باز شود؟",
    file_unlocked: "باز شد! حالا می‌توانید دانلود کنید.",
    game_unlock: "بازکردن کل بازی",
    game_price_short: "گیگابایت سهمیه دانلود",
    game_unlock_confirm: "این بازی و فایل‌هایش با مصرف {price} گیگابایت از سهمیه دانلود پلن باز شود؟",
    game_unlocked: "بازی باز شد! همه فایل‌های آن آماده دانلود هستند.",
    file_not_enough: "سهمیه دانلود کافی نیست. این بازی {price} گیگابایت می‌خواهد و {balance} گیگابایت دارید.",
    file_get_tokens: "انتخاب پلن",
    wallet_login: "ورود",
    wallet_tokens: "سهمیه دانلود باقی‌مانده",
    wallet_buy_more: "مشاهده جزئیات پلن",
    wallet_get_from_plan: "انتخاب پلن اشتراک",
    tokens_heading: "سهمیه دانلود",
    tokens_intro: "حجم باقی‌مانده پلن برای بازکردن بازی‌ها بر اساس اندازه کامل آن‌ها مصرف می‌شود.",
    tokens_plan_cta_heading: "به سهمیه دانلود بیشتری نیاز داری؟",
    tokens_plan_cta_body: "برای دریافت سهمیه جدید، یک اشتراک انتخاب یا تمدید کن.",
    tokens_balance: "سهمیه دانلود باقی‌مانده",
    tokens_packs: "پلن‌های اشتراک",
    tokens_buy: "انتخاب پلن",
    tokens_bonus: "شامل‌شده",
    tokens_popular: "محبوب‌ترین",
    tokens_test_banner: "حالت آزمایشی: خریدها شبیه‌سازی می‌شوند و پولی کسر نمی‌شود.",
    tokens_pending: "سفارش اشتراک ثبت شد. دسترسی پس از تأیید پرداخت فعال می‌شود.",
    tokens_bought: "انجام شد! اشتراک و سهمیه دانلود شما فعال است.",
    tokens_login_needed: "برای دیدن تاریخچه سهمیه دانلود وارد شوید.",
    tokens_history: "مصرف دانلود",
    tokens_orders: "سفارش‌های اشتراک",
    tokens_none: "هنوز چیزی نیست.",
    status_pending: "در انتظار تأیید",
    status_paid: "پرداخت شده",
    status_rejected: "رد شده",
    tokens_how_to_pay: "روش پرداخت",
    account_heading: "حساب کاربری",
    account_login: "ورود",
    account_register: "ساخت حساب",
    avatar_picker_title: "یک آواتار انتخاب کنید",
    avatar_picker_note: "آواتاری را که می‌خواهید برای حساب خود استفاده کنید، انتخاب کنید.",
    avatar_picker_change: "تغییر آواتار",
    account_name: "نام شما",
    account_email: "ایمیل",
    account_password: "رمز عبور (حداقل ۸ کاراکتر)",
    account_logout: "خروج",
    account_welcome: "خوش آمدید",
    account_plan: "پلن فعلی",
    account_no_plan: "پلن فعالی ندارید",
    account_until: "تا",
    account_have: "حساب دارید؟ وارد شوید",
    account_new: "تازه آمده‌اید؟ حساب بسازید",
    account_error: "مشکلی پیش آمد. دوباره تلاش کنید.",
    profile_alerts: "هشدارهای حساب",
    profile_notifications: "اعلان‌ها",
    profile_devices: "دستگاه‌های متصل",
    profile_support: "ارتباط با پشتیبانی",
    profile_ideas: "ایده‌ها و پیشنهادها",
    profile_quick_links: "دسترسی سریع",
    game_reaction_prompt: "نظرت دربارهٔ این بازی چیست؟",
    game_reaction_like: "پسندیدم",
    game_reaction_dislike: "نپسندیدم",
    game_reaction_liked: "این بازی را پسندیدی.",
    game_reaction_disliked: "این بازی را نپسندیدی.",
    game_reaction_login_required: "برای ثبت پسند یا نپسند، وارد حساب کاربری شو.",
    game_reaction_like_count: "{count} پسند",
    game_reaction_dislike_count: "{count} نپسند",
    about_heading: "درباره GameDr ir",
    about_intro: "GameDr ir به گیمرهای پلی‌استیشن کمک می‌کند محتوای دیجیتال را پیدا کنند، گزینه‌ها را بهتر بشناسند و با اطمینان دانلودهایشان را مدیریت کنند.",
    about_access: "دسترسی سریع",
    about_rules: "قوانین و مسئولیت‌ها",
    about_privacy: "حریم خصوصی",
    legal_terms_intro: "استفاده از GameDr ir به معنی پذیرش قوانین سایت و مسئولیت‌های مربوط به محتوا و خدمات ارائه‌شده است.",
    legal_privacy_intro: "اطلاعات حساب برای ارائه دانلود، اشتراک، پشتیبانی و امنیت حساب استفاده می‌شود. برای جزئیات کامل، سیاست حریم خصوصی را بخوانید.",
    sub_includes: "حجم دانلود بازی",
    sub_subscribe: "اشتراک",
    sub_done: "اشتراک شما فعال شد و سهمیه دانلود آماده است.",
    sub_pending: "درخواست ثبت شد. پلن شما پس از تأیید پرداخت شروع می‌شود.",
    free_plan_active: "پلن رایگان فعال است",
    free_plan_activated: "دسترسی رایگان به Watch Dogs 2، GTA V، Rocket League، Mortal Kombat 11 و Brawlhalla فعال شد.",
    free_plan_already_active: "پلن رایگان شما از قبل فعال است و فقط شامل پنج بازی فهرست‌شده می‌شود.",
    sub_login: "برای اشتراک وارد شوید",
    report_btn: "گزارش مشکل",
    report_title: "گزارش مشکل",
    report_intro: "مشکل این صفحه چیست؟",
    report_reason_unrelated: "محتوای نامرتبط",
    report_reason_age: "تصویر نامناسب / مخصوص بزرگسالان",
    report_reason_broken: "فایل یا دانلود خراب",
    report_reason_wrong: "اطلاعات اشتباه بازی",
    report_reason_other: "مورد دیگر",
    report_details: "توضیح بیشتر بدهید (چه چیزی دیدید؟)",
    report_email: "ایمیل شما (اختیاری، برای دریافت پاسخ)",
    report_submit: "ارسال گزارش",
    report_cancel: "انصراف",
    report_thanks: "ممنون! گزارش شما ارسال شد و بررسی خواهد شد.",
    report_error: "ارسال گزارش ناموفق بود. دوباره تلاش کنید.",
    report_pick: "لطفاً مشکل را انتخاب کنید.",
    nav_contact: "تماس با ما",
    contact_heading: "تماس با ما",
    contact_intro: "سوالی دارید یا به کمک نیاز دارید؟ برای ما پیام بگذارید تا پاسخ دهیم.",
    contact_name: "نام شما",
    contact_email: "ایمیل (اختیاری)",
    contact_message: "پیام شما",
    contact_send: "ارسال پیام",
    contact_sent: "ممنون! پیام شما ارسال شد.",
    contact_error: "ارسال پیام ناموفق بود. دوباره تلاش کنید.",
    contact_info_heading: "راه‌های ارتباطی",
    contact_phone_label: "تلفن",
    contact_email_label: "ایمیل",
    contact_address_label: "آدرس",
    contact_hours_label: "ساعات کاری",
    sub_tagline: 'سرعت بیشتر، حجم دانلود بیشتر، تجربه بهتر در GameDr',
    sub_tag_new: 'پلن‌ها',
    sub_eyebrow: 'سرعت بیشتر • حجم دانلود بیشتر • تجربه بهتر در GameDr',
    sub_full_access: 'دسترسی کامل',
    sub_heading: 'اشتراکت رو انتخاب کن، سریع‌تر دانلود کن!',
    sub_intro: 'پلنت را بر اساس سرعت دانلود، بازی‌های پشتیبانی‌شده و حجم قابل دانلود انتخاب کن.',
    plan_usage_warning: 'با تمام شدن سهمیه، نمی‌توانی بازی جدیدی باز کنی. بازی‌های بازشده تا پایان مهلت ۳۰روزه در دسترس می‌مانند.',
    plan_data_quota: '{quota} دانلود بازی',
    plan_required: 'برای این بازی به اشتراک پولی فعال نیاز داری. برای ادامه یک پلن انتخاب کن.',
    free_games_heading: 'بازی‌های شامل پلن · بدون نیاز به سهمیه دانلود',
    plan_free_warning: 'دسترسی رایگان فقط شامل این پنج بازی است. بازی‌های دیگر در پلن رایگان قرار ندارند.',
    sub_period_note: 'پلن‌های پولی ۳۰ روزه‌اند. پلن رایگان فقط به پنج بازی زیر دسترسی می‌دهد و محدودیت حجم ندارد.',
    plan_free_summary: 'این پلن فقط به همین ۵ بازی دسترسی می‌دهد و حجم دانلودشان نامحدود است.',
    plan_bronze_summary: 'شروعی اقتصادی با سرعت اختصاصی و ۵۰۰ گیگابایت دانلود بازی.',
    plan_silver_summary: 'پلنی متعادل با دسترسی به پلتفرم‌های بیشتر و ۱ ترابایت دانلود.',
    plan_gold_summary: 'دسترسی گسترده به پلتفرم‌ها، سرعت بالاتر و ۲٫۲ ترابایت دانلود بازی.',
    plan_bronze_name: 'برنز',
    plan_silver_name: 'نقره‌ای',
    plan_gold_name: 'طلایی',
    plan_bronze_price: '۶۹۸٬۰۰۰ تومان',
    plan_silver_price: '۱٬۱۹۸٬۰۰۰ تومان',
    plan_gold_price: '۲٬۰۹۸٬۰۰۰ تومان',
    plan_per_month: '/ ۳۰ روز',
    plan_feature_1: 'دسترسی به بازی‌های پلی‌استیشن',
    plan_feature_2: 'اطلاعات حساب و دانلود',
    plan_feature_3: 'از صنعت چاپ و طراحان',
    plan_choose: 'انتخاب پلن',
    latest_heading: 'تازه‌ترین بازی‌ها',
    two_player_heading: 'بازی‌های دو نفره',
    vr_heading: 'بازی‌های پشتیبانی‌کننده از واقعیت مجازی',
    profile_request: 'درخواست بازی',
    profile_games: 'بازی‌های خریداری‌شده',
    profile_activity: 'سوابق دانلود و سفارش‌ها',
    bestsellers_heading: 'پرفروش‌ترین‌ها',
    bestsellers_empty: 'هنوز فروشی ثبت نشده است. بازی‌های پرفروش اینجا نمایش داده می‌شوند.',
    all_categories_btn: 'همه دسته‌بندی‌ها',
    view_all_btn: 'مشاهده همه بازی‌ها ←',

    hero_title_default: 'بیش از ۳۰۰ بازی پلی‌استیشن را کشف کن',
    pill_all: 'همه بازی‌ها',
    pill_with_subtitle: 'دارای زیرنویس',
    no_results: 'هیچ بازی‌ای با جستجوی شما مطابقت ندارد.',

    back_all_games: 'همه بازی‌ها ←',
    screenshots_heading: 'تصاویر گیم‌پلی',
    description_heading: 'درباره بازی',
    game_details_kicker: 'پروفایل پلی‌استیشن',
    game_details_heading: 'جزئیات بازی',
    game_details_source: 'برگرفته از اطلاعات فروشگاه پلی‌استیشن',
    game_details_source_curated: 'خلاصهٔ تدوین‌شدهٔ بازی',
    game_details_recognition: 'جوایز و استودیو',
    game_details_studio: 'استودیوی سازنده',
    game_details_awards: 'جوایز بازی',
    game_details_studio_awards: 'افتخارات استودیو',
    game_details_no_awards: 'جایزه‌ای ثبت نشده است',
    game_details_story_label: 'قلب بازی',
    game_details_story_heading: 'داستان',
    game_details_support: 'ویژگی‌های بازی',
    game_details_support_heading: 'بازی از چه چیزهایی پشتیبانی می‌کند؟',
    game_details_metacritic: 'متاکریتیک',
    game_details_critic_score: 'امتیاز منتقدان',
    game_details_awards_source: 'The Game Awards',
    game_details_esrb_mature: 'رده سنی بزرگسال ESRB ۱۷+',
    game_details_content: 'محتوای هشداردهنده',
    game_details_not_listed: 'ثبت نشده است',
    game_details_supported: 'پشتیبانی می‌شود',
    game_details_not_supported: 'پشتیبانی نمی‌شود',
    game_details_dualsense: 'بازخورد لمسی DualSense',
    game_details_vr: 'پشتیبانی از واقعیت مجازی',
    game_details_online: 'بازی آنلاین',
    game_details_players: 'تعداد بازیکن',
    game_details_playtime: 'مدت زمان بازی',
    game_details_varies: 'بسته به سبک بازی متفاوت است',
    game_details_playtime_source: 'منبع زمان بازی',
    game_details_age: 'رده سنی',
    game_details_platforms: 'پلتفرم‌ها',
    game_tag_single_player: 'تک‌نفره',
    game_tag_multiplayer: 'چندنفره',
    game_tag_age: 'رده سنی {age}',
    loading: 'در حال بارگذاری…',
    not_found: 'بازی یافت نشد',
    no_clips: 'هنوز کلیپی برای این بازی آپلود نشده است.',
    files_heading: 'فایل‌ها',
    files_none: 'در حال حاضر هیچ فایلی برای این محتوا وجود ندارد.',
    files_unavailable: 'هنوز در دسترس نیست',
    files_request: 'درخواست این محتوا',
    download_btn: 'دانلود',
    back_home: '← خانه',
    downloads_kicker: 'مرکز دانلود',
    downloads_heading: 'دانلودهای شما',
    downloads_intro: 'دانلودهای فعال را دنبال کنید و فایل‌های تکمیل‌شده را یکجا ببینید.',
    downloads_status_kicker: 'وضعیت زنده',
    downloads_document_title: 'دانلودها · دکتر گیم',

    footer_tagline: 'GameDr ir؛ همراه گیمرها در دنیای پلی‌استیشن.',
    footer_follow_us: 'ما را دنبال کنید',
    footer_contact: 'تماس با ما',
    footer_copyright: '© ۲۰۲۶ دکتر گیم.',
  },
};

const CATEGORY_FA = {
  'Action-Adventure': 'اکشن-ماجراجویی',
  'RPG': 'نقش‌آفرینی',
  'Shooter': 'تیراندازی',
  'Fighting': 'مبارزه‌ای',
  'Horror': 'ترسناک',
  'Sports & Racing': 'ورزشی و مسابقه‌ای',
  'Platformer & Puzzle': 'پلتفرمر و پازل',
  'Survival & Open-World': 'بقا و دنیای باز',
  'Strategy & Simulation': 'استراتژی و شبیه‌سازی',
  'Indie & Roguelike': 'ایندی و روگ‌لایک',
  'Party & Rhythm': 'مهمانی و موزیکال',
  'Most Famous': 'معروف‌ترین‌ها',
  'Lately Released': 'تازه منتشر شده‌ها',
  '2 Player Games': 'بازی‌های دو نفره',
  'VR Supported Games': 'بازی‌های VR',
};

function getLang() {
  try {
    return localStorage.getItem('gv_lang') === 'fa' ? 'fa' : 'en';
  } catch (e) {
    return 'en';
  }
}

function setLang(lang) {
  try {
    localStorage.setItem('gv_lang', lang);
  } catch (e) {
    // localStorage unavailable (private browsing etc.) — the toggle just
    // won't persist across reloads, which is an acceptable degradation.
  }
  location.reload();
}

function t(key) {
  const lang = getLang();
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
}

// small line icon for each game category (inline SVG, takes the text colour)
const CATEGORY_ICONS = {"Most Famous":"<path d=\"M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z\"/>","Lately Released":"<path d=\"M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.500 15.500L18 18M18 6l-2.500 2.500M8.500 15.500L6 18\"/>","Action-Adventure":"<path d=\"M14.500 4.500L20 4l-.5 5.500L9 20l-5-5zM4 20l3-3M8.500 12.500l3 3M6 18l-2 2\"/>","Fighting":"<path d=\"M7 11V6.500a1.500 1.500 0 013 0V10m0-1V5.500a1.500 1.500 0 013 0V10m0-.500V6.500a1.500 1.500 0 013 0V12m0-3.500a1.500 1.500 0 013 0V15c0 3.500-2.500 6-6 6h-1.500c-2.500 0-4-1-5.500-3L4 14.500a1.600 1.600 0 012.500-2L7 13\"/>","Horror":"<path d=\"M12 3a8 8 0 00-5 14.200V20h10v-2.800A8 8 0 0012 3z\"/><circle cx=\"9\" cy=\"11.500\" r=\"1.600\"/><circle cx=\"15\" cy=\"11.500\" r=\"1.600\"/><path d=\"M10.500 16.500v2M13.500 16.500v2\"/>","Indie & Roguelike":"<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"3\"/><circle cx=\"8.500\" cy=\"8.500\" r=\"1\" fill=\"currentColor\"/><circle cx=\"15.500\" cy=\"8.500\" r=\"1\" fill=\"currentColor\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/><circle cx=\"8.500\" cy=\"15.500\" r=\"1\" fill=\"currentColor\"/><circle cx=\"15.500\" cy=\"15.500\" r=\"1\" fill=\"currentColor\"/>","Party & Rhythm":"<path d=\"M9 18V6l11-2v12\"/><circle cx=\"6.500\" cy=\"18\" r=\"2.500\"/><circle cx=\"17.500\" cy=\"16\" r=\"2.500\"/>","Platformer & Puzzle":"<path d=\"M10 4a2 2 0 014 0v2h4a1 1 0 011 1v4h-2a2 2 0 100 4h2v4a1 1 0 01-1 1h-4v-2a2 2 0 10-4 0v2H6a1 1 0 01-1-1v-4h2a2 2 0 100-4H5V7a1 1 0 011-1h4z\"/>","RPG":"<path d=\"M12 3l7.500 3v5.500c0 4.500-3 8-7.500 9.500-4.500-1.500-7.500-5-7.500-9.500V6z\"/><path d=\"M12 8v8M8.500 11.500h7\"/>","Shooter":"<circle cx=\"12\" cy=\"12\" r=\"7.500\"/><path d=\"M12 2.500v5M12 16.500v5M2.500 12h5M16.500 12h5\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>","Sports & Racing":"<path d=\"M5 21V4M5 4h14l-3 4.500 3 4.500H5\"/>","Strategy & Simulation":"<circle cx=\"12\" cy=\"6.500\" r=\"2.500\"/><path d=\"M9.500 11h5L14 15h2l1 4H7l1-4h2zM6 21h12\"/>","Survival & Open-World":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M15.500 8.500L13.500 13.500 8.500 15.500 10.500 10.500z\"/>","__all":"<rect x=\"4\" y=\"4\" width=\"6.500\" height=\"6.500\" rx=\"1.500\"/><rect x=\"13.500\" y=\"4\" width=\"6.500\" height=\"6.500\" rx=\"1.500\"/><rect x=\"4\" y=\"13.500\" width=\"6.500\" height=\"6.500\" rx=\"1.500\"/><rect x=\"13.500\" y=\"13.500\" width=\"6.500\" height=\"6.500\" rx=\"1.500\"/>"};
const FEATURE_ICONS = {
  '2 Player Games': '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3.5 19c.6-3 2.1-4.5 4.5-4.5S12 16 12.5 19M11.5 19c.6-3 2.1-4.5 4.5-4.5s3.9 1.5 4.5 4.5"/>',
  'VR Supported Games': '<path d="M4 8.5h16a2 2 0 012 2v3a2 2 0 01-2 2h-3.5l-2-2h-5l-2 2H4a2 2 0 01-2-2v-3a2 2 0 012-2Z"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/>',
};
function categoryIcon(name) {
  const p = CATEGORY_ICONS[name] || FEATURE_ICONS[name] || CATEGORY_ICONS.__all;
  const s = document.createElement('span');
  s.className = 'cat-icon';
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  return s;
}
// icon + translated name, used wherever a category is listed
function categoryLabel(name, text) {
  const l = document.createElement('span');
  l.className = 'cat-label';
  l.append(categoryIcon(name), document.createTextNode(text || translateCategory(name)));
  return l;
}

// smaller copy of a cover picture for small spots (the server makes it once and keeps it)
function coverSrc(url, w) { return url && url.indexOf('/covers/') === 0 ? url + '?w=' + w : url; }

function translateCategory(name) {
  if (!name) return name;
  const dynamic = window.DRT && window.DRT.categoryLabels && window.DRT.categoryLabels[name];
  if (getLang() === 'fa') return (dynamic && dynamic.fa) || CATEGORY_FA[name] || name;
  return (dynamic && dynamic.en) || name;
}

// Platform logos are local downloaded assets rather than hand-drawn marks.
// Keeping them in the public bundle makes the mega-menu fast and available
// offline after the first page load.
const PLATFORM_ASSETS = {
  ps5: '/assets/platforms/ps5.svg',
  ps4: '/assets/platforms/ps4.svg',
  psvr2: '/assets/platforms/psvr2.svg',
  xbox360: '/assets/platforms/xbox360.svg',
  switch: '/assets/platforms/switch.svg',
};

function platformMark(type, label) {
  const mark = document.createElement('span');
  mark.className = 'platform-mega-mark platform-mark-' + type;
  mark.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.src = PLATFORM_ASSETS[type] || PLATFORM_ASSETS.ps5;
  image.alt = label || '';
  image.loading = 'lazy';
  image.decoding = 'async';
  mark.appendChild(image);
  return mark;
}

// Build the Sony-style navigation groups while keeping every destination on
// the site's existing pages. The menu labels are translated by applyLanguage().
function buildHeaderDropdowns(nav) {
  if (!nav || nav.dataset.sonyMenusReady === 'true') return;
  nav.dataset.sonyMenusReady = 'true';

  const link = (labelKey, href) => {
    const a = document.createElement('a');
    a.className = 'nav-menu-link';
    a.href = href;
    a.dataset.i18n = labelKey;
    a.textContent = t(labelKey);
    return a;
  };

  const menu = (labelKey, links) => {
    const item = document.createElement('div');
    item.className = 'nav-menu-item';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nav-menu-trigger';
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    const label = document.createElement('span');
    label.dataset.i18n = labelKey;
    label.textContent = t(labelKey);
    const chevron = document.createElement('span');
    chevron.className = 'nav-menu-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '⌄';
    trigger.append(label, chevron);

    const panel = document.createElement('div');
    panel.className = 'nav-menu-panel';
    panel.setAttribute('role', 'menu');
    links.forEach(([childKey, href]) => {
      const a = link(childKey, href);
      a.setAttribute('role', 'menuitem');
      panel.appendChild(a);
    });
    item.append(trigger, panel);
    return item;
  };

  const platformMenu = () => {
    const item = document.createElement('div');
    item.className = 'nav-menu-item platform-nav-item';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nav-menu-trigger';
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    const label = document.createElement('span');
    label.dataset.i18n = 'nav_platform';
    label.textContent = t('nav_platform');
    const chevron = document.createElement('span');
    chevron.className = 'nav-menu-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '⌄';
    trigger.append(label, chevron);

    const panel = document.createElement('div');
    panel.className = 'nav-menu-panel platform-mega-panel';
    panel.setAttribute('role', 'menu');
    const grid = document.createElement('div');
    grid.className = 'platform-mega-grid';
    [
      ['nav_ps5', '/games.html?platform=ps5', 'ps5'],
      ['nav_ps4', '/games.html?platform=ps4', 'ps4'],
      ['nav_psvr2', '/games.html?platform=psvr2', 'psvr2'],
      ['nav_xbox360', '/games.html?platform=xbox-360', 'xbox360'],
      ['nav_nintendo_switch', '/games.html?platform=nintendo-switch', 'switch'],
    ].forEach(([labelKey, href, type]) => {
      const link = document.createElement('a');
      link.className = 'platform-mega-link nav-menu-link';
      link.href = href;
      link.setAttribute('role', 'menuitem');
      const labelText = t(labelKey);
      link.append(platformMark(type, labelText));
      const text = document.createElement('span');
      text.className = 'platform-mega-label';
      text.dataset.i18n = labelKey;
      text.textContent = labelText;
      link.append(text);
      grid.appendChild(link);
    });
    panel.appendChild(grid);
    item.append(trigger, panel);
    return item;
  };

  nav.replaceChildren(
    menu('nav_store', [
      ['nav_all_games', '/games.html'],
      ['nav_plans', '/subscription.html'],
    ]),
    platformMenu(),
    menu('nav_games', [
      ['nav_all_games', '/games.html'],
      ['nav_latest', '/games.html?category=Lately%20Released'],
      ['nav_two_player', '/games.html?feature=two-player'],
      ['nav_vr', '/games.html?feature=vr'],
    ]),
    menu('nav_subscription', [
      ['plan_gold_name', '/subscription.html#plan-gold'],
      ['plan_silver_name', '/subscription.html#plan-silver'],
      ['plan_bronze_name', '/subscription.html#plan-bronze'],
    ]),
    menu('nav_accessories', [
      ['nav_gamepad', '/gamepad-tester.html'],
    ]),
    menu('nav_news', [
      ['learn_heading', '/learn.html'],
      ['copy_heading', '/copy.html'],
    ]),
    menu('nav_support', [
      ['nav_contact', '/contact.html'],
      ['nav_request', '/request.html'],
      ['nav_ideas', '/profile.html?tab=support#ideas'],
    ]),
  );

  const closeMenus = () => {
    nav.querySelectorAll('.nav-menu-item.is-open').forEach(item => {
      item.classList.remove('is-open');
      item.querySelector('.nav-menu-trigger')?.setAttribute('aria-expanded', 'false');
    });
  };
  nav.addEventListener('click', event => {
    const trigger = event.target.closest('.nav-menu-trigger');
    if (!trigger || !nav.contains(trigger)) return;
    const item = trigger.closest('.nav-menu-item');
    const wasOpen = item.classList.contains('is-open');
    closeMenus();
    if (!wasOpen) {
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
  // A clicked menu can remain open while the pointer moves across the header.
  // Close that menu as soon as another tab is hovered so only one panel is
  // visible at a time; the hovered tab still opens through the CSS hover state.
  nav.addEventListener('pointerover', event => {
    const item = event.target.closest('.nav-menu-item');
    if (!item || !nav.contains(item) || item.classList.contains('is-open')) return;
    closeMenus();
  });
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenus();
      nav.querySelector('.nav-menu-trigger:focus')?.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) closeMenus();
  });
}

// Keep the store controls consistent on every page. Some older secondary pages
// only shipped a logo and language switch, so add the shared search and account
// controls before each page initializes its own search behavior.
function mountSharedHeader() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  // Sony-inspired brand strip that sits above the main navigation header.
  if (!document.querySelector('.brand-strip')) {
    const strip = document.createElement('div');
    strip.className = 'brand-strip';
    strip.setAttribute('aria-label', 'Dr Game');
    strip.innerHTML = '<span>Dr Game</span>';
    topbar.parentElement?.insertBefore(strip, topbar);
  }
  if (!document.querySelector('link[data-header-account-style]')) {
    const accountStyle = document.createElement('link');
    accountStyle.rel = 'stylesheet';
    accountStyle.href = '/header-account.css?v=header-white-polish-20261020';
    accountStyle.dataset.headerAccountStyle = 'true';
    document.head.append(accountStyle);
  }
  topbar.classList.add('site-header-redesign');

  // Keep the storefront header white even when the rest of the page uses the
  // dark theme. Append this after the shared header stylesheet so its surface
  // and navigation contrast cannot be replaced by the theme's dark tokens.
  let headerThemeStyle = document.getElementById('gamedr-header-theme-style');
  if (!headerThemeStyle) {
    headerThemeStyle = document.createElement('style');
    headerThemeStyle.id = 'gamedr-header-theme-style';
    document.head.appendChild(headerThemeStyle);
  }
  headerThemeStyle.textContent = `
    html body .topbar.site-header-redesign {
      color: #20242b !important;
      background: #fff !important;
      background-color: #fff !important;
      background-image: none !important;
      border-bottom-color: #e4e8ed !important;
      box-shadow: 0 4px 16px rgba(25,35,48,.08) !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    html body .topbar.site-header-redesign .nav-links { gap: clamp(2px,.55vw,9px); }
    html body .topbar.site-header-redesign .nav-menu-trigger {
      min-height: 44px; padding: 9px 11px; border: 1px solid transparent;
      border-radius: 9px; color: #222832 !important; background: transparent !important;
      box-shadow: none !important; font-size: 14px; font-weight: 650;
      letter-spacing: -.01em; transition: color .16s ease, background-color .16s ease;
    }
    html body .topbar.site-header-redesign .nav-menu-item:hover .nav-menu-trigger,
    html body .topbar.site-header-redesign .nav-menu-item:focus-within .nav-menu-trigger,
    html body .topbar.site-header-redesign .nav-menu-item.is-open .nav-menu-trigger {
      color: #005b9f !important; background: #f2f7fb !important; border-color: transparent !important;
    }
    html body .topbar.site-header-redesign .nav-menu-panel {
      color: #252c35 !important; background: #fff !important; border-color: #e0e5eb !important;
      border-radius: 12px; box-shadow: 0 16px 34px rgba(25,35,48,.14), 0 2px 7px rgba(25,35,48,.05) !important;
      -webkit-backdrop-filter: none !important; backdrop-filter: none !important;
    }
    html body .topbar.site-header-redesign .nav-menu-link { color: #29313b !important; border-radius: 8px; font-size: 14px; font-weight: 600; }
    html body .topbar.site-header-redesign .nav-menu-link:hover,
    html body .topbar.site-header-redesign .nav-menu-link:focus-visible { color: #005b9f !important; background: #f2f7fb !important; transform: none; }
    html body .topbar.site-header-redesign .profile-icon,
    html body .topbar.site-header-redesign .notification-icon,
    html body .topbar.site-header-redesign .theme-toggle,
    html body .topbar.site-header-redesign .lang-toggle,
    html body .topbar.site-header-redesign .hamburger {
      color: #303844 !important; background: #fff !important; border-color: #e0e5eb !important; box-shadow: none !important;
    }
    html body .topbar.site-header-redesign .search-wrap input {
      color: #20242b !important; background: #f5f7f9 !important; border-color: #e0e5eb !important; box-shadow: none !important;
    }
    html body .topbar.site-header-redesign .search-wrap input::placeholder { color: #697482 !important; }
    html body .topbar.site-header-redesign .hamburger span { background-color: currentColor !important; }
    html body .topbar.site-header-redesign .wallet-chip { color: #354052 !important; background: #f5f7f9 !important; border-color: #e0e5eb !important; }
  `;

  const nav = topbar.querySelector('.nav-links');
  buildHeaderDropdowns(nav);
  if (nav) {
    nav.setAttribute('aria-label', getLang() === 'fa' ? 'ناوبری اصلی' : 'Main navigation');
  }

  let searchWrap = topbar.querySelector('.search-wrap');
  if (!searchWrap) {
    searchWrap = document.createElement('div');
    searchWrap.className = 'search-wrap';
    const input = document.createElement('input');
    input.id = 'search';
    input.type = 'search';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', getLang() === 'fa' ? 'جستجوی بازی‌ها' : 'Search games');
    input.setAttribute('data-i18n-placeholder', 'search_placeholder');
    searchWrap.appendChild(input);
    if (nav) nav.insertAdjacentElement('afterend', searchWrap);
    else topbar.appendChild(searchWrap);
  }
  searchWrap.dir = getLang() === 'fa' ? 'rtl' : 'ltr';

  if (!topbar.querySelector('.profile-icon')) {
    const profile = document.createElement('a');
    profile.className = 'profile-icon';
    profile.href = '/profile.html';
    profile.setAttribute('data-i18n-title', 'account_heading');
    profile.setAttribute('aria-label', getLang() === 'fa' ? 'حساب کاربری' : 'Account');
    profile.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/></svg>';
    const before = document.getElementById('theme-toggle') || document.getElementById('lang-toggle');
    topbar.insertBefore(profile, before || null);
  }
  const profile = topbar.querySelector('.profile-icon');
  if (profile) {
    profile.setAttribute('data-i18n-title', 'account_heading');
    profile.setAttribute('aria-label', getLang() === 'fa' ? 'حساب کاربری' : 'Account');
  }
  let notificationLink = topbar.querySelector('.notification-icon');
  if (!notificationLink) {
    notificationLink = document.createElement('a');
    notificationLink.className = 'notification-icon';
    notificationLink.href = '/profile.html?tab=activity#notifications';
    notificationLink.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>';
  }
  notificationLink.setAttribute('data-i18n-title', 'profile_notifications');
  notificationLink.setAttribute('aria-label', getLang() === 'fa' ? 'اعلان‌ها' : 'Notifications');
  let actions = topbar.querySelector('.header-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'header-actions';
    searchWrap.insertAdjacentElement('afterend', actions);
  }
  const languageToggle = topbar.querySelector('#lang-toggle');
  if (profile && profile.parentElement !== actions) actions.appendChild(profile);
  if (notificationLink.parentElement !== actions) actions.insertBefore(notificationLink, profile || languageToggle || null);
  if (languageToggle && languageToggle.parentElement !== actions) actions.appendChild(languageToggle);

  let brandGroup = topbar.querySelector('.header-brand-group');
  if (!brandGroup) {
    brandGroup = document.createElement('div');
    brandGroup.className = 'header-brand-group';
    topbar.appendChild(brandGroup);
  }
  const brand = topbar.querySelector('.header-brand-group .brand') || Array.from(topbar.children).find(child => child.matches('.brand'));
  const hamburger = topbar.querySelector('.hamburger');
  if (brand && brand.parentElement !== brandGroup) brandGroup.appendChild(brand);
  if (hamburger) {
    hamburger.setAttribute('aria-label', getLang() === 'fa' ? 'باز کردن منو' : 'Open menu');
    // Keep the menu control at the very left edge of the utility group.
    // Other controls (wallet, theme, language and account) follow it.
    actions.insertBefore(hamburger, actions.firstChild || null);
  }
  let rightGroup = topbar.querySelector('.header-right-group');
  if (!rightGroup) {
    rightGroup = document.createElement('div');
    rightGroup.className = 'header-right-group';
    topbar.appendChild(rightGroup);
  }
  if (nav && nav.parentElement !== rightGroup) rightGroup.appendChild(nav);
  if (brandGroup.parentElement !== rightGroup) rightGroup.appendChild(brandGroup);

  const currentPath = location.pathname.replace(/\/$/, '') || '/';
  topbar.querySelectorAll('.nav-links a').forEach(link => {
    const linkPath = new URL(link.href, location.origin).pathname.replace(/\/$/, '') || '/';
    if (linkPath === currentPath) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const search = topbar.querySelector('#search');
  if (search) search.setAttribute('aria-label', getLang() === 'fa' ? 'جستجوی بازی‌ها' : 'Search games');
  if (search && !['/', '/index.html', '/games.html', '/game.html'].includes(currentPath) && !search.dataset.headerSearchBound) {
    search.dataset.headerSearchBound = 'true';
    search.addEventListener('keydown', event => {
      if (event.key === 'Enter') location.href = '/games.html?q=' + encodeURIComponent(search.value);
    });
  }
}

mountSharedHeader();

// Swaps textContent for every [data-i18n] element and placeholder text for
// every [data-i18n-placeholder] element, and sets the page's text direction.
function applyLanguage() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  const headerSearch = document.querySelector('.topbar.site-header-redesign .search-wrap');
  if (headerSearch) headerSearch.dir = lang === 'fa' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  const toggle = document.getElementById('lang-toggle');
  if (toggle) toggle.textContent = t('lang_toggle');
  const notificationLink = document.querySelector('.notification-icon');
  if (notificationLink) {
    notificationLink.title = t('profile_notifications');
    notificationLink.setAttribute('aria-label', t('profile_notifications'));
  }
  applySiteContent();
}

// Admin-editable text (Learn / Copy / Payload sections) overrides the
// built-in translations when the admin has filled it in.
async function applySiteContent() {
  try {
    const res = await DRT.fetchPublic('/api/site-content');
    if (!res.ok) return;
    const c = await res.json();
    const lang = getLang();
    const map = {
      learn_heading: c.learn && c.learn['heading_' + lang],
      learn_body: c.learn && c.learn['body_' + lang],
      copy_heading: c.copy && c.copy['heading_' + lang],
      copy_body: c.copy && c.copy['body_' + lang],
      payload_heading: c.payload && c.payload['heading_' + lang],
      payload_body: c.payload && c.payload['body_' + lang],
    };
    applyFooter(c, lang);
    document.querySelectorAll('[data-blurb]').forEach(el => {
      const sec = c[el.dataset.blurb], v = sec && sec['blurb_' + lang];
      el.textContent = v || '';
      el.style.display = v ? '' : 'none';
    });
    for (const [key, value] of Object.entries(map)) {
      if (!value) continue;
      document.querySelectorAll('[data-i18n="' + key + '"]').forEach(el => { el.textContent = value; });
    }
  } catch (e) { /* offline or API missing: keep built-in text */ }
}

function initLangToggle() {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    setLang(getLang() === 'fa' ? 'en' : 'fa');
  });
}

// Footer: texts, social accounts and contact details come from the admin (Footer tab).
// Until the admin has saved something the built-in demo footer stays as it is.
function applyFooter(c, lang) {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;
  // E-Namad trust badge (Iran's e-commerce trust symbol): built only from the ID and code saved in the admin
  const badges = footer.querySelector('#footer-badges');
  if (badges && c.legal && c.legal.enamad && c.legal.enamad.id && c.legal.enamad.code) {
    const { id, code } = c.legal.enamad;
    const q = 'id=' + encodeURIComponent(id) + '&Code=' + encodeURIComponent(code);
    const a = document.createElement('a');
    a.href = 'https://trustseal.enamad.ir/?' + q;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('referrerpolicy', 'origin');
    const img = document.createElement('img');
    img.src = 'https://trustseal.enamad.ir/logo.aspx?' + q;
    img.alt = 'E-Namad';
    img.setAttribute('referrerpolicy', 'origin');
    img.setAttribute('code', code);
    img.style.cursor = 'pointer';
    a.appendChild(img);
    badges.replaceChildren(a);
  }
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const link = (icon, label, href, external) => {
    const a = el('a', 'footer-link');
    a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    // numbers, handles and emails always read left-to-right, also inside a right-to-left page
    const text = el('span', '', label);
    text.dir = 'ltr';
    text.style.unicodeBidi = 'isolate';
    a.append(el('span', 'footer-icon', icon), text);
    return a;
  };
  const f = c.footer, ct = c.contact;

  // A key that has never been saved (undefined) keeps the built-in demo item; a saved empty
  // value hides it.
  if (f) {
    const tagline = footer.querySelector('.footer-brand p');
    if (tagline && (f.tagline_en !== undefined || f['tagline_' + lang] !== undefined)) {
      tagline.textContent = f['tagline_' + lang] || f.tagline_en || '';
      tagline.style.display = tagline.textContent ? '' : 'none';
    }
    const copy = footer.querySelector('.footer-bottom p');
    if (copy && (f.copyright_en !== undefined || f['copyright_' + lang] !== undefined)) {
      copy.textContent = f['copyright_' + lang] || f.copyright_en || '';
      copy.style.display = copy.textContent ? '' : 'none';
    }

    const col = [...footer.querySelectorAll('.footer-col')].find(x => x.querySelector('[data-i18n="footer_follow_us"]'));
    if (col) {
      // remember the built-in links by their icon so unsaved platforms can be kept as they are
      const builtIn = {};
      col.querySelectorAll('a').forEach(x => {
        const icon = (x.querySelector('.footer-icon') || {}).textContent || '';
        if (icon.includes('📷')) builtIn.instagram = x;
        else if (icon.includes('💬')) builtIn.whatsapp = x;
        else if (icon.includes('✈')) builtIn.telegram = x;
        x.remove();
      });
      const make = {
        instagram: v => link('📷', 'Instagram — @' + v, 'https://instagram.com/' + encodeURIComponent(v), true),
        whatsapp: v => link('💬', 'WhatsApp — +' + v, 'https://wa.me/' + v, true),
        telegram: v => link('✈️', 'Telegram — @' + v, 'https://t.me/' + encodeURIComponent(v), true),
      };
      for (const key of ['instagram', 'whatsapp', 'telegram']) {
        if (f[key] === undefined) { if (builtIn[key]) col.appendChild(builtIn[key]); }
        else if (f[key]) col.appendChild(make[key](f[key]));
      }
      col.style.display = col.querySelector('a') ? '' : 'none';
    }
  }

  if (ct) {
    const col = [...footer.querySelectorAll('.footer-col')].find(x => x.querySelector('[data-i18n="footer_contact"]'));
    if (col) {
      col.querySelectorAll('a, .footer-line').forEach(x => x.remove());
      for (const p of [ct.phone1, ct.phone2]) if (p) col.appendChild(link('\uD83D\uDCDE', p, 'tel:' + (p.trim().startsWith('+') ? '+' : '') + p.replace(/\D/g, ''), false));
      if (ct.email) col.appendChild(link('\u2709\uFE0F', ct.email, 'mailto:' + ct.email, false));
      const addr = ct['address_' + lang] || ct.address_en;
      if (addr) { const line = el('div', 'footer-link footer-line'); line.append(el('span', 'footer-icon', '\uD83D\uDCCD'), document.createTextNode(addr)); col.appendChild(line); }
      col.style.display = col.querySelector('a, .footer-line') ? '' : 'none';
    }
  }
}
