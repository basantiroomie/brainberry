/**
 * Authentication utilities for client-side
 */

export class AuthUtils {
  /**
   * Check if a response indicates an authentication error
   */
  static isAuthError(response: Response): boolean {
    return response.status === 401 || response.status === 403
  }

  /**
   * Check if response content is HTML (likely a login redirect)
   */
  static isHtmlResponse(response: Response): boolean {
    const contentType = response.headers.get('content-type')
    return contentType ? contentType.includes('text/html') : false
  }

  /**
   * Handle authentication errors by clearing session and redirecting
   */
  static handleAuthError(router: any) {
    console.warn('Authentication error detected, clearing session and redirecting to login')
    sessionStorage.removeItem('childProfile')
    sessionStorage.removeItem('educatorProfile')
    router.push('/login')
  }

  /**
   * Safe API call with authentication error handling
   */
  static async safeApiCall(
    url: string, 
    options: RequestInit = {},
    router?: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(url, options)
      
      if (this.isAuthError(response) || this.isHtmlResponse(response)) {
        if (router) {
          this.handleAuthError(router)
        }
        return { success: false, error: 'Authentication issue detected.' }
      }
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          return { success: true, data }
        } else {
          // Handle cases where the response is OK but not JSON (e.g., empty response from a DELETE)
          return { success: true, data: await response.text() }
        }
      } else {
        const errorText = await response.text()
        return { success: false, error: `API error: ${response.status} ${response.statusText} - ${errorText}` }
      }
    } catch (error) {
      console.error('API call failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown network error' }
    }
  }
}

export default AuthUtils