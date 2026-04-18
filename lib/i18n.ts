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
    welcome:     t('Welcome to BaseAmp', "BaseAmp'a Ho\u015f Geldin"),
    welcomeSub:  t('Connect your wallet to start.', "Ba\u015flamak i\u00e7in c\xfczdan\u0131n\u0131 ba\u011fla."),

    // Airdrop Guide — full content
    guideTitle: t('Airdrop Guide', 'Airdrop Rehberi'),

    // Theory block — why you are here
    guideWhy: t(
      'Base is not just a blockchain — it is an ecosystem. Airdrops on Base reward wallets that show real, consistent usage over time. Not bots. Not spam. Real people using real apps.',
      "Base sadece bir blockchain de\u011fil, bir ekosistem. Base'teki airdrop'lar ger\u00e7ek ve d\u00fczzenli kullan\u0131m g\xf6steren c\xfczdanlar\u0131 ödl\xfcllendirir. Bot de\u011fil, spam de\u011fil. Ger\u00e7ek insanlar, ger\u00e7ek kullan\u0131m."
    ),
    guidePrinciple1: t(
      'Activity spread over many days is worth more than 100 transactions in one day.',
      'Pek çok g\xfcne yay\u0131lan aktivite, tek g\xfcnde 100 i\u015flem yapmaktan daha de\u011ferlidir.'
    ),
    guidePrinciple2: t(
      'You need both onchain presence (transactions, contracts, DeFi) and social presence (Farcaster, Base Name, Guild).',
      'Hem onchain varl\u0131k (i\u015flemler, kontratlar, DeFi) hem de sosyal varl\u0131k (Farcaster, Base Name, Guild) gereklidir.'
    ),
    guidePrinciple3: t(
      'Variety matters. Using different apps across different days looks like a real user.',
      'Farkl\u0131l\u0131k önemlidir. Farkl\u0131 g\xfcnlerde farkl\u0131 uygulamalar kullanmak ger\u00e7ek kullan\u0131c\u0131 gibi g\xf6r\xfcnd\xfcr\xfcr.'
    ),
    guideCta: t(
      'Follow the steps below to build your activity ↓',
      'Aktiviteni olu\u015fturmak i\u00e7in a\u015fa\u011f\u0131daki ad\u0131mlar\u0131 takip et ↓'
    ),

    // Bridge between guide and steps
    stepsIntro: t(
      'These 5 steps are your core activity loop. Do them regularly, not all at once.',
      'Bu 5 ad\u0131m temel aktivite d\xf6ng\xfcn\xfcd\xfcr. Hepsini ayn\u0131 anda de\u011fil, d\xfczzenli olarak yap.'
    ),

    // External actions block
    guideExternalTitle: t(
      'To maximize your airdrop potential, you also need:',
      'Airdrop potansiyelini en \xfcst d\xfczeye \u00e7\u0131karmak i\u00e7in ayr\u0131ca:'
    ),
    guideExternal: [
      { en: 'Install BaseApp — connect your wallet to the official Base app', tr: "BaseApp kur \u2014 resmi Base uygulamas\u0131na c\xfczdan\u0131n\u0131 ba\u011fla", url: 'https://base.org/app' },
      { en: "Join Guild — connect ALL your wallets and social accounts", tr: "Guild'e kat\u0131l \u2014 t\xfcm c\xfczdanlar\u0131n\u0131 ve hesaplar\u0131n\u0131 ba\u011fla", url: 'https://guild.xyz/base' },
      { en: 'Use Farcaster — post, interact, build social presence', tr: 'Farcaster kullan \u2014 payla\u015f, etkile\u015f, sosyal varl\u0131k olu\u015ftur', url: 'https://farcaster.xyz' },
      { en: 'Get a Base Name — your identity on Base', tr: "Base Name al \u2014 Base'teki kimli\u011fin", url: 'https://www.base.org/names' },
    ],
    guideNote: t(
      'These actions happen outside BaseAmp but are critical airdrop signals.',
      'Bu ad\u0131mlar BaseAmp d\u0131\u015f\u0131nda yap\u0131l\u0131r, ancak kritik airdrop sinyalleridir.'
    ),

    // Step flow
    steps: [
      { n: '1', en_title: 'Send GM',       tr_title: 'GM Gönder',    en_sub: 'Daily transaction — do this every day',           tr_sub: 'Günlük işlem \u2014 her g\xfcn yap',                   href: '/gm',     doneKey: 'gm' },
      { n: '2', en_title: 'Swap / Bridge', tr_title: 'Swap / Bridge',     en_sub: 'Use DEXs and bridge assets across different days', tr_sub: 'DEX kullan ve varl\u0131klar\u0131 farkl\u0131 g\xfcnlerde köprüle',  href: '/swap',   doneKey: 'swap' },
      { n: '3', en_title: 'Earn',          tr_title: 'Kazan',             en_sub: 'Deposit into DeFi — show capital interaction',    tr_sub: "DeFi'ye yat\u0131r \u2014 sermaye kullan\u0131m\u0131 g\xf6ster",     href: '/earn',   doneKey: 'earn' },
      { n: '4', en_title: 'Deploy',        tr_title: 'Deploy',            en_sub: 'Create a contract — deepest on-chain signal',     tr_sub: 'Kontrat olu\u015ftur \u2014 en derin onchain sinyal',              href: '/deploy', doneKey: 'deploy' },
      { n: '5', en_title: 'Invite',        tr_title: 'Davet Et',          en_sub: 'Grow your network, earn 10% commission',          tr_sub: 'A\u011f\u0131n\u0131 b\xfcy\xfct, %10 komisyon kazan',           href: '#referral',doneKey: 'invite' },
    ],

    // Analytics section
    analyticsTitle:  t('Your Activity', 'Aktiviten'),
    totalTx:         t('Total TX', 'Toplam TX'),
    activeDays:      t('Active Days', 'Aktif Gün'),
    lastActivity:    t('Last Activity', 'Son Aktivite'),
    currentStreak:   t('Current Streak', 'Mevcut Seri'),
    uniqueContracts: t('Unique Contracts', 'Benzersiz Kontrat'),
    gasUsed:         t('Gas (ETH)', 'Gas (ETH)'),
    walletAge:       t('Wallet Age', 'Cüzdan Yaşı'),
    builderScore:    t('Builder Score', 'Builder Puanı'),
    gmScore:         t('GM Score', 'GM Puanı'),

    // Referral section
    referralTitle:   t('Referral', 'Referral'),
    referralCta:     t('Earn 10% from your referrals\' transaction fees.', 'Davet etti\u011fin kullan\u0131c\u0131lar\u0131n yapt\u0131\u011f\u0131 i\u015flemlerden %10 komisyon kazan\u0131rs\u0131n.'),
    totalReferrals:  t('Referrals', 'Referanslar'),
    earnedEth:       t('Earned (ETH)', 'Kazan\u0131lan (ETH)'),
    todayScore:      t('Today Score', 'Bugün Puan'),
    commission:      t('Commission', 'Komisyon'),
    noReferrals:     t('No referrals yet', 'Henüz referans yok'),
    noReferralsSub:  t('Share your link to start earning.', 'Kazanmaya ba\u015flamak i\u00e7in linkini payla\u015f.'),

    // Hero
    hero: t(
      'Spreading activity over time matters more than doing everything in one day.',
      'Aktiviteni zamana yaymak, hepsini tek günde yapmaktan daha de\u011ferlidir.'
    ),
  },
  gm: {
    connectSub:   t('Send daily GM and earn score', 'Günlük GM gönder ve puan kazan'),
    pageInfo:     t(
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
    hintAgain:     t("You're active today \u2014 keep going (+1 per GM)", 'Bugün aktifsin \u2014 devam et (+1 her GM\'de)'),
    totalGms:      t('Total GMs', 'Toplam GM'),
    yourRank:      t('Your Rank', 'Sıran'),
    resetsIn:      t('Resets in', 'Sıfırlanıyor'),
    leaderboard:   t('Leaderboard', 'Liderlik Tablosu'),
    youRank:       t('You (#', 'Sen (#'),
    noScores:      t('No scores yet \u2014 be first!', 'Henüz puan yok \u2014 ilk sen ol!'),
    recentGMs:     t('Recent GMs', 'Son GM\'ler'),
    milestones:    t('Milestones', 'Kilometre Taşları'),
    bonusLabel:    t('bonus', 'bonus'),
    gmSent:        t('GM sent', 'GM gönderildi'),
    milestone:     t('milestone!', 'kilometre taşı!'),
    dailyStreak:   t('day streak', 'günlük seri'),
  },
  earn: {
    connectSub: t('Deposit into vaults to earn yield', 'Getiri kazanmak için vault\'lara yatır'),
    pageInfo:   t(
      "Idle tokens can work for you here. Starting small and staying consistent shows real usage.",
      "Boş duran token'ları burada değerlendirebilirsin. Küçük başlayıp devam etmek gerçek kullanım gösterir."
    ),
    bestApy:  t('Best APY', 'En İyi APY'),
    totalTvl: t('Total TVL', 'Toplam TVL'),
    all:      t('All', 'Tümü'),
    openVault:t('Open vault \u2197', 'Vault\'u aç \u2197'),
    tvl:      t('TVL', 'TVL'),
    apy:      t('APY', 'APY'),
  },
  swap: {
    connectSub:     t('Swap tokens on Base', "Base'te token takas et"),
    pageInfo:       t(
      "Swapping tokens is active network usage. Trying different platforms creates a stronger signal.",
      "Token takası yaparak ağı aktif kullanırsın. Farklı platformları denemek güçlü kullanım sinyali oluşturur."
    ),
    bannerTitle:    t('Best Base DEXs & Aggregators', "En İyi Base DEX'ler"),
    bannerSub:      t("Click any platform to trade on Base. External swaps don't carry builder code.", "Base'te işlem yapmak için platforma tıkla. Dış swap'lar builder code taşımaz."),
    aggregators:    t('Aggregators', 'Toplayıcılar'),
    aggregatorDesc: t('Find best price across DEXs', 'En iyi fiyatı otomatik bulur'),
    dex:            t('DEX', 'DEX'),
    dexDesc:        t('Direct pool trading', 'Likidite havuzlarında işlem'),
    stable:         t('Stablecoin', 'Stablecoin'),
    stableDesc:     t('Optimized stable swaps', 'Stablecoin takası için optimize'),
    platforms:      t('platforms', 'platform'),
  },
  deploy: {
    connectSub:   t('Deploy contracts on Base mainnet', 'Base mainnet\'e kontrat deploy et'),
    pageInfo:     t(
      "Even a simple contract deploy counts as real on-chain usage.",
      "Basit bir kontrat deploy etmek bile ağ üzerinde gerçek kullanım olarak görülür."
    ),
    contractType: t('Contract Type', 'Kontrat Tipi'),
    parameters:   t('Parameters', 'Parametreler'),
    noParams:     t('No parameters needed \u2014 ready to deploy.', 'Parametre gerekmez \u2014 deploy\'a hazır.'),
    network:      t('Network: Base Mainnet', 'Ağ: Base Mainnet'),
    builderCode:  t('Builder Code:', 'Builder Kodu:'),
    refDiscount:  t('Referral discount applied', 'Referral indirimi uygulandı'),
    preparing:    t('Preparing deployment...', 'Deploy hazırlanıyor...'),
    deploying:    t('Deploying to Base...', "Base'e deploy ediliyor..."),
    deployBtn:    (name: string) => ({ en: `Deploy ${name}`, tr: `${name} Deploy Et` }),
    preparingBtn: t('Preparing...', 'Hazırlanıyor...'),
    deployingBtn: t('Deploying...', 'Deploy ediliyor...'),
    success:      t('deployed successfully', 'başarıyla deploy edildi'),
    connectSub2:  t('Deploy contracts on Base mainnet', 'Base mainnet\'e kontrat deploy et'),
  },
}

export function tx(obj: { en: string; tr: string }, lang: Lang): string {
  return obj[lang] ?? obj.en
}
