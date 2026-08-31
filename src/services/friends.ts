import { authedRequest } from './auth'
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

export function sendFriendRequest(receiverId: string): Promise<FriendRequest> {
  return authedRequest<FriendRequest>('/api/v1/friends/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: receiverId }),
  })
}

export function getFriendRequests(box: 'received' | 'sent' = 'received'): Promise<FriendRequestsPage> {
  return authedRequest<FriendRequestsPage>(`/api/v1/friends/requests?box=${box}`)
}

export function acceptFriendRequest(requestId: string): Promise<FriendRequest> {
  return authedRequest<FriendRequest>(`/api/v1/friends/requests/${requestId}/accept`, { method: 'POST' })
}

export function declineFriendRequest(requestId: string): Promise<FriendRequest> {
  return authedRequest<FriendRequest>(`/api/v1/friends/requests/${requestId}/decline`, { method: 'POST' })
}

export function cancelFriendRequest(requestId: string): Promise<FriendRequest> {
  return authedRequest<FriendRequest>(`/api/v1/friends/requests/${requestId}/cancel`, { method: 'POST' })
}

export function getFriends(): Promise<FriendsPage> {
  return authedRequest<FriendsPage>('/api/v1/friends')
}

export function unfriend(userId: string): Promise<void> {
  return authedRequest<void>(`/api/v1/friends/${userId}`, { method: 'DELETE' })
}

export function blockUser(userId: string): Promise<BlockResult> {
  return authedRequest<BlockResult>('/api/v1/blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
}

export function unblockUser(userId: string): Promise<void> {
  return authedRequest<void>(`/api/v1/blocks/${userId}`, { method: 'DELETE' })
}

export function getBlocks(): Promise<BlocksPage> {
  return authedRequest<BlocksPage>('/api/v1/blocks')
}
