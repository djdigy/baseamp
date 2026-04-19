/**
 * BaseApp / Coinbase Wallet in-app browser detection
 * Used to enable frictionless 1-tap UX when running inside BaseApp
 */

export function isBaseAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  const eth = (window as unknown as { ethereum?: { isCoinbaseBrowser?: boolean; isCoinbaseWallet?: boolean } }).ethereum
  return (
    ua.includes('CoinbaseBrowser') ||
    ua.includes('CoinbaseWallet') ||
    eth?.isCoinbaseBrowser === true ||
    eth?.isCoinbaseWallet === true
  )
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 640
}
