/**
 * Format a number as Indian Rupee (₹) with proper separators.
 * Example: 842500 -> ₹8,42,500
 */
export const formatCurrency = (amount: number): string => {
  // Convert to integer if needed
  const rounded = Math.round(amount);
  // Format with Indian numbering system (lakhs, crores)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);
};