import { authedRequest, IS_MOCK } from './auth'
import type { Author } from './posts'

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export interface FriendRequest {
  id: string
  sender: Author
  receiver: Author
  status: FriendRequestStatus
  created_at: string
  responded_at: string | null
}

export interface FriendRequestsPage {
  items: FriendRequest[]
}

export interface FriendsPage {
  items: Author[]
}

export interface BlockResult {
  blocked: boolean
}

export interface BlocksPage {
  items: Author[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// chat.ts 등 다른 mock 서비스가 동일한 인물 정보를 재사용할 수 있도록 export
export const mockFriendsStore: Author[] = [
  { id: 'mock-friend-1', nickname: '달빛여행', profile_image_url: null },
  { id: 'mock-friend-2', nickname: '하늘산책', profile_image_url: null },
  { id: 'mock-friend-3', nickname: '봄날의소리', profile_image_url: null },
]

const mockRequestsStore: FriendRequest[] = [
  {
    id: 'mock-request-1',
    sender: { id: 'mock-user-201', nickname: '작은우산', profile_image_url: null },
    receiver: { id: 'mock-me', nickname: '나', profile_image_url: null },
    status: 'pending',
    created_at: new Date().toISOString(),
    responded_at: null,
  },
  {
    id: 'mock-request-2',
    sender: { id: 'mock-user-202', nickname: '노란은행잎', profile_image_url: null },
    receiver: { id: 'mock-me', nickname: '나', profile_image_url: null },
    status: 'pending',
    created_at: new Date().toISOString(),
    responded_at: null,
  },
]

const mockSentStore: FriendRequest[] = []
// chat.ts 등 다른 mock 서비스가 차단 관계를 참조할 수 있도록 export
export const mockBlocksStore: Author[] = []

const mockFriends = {
  async sendRequest(receiverId: string): Promise<FriendRequest> {
    await sleep(500)
    if (mockFriendsStore.some((f) => f.id === receiverId))
      throw { status: 400, detail: '이미 친구입니다' }
    const req: FriendRequest = {
      id: crypto.randomUUID(),
      sender: { id: 'mock-me', nickname: '나', profile_image_url: null },
      receiver: { id: receiverId, nickname: '상대방', profile_image_url: null },
      status: 'pending',
      created_at: new Date().toISOString(),
      responded_at: null,
    }
    mockSentStore.push(req)
    return req
  },
  async getRequests(box: 'received' | 'sent'): Promise<FriendRequestsPage> {
    await sleep(400)
    return { items: box === 'sent' ? mockSentStore : mockRequestsStore }
  },
  async respond(requestId: string, status: 'accepted' | 'declined' | 'cancelled'): Promise<FriendRequest> {
    await sleep(400)
    const idx = mockRequestsStore.findIndex((r) => r.id === requestId)
    const list = idx !== -1 ? mockRequestsStore : mockSentStore
    const targetIdx = idx !== -1 ? idx : mockSentStore.findIndex((r) => r.id === requestId)
    if (targetIdx === -1) throw { status: 404, detail: '처리할 수 없는 요청입니다' }
    const [request] = list.splice(targetIdx, 1)
    const updated = { ...request, status, responded_at: new Date().toISOString() }
    if (status === 'accepted') mockFriendsStore.unshift(request.sender)
    return updated
  },
  async getFriends(): Promise<FriendsPage> {
    await sleep(400)
    return { items: mockFriendsStore }
  },
  async unfriend(userId: string): Promise<void> {
    await sleep(300)
    const idx = mockFriendsStore.findIndex((f) => f.id === userId)
    if (idx !== -1) mockFriendsStore.splice(idx, 1)
  },
  async block(userId: string): Promise<BlockResult> {
    await sleep(400)
    if (!mockBlocksStore.some((b) => b.id === userId))
      mockBlocksStore.push({ id: userId, nickname: '차단된 사용자', profile_image_url: null })
    const friendIdx = mockFriendsStore.findIndex((f) => f.id === userId)
    if (friendIdx !== -1) mockFriendsStore.splice(friendIdx, 1)
    return { blocked: true }
  },
  async unblock(userId: string): Promise<void> {
    await sleep(300)
    const idx = mockBlocksStore.findIndex((b) => b.id === userId)
    if (idx !== -1) mockBlocksStore.splice(idx, 1)
  },
  async getBlocks(): Promise<BlocksPage> {
    await sleep(300)
    return { items: mockBlocksStore }
  },
}

export function sendFriendRequest(receiverId: string): Promise<FriendRequest> {
  if (IS_MOCK) return mockFriends.sendRequest(receiverId)
  return authedRequest<FriendRequest>('/api/v1/friends/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: receiverId }),
  })
}

export function getFriendRequests(box: 'received' | 'sent' = 'received'): Promise<FriendRequestsPage> {
  if (IS_MOCK) return mockFriends.getRequests(box)
  return authedRequest<FriendRequestsPage>(`/api/v1/friends/requests?box=${box}`)
}

export function acceptFriendRequest(requestId: string): Promise<FriendRequest> {
  if (IS_MOCK) return mockFriends.respond(requestId, 'accepted')
  return authedRequest<FriendRequest>(`/api/v1/friends/requests/${requestId}/accept`, { method: 'POST' })
}

export function declineFriendRequest(requestId: string): Promise<FriendRequest> {
  if (IS_MOCK) return mockFriends.respond(requestId, 'declined')
  return authedRequest<FriendRequest>(`/api/v1/friends/requests/${requestId}/decline`, { method: 'POST' })
}

export function cancelFriendRequest(requestId: string): Promise<FriendRequest> {
  if (IS_MOCK) return mockFriends.respond(requestId, 'cancelled')
  return authedRequest<FriendRequest>(`/api/v1/friends/requests/${requestId}/cancel`, { method: 'POST' })
}

export function getFriends(): Promise<FriendsPage> {
  if (IS_MOCK) return mockFriends.getFriends()
  return authedRequest<FriendsPage>('/api/v1/friends')
}

export function unfriend(userId: string): Promise<void> {
  if (IS_MOCK) return mockFriends.unfriend(userId)
  return authedRequest<void>(`/api/v1/friends/${userId}`, { method: 'DELETE' })
}

export function blockUser(userId: string): Promise<BlockResult> {
  if (IS_MOCK) return mockFriends.block(userId)
  return authedRequest<BlockResult>('/api/v1/blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
}

export function unblockUser(userId: string): Promise<void> {
  if (IS_MOCK) return mockFriends.unblock(userId)
  return authedRequest<void>(`/api/v1/blocks/${userId}`, { method: 'DELETE' })
}

export function getBlocks(): Promise<BlocksPage> {
  if (IS_MOCK) return mockFriends.getBlocks()
  return authedRequest<BlocksPage>('/api/v1/blocks')
}
