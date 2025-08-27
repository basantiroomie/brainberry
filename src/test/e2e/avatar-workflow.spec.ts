import { test, expect } from '@playwright/test'

test.describe('Avatar System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and navigate to educator dashboard
    await page.goto('/educator')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('complete avatar creation workflow', async ({ page }) => {
    // Navigate to children tab
    await page.click('text=CHILDREN')
    
    // Wait for children list to load
    await page.waitForSelector('[data-testid="children-list"]', { timeout: 10000 })
    
    // Select a child or create one if none exist
    const childExists = await page.locator('[data-testid="child-card"]').count() > 0
    
    if (!childExists) {
      // Create a new child first
      await page.fill('[data-testid="child-name-input"]', 'Test Child')
      await page.fill('[data-testid="child-age-input"]', '8')
      await page.selectOption('[data-testid="child-diagnosis-select"]', 'ADHD')
      await page.click('[data-testid="create-child-button"]')
      
      // Wait for child to be created
      await page.waitForSelector('[data-testid="child-card"]')
    }
    
    // Click on the first child
    await page.click('[data-testid="child-card"]')
    
    // Navigate to avatar tab
    await page.click('text=AVATAR')
    
    // Click create avatar button
    await page.click('[data-testid="create-avatar-button"]')
    
    // Wait for avatar creator modal to open
    await page.waitForSelector('[data-testid="avatar-creator-modal"]')
    
    // Skip to code entry (since we can't interact with the iframe in tests)
    await page.click('[data-testid="skip-to-code-button"]')
    
    // Enter a valid avatar code
    await page.fill('[data-testid="avatar-code-input"]', 'ABC123')
    
    // Wait for preview URLs to appear
    await page.waitForSelector('[data-testid="preview-urls"]')
    
    // Save the avatar
    await page.click('[data-testid="save-avatar-button"]')
    
    // Wait for success message
    await page.waitForSelector('text=Avatar saved successfully!')
    
    // Verify modal closes
    await page.waitForSelector('[data-testid="avatar-creator-modal"]', { state: 'hidden' })
    
    // Verify avatar appears in the interface
    await page.waitForSelector('[data-testid="avatar-viewer"]')
  })

  test('avatar chatbot interaction', async ({ page }) => {
    // Navigate to child interface
    await page.goto('/child')
    
    // Wait for child interface to load
    await page.waitForLoadState('networkidle')
    
    // Navigate to avatar chatbot (assuming it's in a tab)
    const chatbotTab = page.locator('text=CHAT').or(page.locator('text=AVATAR'))
    if (await chatbotTab.count() > 0) {
      await chatbotTab.click()
    }
    
    // Wait for avatar chatbot to load
    await page.waitForSelector('[data-testid="avatar-chatbot"]', { timeout: 10000 })
    
    // Wait for avatar to load
    await page.waitForSelector('[data-testid="avatar-viewer"]')
    
    // Type a message
    const messageInput = page.locator('[data-testid="chat-input"]').or(page.locator('input[placeholder*="message"]'))
    await messageInput.fill('Hello, how are you today?')
    
    // Send the message
    const sendButton = page.locator('[data-testid="send-button"]').or(page.locator('button[type="submit"]'))
    await sendButton.click()
    
    // Wait for the message to appear
    await page.waitForSelector('text=Hello, how are you today?')
    
    // Wait for avatar response
    await page.waitForSelector('[data-testid="avatar-message"]', { timeout: 15000 })
    
    // Verify response appears
    const responseMessage = page.locator('[data-testid="avatar-message"]').or(page.locator('.avatar-message'))
    await expect(responseMessage).toBeVisible()
  })

  test('avatar display consistency', async ({ page }) => {
    // Test avatar display across different pages
    const pages = ['/educator', '/child']
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      
      // Look for avatar displays
      const avatarDisplays = page.locator('[data-testid="avatar-viewer"]').or(page.locator('[data-testid="child-avatar-display"]'))
      
      if (await avatarDisplays.count() > 0) {
        // Verify avatar loads without errors
        await expect(avatarDisplays.first()).toBeVisible()
        
        // Check for error states
        const errorMessages = page.locator('text=Unable to load').or(page.locator('text=Invalid Avatar'))
        await expect(errorMessages).toHaveCount(0)
      }
    }
  })

  test('avatar error handling', async ({ page }) => {
    // Navigate to educator dashboard
    await page.goto('/educator')
    await page.click('text=CHILDREN')
    
    // Select a child
    await page.waitForSelector('[data-testid="child-card"]')
    await page.click('[data-testid="child-card"]')
    await page.click('text=AVATAR')
    
    // Open avatar creator
    await page.click('[data-testid="create-avatar-button"]')
    await page.click('[data-testid="skip-to-code-button"]')
    
    // Test invalid avatar code
    await page.fill('[data-testid="avatar-code-input"]', 'INVALID')
    
    // Verify error message appears
    await page.waitForSelector('[data-testid="code-error"]')
    await expect(page.locator('[data-testid="code-error"]')).toContainText('Invalid code format')
    
    // Verify save button is disabled
    const saveButton = page.locator('[data-testid="save-avatar-button"]')
    await expect(saveButton).toBeDisabled()
    
    // Test valid code
    await page.fill('[data-testid="avatar-code-input"]', 'ABC123')
    
    // Verify error disappears and save button is enabled
    await expect(page.locator('[data-testid="code-error"]')).toHaveCount(0)
    await expect(saveButton).toBeEnabled()
  })

  test('avatar performance and loading', async ({ page }) => {
    // Navigate to a page with avatar display
    await page.goto('/child')
    await page.waitForLoadState('networkidle')
    
    // Measure avatar loading time
    const startTime = Date.now()
    
    // Wait for avatar to load
    await page.waitForSelector('[data-testid="avatar-viewer"]', { timeout: 10000 })
    
    const loadTime = Date.now() - startTime
    
    // Verify reasonable loading time (less than 5 seconds)
    expect(loadTime).toBeLessThan(5000)
    
    // Check for performance issues
    const performanceWarnings = page.locator('text=Performance Issues').or(page.locator('.performance-warning'))
    await expect(performanceWarnings).toHaveCount(0)
    
    // Verify no console errors related to WebGL or Three.js
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(2000)
    
    // Filter out non-avatar related errors
    const avatarErrors = consoleErrors.filter(error => 
      error.includes('WebGL') || 
      error.includes('Three') || 
      error.includes('avatar') ||
      error.includes('GLB')
    )
    
    expect(avatarErrors).toHaveLength(0)
  })
})