export function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}
