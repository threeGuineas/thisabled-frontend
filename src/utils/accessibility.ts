import type { ModeSettings } from '../services/users'

const DEFAULT_FONT_SIZE_PX = 16
const MIN_FONT_SCALE = 0.9
const MAX_FONT_SCALE = 1.25

export function applyAccessibilitySettings(settings: ModeSettings = {}): void {
  const requestedScale = settings.font_scale ?? 1
  const fontScale = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, requestedScale))

  document.documentElement.style.fontSize = `${DEFAULT_FONT_SIZE_PX * fontScale}px`
  document.documentElement.dataset.highContrast = settings.high_contrast ? 'true' : 'false'
}
