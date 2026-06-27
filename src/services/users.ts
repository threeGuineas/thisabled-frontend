import { authedRequest, IS_MOCK, type DisabilityType } from './auth'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface ModeSettings {
  font_scale?: number
  high_contrast?: boolean
  tts?: boolean
  keyboard_nav?: boolean
  captions?: boolean
  vibration?: boolean
  visual_alerts?: boolean
  simplified?: boolean
  large_icons?: boolean
  one_item_feed?: boolean
}

export interface ModeResponse {
  mode: DisabilityType
  settings: ModeSettings
  changed_at: string
}

const mockUsers = {
  async getMode(): Promise<ModeResponse> {
    await sleep(300)
    return { mode: 'visual', settings: { font_scale: 1.5, high_contrast: true, tts: true, keyboard_nav: true }, changed_at: new Date().toISOString() }
  },
  async setMode(mode: DisabilityType): Promise<ModeResponse> {
    await sleep(300)
    return { mode, settings: {}, changed_at: new Date().toISOString() }
  },
}

export function getMode(): Promise<ModeResponse> {
  if (IS_MOCK) return mockUsers.getMode()
  return authedRequest<ModeResponse>('/api/v1/users/me/mode')
}

export function setMode(mode: DisabilityType): Promise<ModeResponse> {
  if (IS_MOCK) return mockUsers.setMode(mode)
  return authedRequest<ModeResponse>('/api/v1/users/me/mode', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
}
