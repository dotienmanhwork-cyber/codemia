// src/shared/utils/format.js

/**
 * Format a number as compact VNĐ.
 * Examples: 1_500_000 → "1.5M ₫" | 2_400_000_000 → "2.4B ₫"
 */
export function formatVND(amount) {
  if (!amount && amount !== 0) return '—'
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B ₫`
  if (amount >= 1_000_000)     return `${(amount / 1_000_000).toFixed(1)}M ₫`
  if (amount >= 1_000)         return `${(amount / 1_000).toFixed(1)}K ₫`
  return `${amount.toLocaleString('vi-VN')} ₫`
}