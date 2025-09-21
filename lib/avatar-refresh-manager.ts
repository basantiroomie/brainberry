/**
 * Avatar Refresh Manager
 * 
 * Manages avatar cache invalidation and forced refreshing when avatars are updated.
 * This ensures that when a user saves a new avatar, it appears immediately across all components.
 */

import { clearAvatarCache } from './avatar-cache-manager'
import { avatarErrorPrevention } from './avatar-error-prevention'

export interface AvatarRefreshEvent {
  childId: string
  oldAvatarUrl?: string | null
  newAvatarUrl?: string | null
  oldHeadshotUrl?: string | null
  newHeadshotUrl?: string | null
  timestamp: Date
}

class AvatarRefreshManager {
  private static instance: AvatarRefreshManager
  private refreshCallbacks = new Map<string, Set<() => void>>()

  static getInstance(): AvatarRefreshManager {
    if (!AvatarRefreshManager.instance) {
      AvatarRefreshManager.instance = new AvatarRefreshManager()
    }
    return AvatarRefreshManager.instance
  }

  /**
   * Register a callback to be called when a specific child's avatar is updated
   */
  registerChildRefresh(childId: string, callback: () => void): () => void {
    if (!this.refreshCallbacks.has(childId)) {
      this.refreshCallbacks.set(childId, new Set())
    }
    
    this.refreshCallbacks.get(childId)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.refreshCallbacks.get(childId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.refreshCallbacks.delete(childId)
        }
      }
    }
  }

  /**
   * Notify that a child's avatar has been updated
   */
  async notifyAvatarUpdated(event: AvatarRefreshEvent): Promise<void> {
    console.log('AvatarRefreshManager: Avatar updated for child', event.childId, {
      oldAvatarUrl: event.oldAvatarUrl,
      newAvatarUrl: event.newAvatarUrl,
      timestamp: event.timestamp.toISOString()
    })

    // Clear all avatar-related caches
    this.clearAllAvatarCaches(event)

    // Trigger callbacks for this specific child
    const callbacks = this.refreshCallbacks.get(event.childId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('Error in avatar refresh callback:', error)
        }
      })
    }

    // Trigger global refresh event
    this.dispatchGlobalRefreshEvent(event)
  }

  /**
   * Clear all avatar-related caches
   */
  private clearAllAvatarCaches(event: AvatarRefreshEvent): void {
    try {
      // Clear 3D model cache
      clearAvatarCache()
      
      // Clear avatar URL validation cache
      avatarErrorPrevention.clearCache()
      
      // Clear specific URL caches if using useGLTF
      if (typeof window !== 'undefined' && (window as any).useGLTF?.clear) {
        if (event.oldAvatarUrl) {
          (window as any).useGLTF.clear(event.oldAvatarUrl)
        }
        if (event.newAvatarUrl) {
          (window as any).useGLTF.clear(event.newAvatarUrl)
        }
      }
      
      console.log('AvatarRefreshManager: Cleared all avatar caches')
    } catch (error) {
      console.error('Error clearing avatar caches:', error)
    }
  }

  /**
   * Dispatch global refresh event for components that listen to window events
   */
  private dispatchGlobalRefreshEvent(event: AvatarRefreshEvent): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('avatarUpdated', { 
        detail: event 
      }))
      
      // Also dispatch the existing childProfileUpdated event for backward compatibility
      window.dispatchEvent(new CustomEvent('childProfileUpdated', { 
        detail: { 
          id: event.childId,
          avatar_url: event.newAvatarUrl,
          avatar_headshot_url: event.newHeadshotUrl
        } 
      }))
    }
  }

  /**
   * Force refresh all avatars for a specific child
   */
  async forceRefreshChild(childId: string): Promise<void> {
    const event: AvatarRefreshEvent = {
      childId,
      timestamp: new Date()
    }
    
    await this.notifyAvatarUpdated(event)
  }

  /**
   * Get statistics about registered refresh callbacks
   */
  getStats(): { totalChildren: number; totalCallbacks: number } {
    const totalChildren = this.refreshCallbacks.size
    let totalCallbacks = 0
    
    this.refreshCallbacks.forEach(callbacks => {
      totalCallbacks += callbacks.size
    })
    
    return { totalChildren, totalCallbacks }
  }
}

// Global instance
export const avatarRefreshManager = AvatarRefreshManager.getInstance()

/**
 * React hook for listening to avatar updates for a specific child
 */
export function useAvatarRefresh(childId: string, onRefresh: () => void): void {
  const callbackRef = React.useRef(onRefresh)
  callbackRef.current = onRefresh

  React.useEffect(() => {
    if (!childId) return

    const callback = () => callbackRef.current()
    return avatarRefreshManager.registerChildRefresh(childId, callback)
  }, [childId])
}

// Import React for the hook
import React from 'react'
