export type Lang = 'en' | 'tr'
function t(en: string, tr: string) { return { en, tr } }

export const TEXT = {
  common: {
    connectWallet:  t('Connect your wallet', 'Cüzdanını bağla'),
    loading:        t('Loading...', 'Yükleniyor...'),
    copied:         t('Copied!', 'Kopyalandı!'),
    copyLink:       t('Copy Link', 'Linki Kopyala'),
    share:          t('Share', 'Paylaş'),
    basescan:       t('Basescan \u2197', 'Basescan \u2197'),
    since:          t('since', 'tarihinden beri'),
    onBase:         t('on Base', "Base'de"),
    dayStreak:      t('day streak', 'günlük seri'),
    days:           t('days', 'gün'),
  },
  dashboard: {
    welcome:    t('Welcome to BaseAmp', "BaseAmp'a Ho\u015f Geldin"),
    welcomeSub: t('Connect your wallet to start.', "Ba\u015flamak i\u00e7in c\u00fczdan\u0131n\u0131 ba\u011fla."),

    // ── Airdrop Guide ─────────────────────────────────────────────────────
    guideTitle: t('Airdrop Guide', 'Airdrop Rehberi'),

    guideWhy: t(
      'Base rewards real users — not bots, not one-day spammers. What matters is consistent activity spread across many days, using different apps.',
      "Base ger\u00e7ek kullan\u0131c\u0131lar\u0131 \u00f6d\u00fcllendiriyor \u2014 bot'lar\u0131 ve tek g\u00fcnde i\u015flem yapanlar\u0131 de\u011fil. \u00d6nemli olan: farkl\u0131 uygulamalar kullanarak pek \u00e7ok g\u00fcne yay\u0131lm\u0131\u015f d\u00fczzenli aktivite."
    ),
    guidePrinciple1: t(
      'Doing 100 transactions in one day signals a bot, not a user. One transaction per day, every day, is worth far more.',
      'Tek g\u00fcnde 100 i\u015flem yapmak bot sinyali verir. Her g\u00fcn 1 i\u015flem yapmak \u00e7ok daha de\u011ferlidir.'
    ),
    guidePrinciple2: t(
      'You need both onchain activity (transactions, DeFi, contracts) and social presence (Farcaster, Base Name, Guild).',
      'Hem onchain aktivite (i\u015flemler, DeFi, kontratlar) hem de sosyal varl\u0131k (Farcaster, Base Name, Guild) gereklidir.'
    ),
    guidePrinciple3: t(
      'This dashboard exists to help you build that activity footprint — consistently, over time.',
      'Bu dashboard tam da bunu yapmana yard\u0131mc\u0131 olmak i\u00e7in var \u2014 d\u00fczzenli ve zamanla.'
    ),
    guideCta: t(
      'Follow the steps below to build your onchain footprint \u2193',
      'Onchain iz b\u0131rakmak i\u00e7in a\u015fa\u011f\u0131daki ad\u0131mlar\u0131 takip et \u2193'
    ),

    // External actions — INSIDE the guide, core not secondary
    guideExternalTitle: t(
      'To fully qualify, you ALSO need:',
      'Tam anlam\u0131yla nitelendirilebilmek i\u00e7in AYRICA:'
    ),
    guideExternal: [
      {
        en: 'Install BaseApp \u2014 connect your wallet to the official Base app',
        tr: 'BaseApp kur \u2014 resmi Base uygulamas\u0131na c\u00fczdan\u0131n\u0131 ba\u011fla',
        url: 'https://base.org/app',
      },
      {
        en: 'Join Guild \u2014 connect ALL your wallets and social accounts (important)',
        tr: "Guild'e kat\u0131l \u2014 t\u00fcm c\u00fczdan ve hesaplar\u0131n\u0131 ba\u011fla (kritik)",
        url: 'https://guild.xyz/base',
      },
      {
        en: 'Use Farcaster \u2014 post, interact, build social presence on Base',
        tr: 'Farcaster kullan \u2014 payla\u015f, etkile\u015f, sosyal varl\u0131k olu\u015ftur',
        url: 'https://farcaster.xyz',
      },
      {
        en: 'Get a Base Name \u2014 your permanent identity on Base',
        tr: "Base Name al \u2014 Base'teki kal\u0131c\u0131 kimli\u011fin",
        url: 'https://www.base.org/names',
      },
    ],
    guideWarning: t(
      'If you skip these, your activity may not be recognized.',
      'Bunlar\u0131 atlarsan, aktiviten tan\u0131nmayabilir.'
    ),

    // ── Step flow ──────────────────────────────────────────────────────────
    stepsIntro: t(
      'These 5 steps are your core activity loop. Do them consistently over time \u2014 not all at once.',
      'Bu 5 ad\u0131m temel aktivite d\u00f6ng\u00fcn\u00fcd\u00fcr. Hepsini ayn\u0131 anda de\u011fil \u2014 zamanla ve d\u00fczzenli olarak yap.'
    ),
    steps: [
      {
        n: '1', href: '/gm', doneKey: 'gm',
        en_title: 'GM',
        tr_title: 'GM',
        en_sub: 'Daily onchain signal \u2014 consistency matters more than volume',
        tr_sub: 'G\u00fcnl\u00fck onchain sinyal \u2014 h\u0131z de\u011fil, s\u00fcreklilik \u00f6nemli',
      },
      {
        n: '2', href: '/swap', doneKey: 'swap',
        en_title: 'Swap / Bridge',
        tr_title: 'Swap / Bridge',
        en_sub: 'Use DEXs and bridge across different days to simulate real usage',
        tr_sub: 'Farkl\u0131 g\u00fcnlerde DEX ve k\u00f6pr\u00fc kullanarak ger\u00e7ek kullan\u0131m sim\u00fcle et',
      },
      {
        n: '3', href: '/earn', doneKey: 'earn',
        en_title: 'Earn',
        tr_title: 'Kazan',
        en_sub: 'Use DeFi protocols to show capital usage',
        tr_sub: 'DeFi protokolleri kullanarak sermaye etkile\u015fimi g\u00f6ster',
      },
      {
        n: '4', href: '/deploy', doneKey: 'deploy',
        en_title: 'Deploy',
        tr_title: 'Deploy',
        en_sub: 'Deploy contracts \u2014 strongest onchain signal',
        tr_sub: 'Kontrat deploy et \u2014 en g\u00fc\u00e7l\u00fc onchain sinyal',
      },
      {
        n: '5', href: '#referral', doneKey: 'invite',
        en_title: 'Refer',
        tr_title: 'Davet',
        en_sub: 'Grow your network and earn from their activity',
        tr_sub: 'A\u011f\u0131n\u0131 b\u00fcy\u00fct ve aktivitelerinden kazan',
      },
    ],

    // ── Analytics ──────────────────────────────────────────────────────────
    analyticsTitle:  t('Your Activity', 'Aktiviten'),
    totalTx:         t('Activity Volume', 'Aktivite Hacmi'),
    activeDays:      t('Consistency Signal', 'S\u00fcreklilik Sinyali'),
    lastActivity:    t('Last Activity', 'Son Aktivite'),
    currentStreak:   t('Current Streak', 'Mevcut Seri'),
    uniqueContracts: t('Protocol Diversity', 'Protokol \u00c7e\u015fitlili\u011fi'),
    gasUsed:         t('Network Usage (ETH)', 'A\u011f Kullan\u0131m\u0131 (ETH)'),
    walletAge:       t('Wallet Age', 'C\u00fczdan Ya\u015f\u0131'),
    builderScore:    t('Builder Score', 'Builder Puan\u0131'),
    gmScore:         t('GM Score', 'GM Puan\u0131'),

    // ── Referral ───────────────────────────────────────────────────────────
    referralTitle:   t('Referral', 'Referral'),
    referralCta:     t(
      'Grow your network and earn 10% from their activity.',
      "A\u011f\u0131n\u0131 b\u00fcy\u00fct ve referanslar\u0131n\u0131n aktivitesinden %10 kazan."
    ),
    totalReferrals:  t('Referrals', 'Referanslar'),
    earnedEth:       t('Earned (ETH)', 'Kazan\u0131lan (ETH)'),
    todayScore:      t('Today Score', 'Bug\u00fcn Puan'),
    commission:      t('Commission', 'Komisyon'),
    noReferrals:     t('No referrals yet', 'Hen\u00fcz referans yok'),
    noReferralsSub:  t('Share your link to start earning.', 'Kazanmaya ba\u015flamak i\u00e7in linkini payla\u015f.'),
  },

  gm: {
    connectSub:    t('Send daily GM and earn score', 'Günlük GM gönder ve puan kazan'),
    pageInfo:      t(
      'Sending GM looks simple but generates a real daily transaction. Consistent activity over time matters more than volume in one day.',
      'GM göndermek basit görünür ama her gün gerçek bir işlem (TX) yapmanı sağlar. Zamana yayılmış aktivite tek günde çok işlemden daha değerlidir.'
    ),
    streakLost:    t('Streak lost. Start again', 'Seri bozuldu. Yeniden başla'),
    streakLostSub: t('Send GM today to begin a new streak', 'Yeni bir seri başlatmak için bugün GM gönder'),
    streakWarning: t('Send GM today or lose your', 'Bugün GM gönder yoksa'),
    streakDays:    t('-day streak', ' günlük serin gider'),
    activeToday:   t("You're active today", 'Bugün aktifsin'),
    sendBtn:       t('Send GM \u2014 earn +5 score', 'GM Gönder \u2014 +5 puan kazan'),
    sendAgainBtn:  t('Send another GM (+1 score)', 'Tekrar GM Gönder (+1 puan)'),
    sendingBtn:    t('Sending...', 'Gönderiliyor...'),
    urgentBtn:     t('Send GM now \u2014 streak at risk!', 'Hemen GM Gönder \u2014 serin tehlikede!'),
    hintFirst:     t('Unlimited GM \u2014 only your first counts for streak', 'Sınırsız GM \u2014 sadece ilki seri için sayılır'),
    hintAgain:     t("You're active today \u2014 keep going (+1 per GM)", "Bugün aktifsin \u2014 devam et (+1 her GM'de)"),
    totalGms:      t('Total GMs', 'Toplam GM'),
    yourRank:      t('Your Rank', 'Sıran'),
    resetsIn:      t('Resets in', 'Sıfırlanıyor'),
    leaderboard:   t('Leaderboard', 'Liderlik Tablosu'),
    youRank:       t('You (#', 'Sen (#'),
    noScores:      t('No scores yet \u2014 be first!', 'Henüz puan yok \u2014 ilk sen ol!'),
    recentGMs:     t('Recent GMs', "Son GM'ler"),
    milestones:    t('Milestones', 'Kilometre Taşları'),
    bonusLabel:    t('bonus', 'bonus'),
    gmSent:        t('GM sent', 'GM gönderildi'),
    milestone:     t('milestone!', 'kilometre taşı!'),
    dailyStreak:   t('day streak', 'günlük seri'),
  },

  earn: {
    connectSub: t("Deposit into vaults to earn yield", "Getiri kazanmak için vault'lara yatır"),
    pageInfo:   t(
      'Using DeFi protocols signals real capital activity onchain. Start small and stay consistent \u2014 that pattern matters more than the amount.',
      "DeFi protokolleri kullanmak onchain sermaye aktivitesi sinyali verir. K\u00fc\u00e7\u00fck ba\u015fla ve d\u00fczzenli kal \u2014 bu d\u00fczen miktardan \u00f6nemlidir."
    ),
    bestApy:   t('Best APY', 'En İyi APY'),
    totalTvl:  t('Total TVL', 'Toplam TVL'),
    all:       t('All', 'Tümü'),
    openVault: t('Open vault \u2197', "Vault'u aç \u2197"),
    tvl:       t('TVL', 'TVL'),
    apy:       t('APY', 'APY'),
  },

  swap: {
    connectSub:     t('Swap tokens on Base', "Base'te token takas et"),
    pageInfo:       t(
      'Using multiple platforms increases your activity diversity \u2014 a key signal for real usage. Spread your swaps across different days and different DEXs.',
      'Birden fazla platform kullanmak aktivite \u00e7e\u015fitlili\u011fini art\u0131r\u0131r \u2014 ger\u00e7ek kullan\u0131m\u0131n temel sinyali. Swap\u2019lar\u0131n\u0131 farkl\u0131 g\u00fcnlere ve farkl\u0131 DEX\u2019lere yay.'
    ),
    bannerTitle:    t('Best Base DEXs & Aggregators', "En İyi Base DEX'ler"),
    bannerSub:      t(
      'Click any platform to trade on Base. External swaps do not carry builder code.',
      "Base'te i\u015flem yapmak i\u00e7in platforma t\u0131kla. D\u0131\u015f swap'lar builder code ta\u015f\u0131maz."
    ),
    aggregators:    t('Aggregators', 'Tolay\u0131c\u0131lar'),
    aggregatorDesc: t('Find best price across DEXs', 'En iyi fiyat\u0131 otomatik bulur'),
    dex:            t('DEX', 'DEX'),
    dexDesc:        t('Direct pool trading', 'Likidite havuzlar\u0131nda i\u015flem'),
    stable:         t('Stablecoin', 'Stablecoin'),
    stableDesc:     t('Optimized stable swaps', 'Stablecoin takas\u0131 i\u00e7in optimize'),
    platforms:      t('platforms', 'platform'),
  },

  deploy: {
    connectSub:   t('Deploy contracts on Base mainnet', "Base mainnet'e kontrat deploy et"),
    pageInfo:     t(
      'Even a simple contract deploy counts as real on-chain usage.',
      'Basit bir kontrat deploy etmek bile a\u011f \u00fczerinde ger\u00e7ek kullan\u0131m olarak g\u00f6r\u00fclur.'
    ),
    contractType: t('Contract Type', 'Kontrat Tipi'),
    parameters:   t('Parameters', 'Parametreler'),
    noParams:     t('No parameters needed \u2014 ready to deploy.', "Parametre gerekmez \u2014 deploy'a haz\u0131r."),
    network:      t('Network: Base Mainnet', 'A\u011f: Base Mainnet'),
    builderCode:  t('Builder Code:', 'Builder Kodu:'),
    refDiscount:  t('Referral discount applied', 'Referral indirimi uyguland\u0131'),
    preparing:    t('Preparing deployment...', 'Deploy haz\u0131rlan\u0131yor...'),
    deploying:    t('Deploying to Base...', "Base'e deploy ediliyor..."),
    deployBtn:    (name: string) => ({ en: `Deploy ${name}`, tr: `${name} Deploy Et` }),
    preparingBtn: t('Preparing...', 'Haz\u0131rlan\u0131yor...'),
    deployingBtn: t('Deploying...', 'Deploy ediliyor...'),
    success:      t('deployed successfully', 'ba\u015far\u0131yla deploy edildi'),
  },
}

export function tx(obj: { en: string; tr: string }, lang: Lang): string {
  return obj[lang] ?? obj.en
}
