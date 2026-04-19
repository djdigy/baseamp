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

    guideTitle: t('Airdrop Rehberi', 'Airdrop Rehberi'),

    guideWhy: t(
      'Base is a Layer-2 network built by Coinbase and is growing its ecosystem. There is no officially confirmed token yet, but the possibility of an airdrop rewarding early users is strong.\n\nWhat matters is not doing many transactions at once — it is looking like a real user who regularly uses the network.\n\nUse different apps on different days, be socially and onchain active. BaseAmp helps you track this process and stay consistent.',
      "Base, Coinbase tarafından geliştirilen bir Layer-2 ağıdır ve kendi ekosistemini büyütmeye devam ediyor.\nHenüz resmi olarak doğrulanmış bir token yok, ancak erken kullanıcıların ödüllendirileceği bir airdrop ihtimali güçlü.\n\nBu yüzden önemli olan tek seferlik işlem yapmak değil, ağı düzenli kullanan gerçek kullanıcı gibi görünmek.\n\nFarklı günlerde farklı uygulamaları kullan, sosyal ve onchain aktif ol. BaseAmp bu süreci takip etmeni ve düzenli kalmanı sağlar."
    ),

    guidePrinciple1: t(
      'Spread activity over time — not all at once',
      'Tek seferde çok işlem değil → zamana yay'
    ),
    guidePrinciple2: t(
      'Onchain + social activity together',
      'Onchain + sosyal birlikte olmalı'
    ),
    guidePrinciple3: t(
      'Consistency is the strongest signal',
      'Süreklilik en güçlü sinyal'
    ),

    guideCta: t('See detailed guide', 'Detaylı rehberi gör'),

    guideDetailTitle: t('Detailed Activity Guide', 'Detaylı Aktivite Rehberi'),
    guideDetailItems: [
      t('GM → daily transaction, the simplest streak signal', 'GM → günlük işlem, en basit seri sinyali'),
      t('Swap / Bridge → shows network usage across different days', 'Swap / Bridge → farklı günlerde ağ kullanımını gösterir'),
      t('DeFi → capital interaction, not just transfers', 'DeFi → sermaye etkileşimi, sadece transfer değil'),
      t('Deploy → strongest onchain signal, shows builder behavior', 'Deploy → en güçlü onchain sinyal, builder davranışı gösterir'),
      t('BaseApp / Guild / Farcaster / Base Name → social + identity layer', 'BaseApp / Guild / Farcaster / Base Name → sosyal + kimlik katmanı'),
      t('Timing → small but consistent, not bursts', 'Zamanlama → küçük ama sürekli, ani yığınlar değil'),
    ],

    boostTitle: t('Strengthen your profile (recommended)', 'Aktiviteni güçlendirmek için (önerilir)'),
    boostDesc:  t(
      'These steps make your profile stronger and create a clearer user signal.',
      'Bu adımlar profilini daha güçlü hale getirir ve daha net kullanıcı sinyali oluşturur.'
    ),
    boostNote: t(
      'Completing these makes your profile more visible.',
      'Bunları tamamlamak profilini daha görünür hale getirir.'
    ),
    boostItems: [
      { en: 'Install BaseApp → enter the ecosystem', tr: 'BaseApp kur → ekosisteme giriş', url: 'https://base.app/invite/cihan0xeth/XFFDZL1D' },
      { en: "Join Guild → connect ALL your accounts (very important)", tr: "Guild'e katıl → tüm hesaplarını bağla (çok önemli)", url: 'https://guild.xyz/base' },
      { en: 'Use Farcaster → build social presence', tr: 'Farcaster kullan → sosyal aktivite oluştur', url: 'https://farcaster.xyz/~/code/7BSPLN' },
      { en: 'Get a Base Name → create your identity', tr: 'Base Name al → kimliğini oluştur', url: 'https://www.base.org/names' },
    ],

    stepsIntro: t(
      'These 5 steps are your core activity loop. Do them consistently over time — not all at once.',
      'Bu 5 adım temel aktivite döngündür. Hepsini aynı anda değil — zamanla ve düzenli olarak yap.'
    ),
    steps: [
      { n: '1', href: '/gm',     doneKey: 'gm',
        en_title: 'GM',            tr_title: 'GM',
        en_sub: 'Send a daily TX — consistency beats volume',
        tr_sub: 'Her gün küçük bir işlem yap → süreklilik en güçlü sinyaldir',
        en_cta: 'Send daily GM →', tr_cta: 'Günlük GM gönder →',
      },
      { n: '2', href: '/swap',   doneKey: 'swap',
        en_title: 'Swap / Bridge', tr_title: 'Swap / Bridge',
        en_sub: 'Use on different days — usage matters, not one burst',
        tr_sub: 'Farklı günlerde işlem yap → tek sefer değil, kullanım önemli',
        en_cta: 'DEX and bridge →', tr_cta: 'DEX ve köprü için tıkla →',
      },
      { n: '3', href: '/earn',   doneKey: 'earn',
        en_title: 'Earn',          tr_title: 'Kazan',
        en_sub: 'Use DeFi — show capital interaction, not just transfers',
        tr_sub: 'DeFi kullan → sadece işlem değil, sermaye etkileşimi göster',
        en_cta: 'DeFi →', tr_cta: 'DeFi için tıkla →',
      },
      { n: '4', href: '/deploy', doneKey: 'deploy',
        en_title: 'Deploy',        tr_title: 'Deploy',
        en_sub: 'Deploy a contract — strongest onchain signal',
        tr_sub: 'Kontrat deploy et → en güçlü onchain sinyal',
        en_cta: 'Deploy contract →', tr_cta: 'Kontrat deploy et →',
      },
      { n: '5', href: '/gm',     doneKey: 'gm',
        en_title: 'Stay Active',   tr_title: 'Aktif Kal',
        en_sub: 'Keep your streak — do a transaction every day',
        tr_sub: "Her gün işlem yap → streak'ini koru ve görünürlüğünü artır",
        en_cta: "Do today's action →", tr_cta: 'Bugünkü işlemini yap →',
      },
    ],

    analyticsTitle:  t('Your Activity', 'Aktiviten'),
    streakWarningMsg: t('Send GM today or your streak resets', 'Bugün işlem yapmazsan serin sıfırlanır'),
    totalTx:         t('Activity Volume', 'Aktivite Hacmi'),
    activeDays:      t('Consistency Signal', 'Süreklilik Sinyali'),
    lastActivity:    t('Last Activity', 'Son Aktivite'),
    currentStreak:   t('Current Streak', 'Mevcut Seri'),
    uniqueContracts: t('Protocol Diversity', 'Protokol Çeşitliliği'),
    gasUsed:         t('Network Usage (ETH)', 'Ağ Kullanımı (ETH)'),
    walletAge:       t('Wallet Age', 'Cüzdan Yaşı'),
    builderScore:    t('Builder Score', 'Builder Puanı'),
    gmScore:         t('GM Score', 'GM Puanı'),
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
