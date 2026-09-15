/**
 * Joins class names, filtering out falsy values.
 * Usage: cn('base', condition && 'variant', className)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
