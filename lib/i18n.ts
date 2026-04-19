export type Lang = 'en' | 'tr'
function t(en: string, tr: string) { return { en, tr } }

export const TEXT = {
  common: {
    connectWallet: t('Connect your wallet', 'Cüzdanını bağla'),
    loading:       t('Loading...', 'Yükleniyor...'),
    copied:        t('Copied!', 'Kopyalandı!'),
    copyLink:      t('Copy Link', 'Linki Kopyala'),
    share:         t('Share', 'Paylaş'),
    basescan:      t('Basescan ↗', 'Basescan ↗'),
    since:         t('since', 'tarihinden beri'),
    onBase:        t('on Base', "Base'de"),
    dayStreak:     t('day streak', 'günlük seri'),
    days:          t('days', 'gün'),
  },
  dashboard: {
    welcome:    t('Welcome to BaseAmp', "BaseAmp'a Hoş Geldin"),
    welcomeSub: t('Connect your wallet to start.', 'Başlamak için cüzdanını bağla.'),

    guideTitle: t('Airdrop Guide', 'Airdrop Rehberi'),

    guideWhy: t(
      'Base rewards real users — not bots, not one-day spammers. What matters is consistent activity spread across many days, using different apps.',
      "Base gerçek kullanıcıları ödüllendiriyor — botları ve tek günde işlem yapanları değil. Önemli olan: farklı uygulamalar kullanarak pek çok güne yayılmış düzenli aktivite."
    ),
    guidePrinciple1: t(
      'Doing 100 transactions in one day signals a bot, not a user. One transaction per day, every day, is worth far more.',
      'Tek günde 100 işlem yapmak bot sinyali verir. Her gün 1 işlem yapmak çok daha değerlidir.'
    ),
    guidePrinciple2: t(
      'You need both onchain activity (transactions, DeFi, contracts) and social presence (Farcaster, Base Name, Guild).',
      'Hem onchain aktivite (işlemler, DeFi, kontratlar) hem de sosyal varlık (Farcaster, Base Name, Guild) gereklidir.'
    ),
    guidePrinciple3: t(
      'This dashboard exists to help you build that activity footprint — consistently, over time.',
      'Bu dashboard tam da bunu yapmana yardımcı olmak için var — düzenli ve zamanla.'
    ),
    guideCta: t(
      'Start with Step 1 and move forward over time ↓',
      'Adım 1 ile başla ve zamanla ilerle ↓'
    ),

    guideExternalTitle: t(
      'To fully qualify, you ALSO need:',
      'Tam anlamıyla nitelendirilebilmek için AYRICA:'
    ),
    guideExternal: [
      { en: 'Install BaseApp — connect your wallet to the official Base app', tr: 'BaseApp kur — resmi Base uygulamasına cüzdanını bağla', url: 'https://base.app/invite/cihan0xeth/XFFDZL1D' },
      { en: 'Join Guild — connect ALL your wallets and social accounts', tr: "Guild'e katıl — tüm cüzdan ve hesaplarını bağla (kritik)", url: 'https://guild.xyz/base' },
      { en: 'Use Farcaster — post, interact, build social presence', tr: 'Farcaster kullan — paylaş, etkileş, sosyal varlık oluştur', url: 'https://farcaster.xyz/~/code/7BSPLN' },
      { en: 'Get a Base Name — your permanent identity on Base', tr: "Base Name al — Base'teki kalıcı kimliğin", url: 'https://www.base.org/names' },
    ],
    guideWarning: t(
      'If you skip these, your activity may not be recognized.',
      'Bunları atlarsan, aktiviten tanınmayabilir.'
    ),

    stepsIntro: t(
      'These 5 steps are your core activity loop. Do them consistently over time — not all at once.',
      'Bu 5 adım temel aktivite döngündür. Hepsini aynı anda değil — zamanla ve düzenli olarak yap.'
    ),
    steps: [
      { n: '1', href: '/gm',      doneKey: 'gm',
        en_title: 'GM',            tr_title: 'GM',
        en_sub: 'Daily onchain signal — consistency matters more than volume',
        tr_sub: 'Günlük onchain sinyal — hız değil, süreklilik önemli',
        en_cta: 'Click to send your daily GM →', tr_cta: 'Günlük GM göndermek için tıkla →',
      },
      { n: '2', href: '/swap',    doneKey: 'swap',
        en_title: 'Swap / Bridge', tr_title: 'Swap / Bridge',
        en_sub: 'Use DEXs and bridge assets across different days',
        tr_sub: 'Farklı günlerde DEX ve köprü kullan',
        en_cta: 'Click to use DEXs and bridge →', tr_cta: 'DEX ve köprü için tıkla →',
      },
      { n: '3', href: '/earn',    doneKey: 'earn',
        en_title: 'Earn',          tr_title: 'Kazan',
        en_sub: 'Use DeFi protocols to show capital usage',
        tr_sub: "DeFi'ye yatır — sermaye etkileşimi göster",
        en_cta: 'Click to use DeFi →', tr_cta: "DeFi için tıkla →",
      },
      { n: '4', href: '/deploy',  doneKey: 'deploy',
        en_title: 'Deploy',        tr_title: 'Deploy',
        en_sub: 'Deploy contracts — strongest onchain signal',
        tr_sub: 'Kontrat deploy et — en güçlü onchain sinyal',
        en_cta: 'Click to deploy a contract →', tr_cta: 'Kontrat deploy etmek için tıkla →',
      },
      { n: '5', href: '#referral', doneKey: 'invite',
        en_title: 'Refer',         tr_title: 'Davet',
        en_sub: 'Grow your network and earn from their activity',
        tr_sub: 'Ağını büyüt ve aktivitelerinden kazan',
        en_cta: 'Click to invite friends →', tr_cta: 'Arkadaşlarını davet et →',
      },
    ],

    analyticsTitle:  t('Your Activity', 'Aktiviten'),
    totalTx:         t('Activity Volume', 'Aktivite Hacmi'),
    activeDays:      t('Consistency Signal', 'Süreklilik Sinyali'),
    lastActivity:    t('Last Activity', 'Son Aktivite'),
    currentStreak:   t('Current Streak', 'Mevcut Seri'),
    uniqueContracts: t('Protocol Diversity', 'Protokol Çeşitliliği'),
    gasUsed:         t('Network Usage (ETH)', 'Ağ Kullanımı (ETH)'),
    walletAge:       t('Wallet Age', 'Cüzdan Yaşı'),
    builderScore:    t('Builder Score', 'Builder Puanı'),
    gmScore:         t('GM Score', 'GM Puanı'),

    referralTitle:   t('Referral', 'Referral'),
    referralCta:     t('Grow your network and earn 10% from their activity.', "Ağını büyüt ve referanslarının aktivitesinden %10 kazan."),
    totalReferrals:  t('Referrals', 'Referanslar'),
    earnedEth:       t('Earned (ETH)', 'Kazanılan (ETH)'),
    todayScore:      t('Today Score', 'Bugün Puan'),
    commission:      t('Commission', 'Komisyon'),
    noReferrals:     t('No referrals yet', 'Henüz referans yok'),
    noReferralsSub:  t('Share your link to start earning.', 'Kazanmaya başlamak için linkini paylaş.'),
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
    sendBtn:       t('Send GM — earn +5 score', 'GM Gönder — +5 puan kazan'),
    sendAgainBtn:  t('Send another GM (+1 score)', 'Tekrar GM Gönder (+1 puan)'),
    sendingBtn:    t('Sending...', 'Gönderiliyor...'),
    urgentBtn:     t('Send GM now — streak at risk!', 'Hemen GM Gönder — serin tehlikede!'),
    hintFirst:     t('Unlimited GM — only your first counts for streak', 'Sınırsız GM — sadece ilki seri için sayılır'),
    hintAgain:     t("You're active today — keep going (+1 per GM)", "Bugün aktifsin — devam et (+1 her GM'de)"),
    totalGms:      t('Total GMs', 'Toplam GM'),
    yourRank:      t('Your Rank', 'Sıran'),
    resetsIn:      t('Resets in', 'Sıfırlanıyor'),
    leaderboard:   t('Leaderboard', 'Liderlik Tablosu'),
    youRank:       t('You (#', 'Sen (#'),
    noScores:      t('No scores yet — be first!', 'Henüz puan yok — ilk sen ol!'),
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
      'Using DeFi protocols signals real capital activity onchain. Start small and stay consistent — that pattern matters more than the amount.',
      "DeFi protokolleri kullanmak onchain sermaye aktivitesi sinyali verir. Küçük başla ve düzenli kal — bu düzen miktardan önemlidir."
    ),
    bestApy:   t('Best APY', 'En İyi APY'),
    totalTvl:  t('Total TVL', 'Toplam TVL'),
    all:       t('All', 'Tümü'),
    openVault: t('Open vault ↗', "Vault'u aç ↗"),
    tvl:       t('TVL', 'TVL'),
    apy:       t('APY', 'APY'),
  },

  swap: {
    connectSub:     t('Swap tokens on Base', "Base'te token takas et"),
    pageInfo:       t(
      'Using multiple platforms increases your activity diversity — a key signal for real usage. Spread your swaps across different days and different DEXs.',
      'Birden fazla platform kullanmak aktivite çeşitliliğini artırır — gerçek kullanımın temel sinyali. Swaplarını farklı günlere ve farklı DEXlere yay.'
    ),
    bannerTitle:    t('Best Base DEXs & Aggregators', "En İyi Base DEX'ler"),
    bannerSub:      t('Click any platform to trade on Base.', "Base'te işlem yapmak için platforma tıkla."),
    aggregators:    t('Aggregators', 'Toplayıcılar'),
    aggregatorDesc: t('Find best price across DEXs', 'En iyi fiyatı otomatik bulur'),
    dex:            t('DEX', 'DEX'),
    dexDesc:        t('Direct pool trading', 'Likidite havuzlarında işlem'),
    stable:         t('Stablecoin', 'Stablecoin'),
    stableDesc:     t('Optimized stable swaps', 'Stablecoin takası için optimize'),
    platforms:      t('platforms', 'platform'),
  },

  deploy: {
    connectSub:   t('Deploy contracts on Base mainnet', "Base mainnet'e kontrat deploy et"),
    pageInfo:     t(
      'Even a simple contract deploy counts as real on-chain usage.',
      'Basit bir kontrat deploy etmek bile ağ üzerinde gerçek kullanım olarak görülür.'
    ),
    contractType: t('Contract Type', 'Kontrat Tipi'),
    parameters:   t('Parameters', 'Parametreler'),
    noParams:     t('No parameters needed — ready to deploy.', "Parametre gerekmez — deploy'a hazır."),
    network:      t('Network: Base Mainnet', 'Ağ: Base Mainnet'),
    builderCode:  t('Builder Code:', 'Builder Kodu:'),
    builderAttribution: t('Builder attribution active', 'Builder attribution aktif'),
    refDiscount:  t('Referral discount applied', 'Referral indirimi uygulandı'),
    preparing:    t('Preparing deployment...', 'Deploy hazırlanıyor...'),
    deploying:    t('Deploying to Base...', "Base'e deploy ediliyor..."),
    deployBtn:    (name: string) => ({ en: `Deploy ${name}`, tr: `${name} Deploy Et` }),
    preparingBtn: t('Preparing...', 'Hazırlanıyor...'),
    deployingBtn: t('Deploying...', 'Deploy ediliyor...'),
    success:      t('deployed successfully', 'başarıyla deploy edildi'),
    viewOnBasescan: t('View on Basescan →', "Basescan'da Gör →"),
  },
}

export function tx(obj: { en: string; tr: string }, lang: Lang): string {
  return obj[lang] ?? obj.en
}
