/**
 * Utility functions for price formatting and calculations
 * Solves floating point precision issues in JavaScript
 */

/**
 * Format price to 2 decimal places and handle floating point precision
 * @param {number} price - The price to format
 * @returns {number} - Properly rounded price
 */
export function formatPrice(price) {
  if (!price || isNaN(price)) return 0
  return Math.round(parseFloat(price) * 100) / 100
}

/**
 * Format price for display with currency symbol
 * @param {number} price - The price to format
 * @returns {string} - Formatted price string with ₹ symbol
 */
export function formatPriceDisplay(price) {
  const formattedPrice = formatPrice(price)
  return `₹${formattedPrice.toFixed(2)}`
}

/**
 * Calculate percentage discount with proper rounding
 * @param {number} amount - Original amount
 * @param {number} percentage - Discount percentage (0-100)
 * @returns {number} - Discount amount
 */
export function calculatePercentageDiscount(amount, percentage) {
  if (!amount || !percentage || isNaN(amount) || isNaN(percentage)) return 0
  const discount = (parseFloat(amount) * parseFloat(percentage)) / 100
  return formatPrice(discount)
}

/**
 * Calculate final amount after discount
 * @param {number} originalAmount - Original amount
 * @param {number} discountAmount - Discount amount
 * @returns {number} - Final amount after discount
 */
export function calculateFinalAmount(originalAmount, discountAmount) {
  const original = parseFloat(originalAmount) || 0
  const discount = parseFloat(discountAmount) || 0
  return formatPrice(original - discount)
}

/**
 * Safe addition of prices (handles floating point precision)
 * @param {...number} prices - Prices to add
 * @returns {number} - Sum of prices
 */
export function addPrices(...prices) {
  const sum = prices.reduce((total, price) => {
    return total + (parseFloat(price) || 0)
  }, 0)
  return formatPrice(sum)
}

/**
 * Safe subtraction of prices (handles floating point precision)
 * @param {number} amount1 - Amount to subtract from
 * @param {number} amount2 - Amount to subtract
 * @returns {number} - Difference
 */
export function subtractPrices(amount1, amount2) {
  const a1 = parseFloat(amount1) || 0
  const a2 = parseFloat(amount2) || 0
  return formatPrice(a1 - a2)
}
