# Avatar System Test Suite

This directory contains comprehensive tests for the 3D Avatar System in BrainBerry.

## Test Structure

### Unit Tests (`/components/`)
- **AvatarViewer.test.tsx**: Tests for the 3D avatar display component
  - Rendering with different camera modes
  - Error handling and fallbacks
  - Performance monitoring integration
  - WebGL context management
  - Headshot capture functionality

- **AvatarChatbot.test.tsx**: Tests for the interactive avatar chatbot
  - Message sending and receiving
  - TTS integration and lip-sync
  - Idle animations and blend shapes
  - Error handling and retry mechanisms
  - Loading states and user feedback

- **AvatarCreatorModal.test.tsx**: Tests for the avatar creation interface
  - Ready Player Me iframe integration
  - Avatar code validation and conversion
  - Modal state management
  - Error handling and user feedback

### API Tests (`/api/`)
- **chat.test.ts**: Tests for the chat API endpoint
  - Message validation and processing
  - Gemini AI integration
  - Authentication and authorization
  - Error handling and fallbacks

- **children.test.ts**: Tests for child profile management API
  - Avatar URL updates
  - Avatar code conversion
  - Data validation and security
  - Database operations

### End-to-End Tests (`/e2e/`)
- **avatar-workflow.spec.ts**: Complete avatar system workflows
  - Avatar creation from start to finish
  - Chatbot interaction flows
  - Cross-page avatar display consistency
  - Error handling scenarios
  - Performance and loading tests

### Performance Tests (`/performance/`)
- **avatar-performance.test.ts**: Performance monitoring and optimization
  - 3D rendering performance
  - Memory usage monitoring
  - Loading time measurements
  - Frame rate monitoring
  - Multiple avatar instance handling

### Security Tests (`/security/`)
- **avatar-security.test.ts**: Security validation and protection
  - Authentication and authorization
  - Input validation and sanitization
  - XSS and injection prevention
  - Rate limiting and DoS protection
  - Data privacy and protection

### Accessibility Tests (`/accessibility/`)
- **avatar-accessibility.test.ts**: Accessibility compliance
  - ARIA labels and semantic HTML
  - Keyboard navigation support
  - Screen reader compatibility
  - High contrast mode support
  - Reduced motion preferences
  - Focus management

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)
- JSdom environment for browser APIs
- React plugin for JSX support
- Path aliases for imports
- Coverage reporting with v8
- Global test utilities

### Test Setup (`setup.ts`)
- Mock implementations for Next.js APIs
- Web Speech API mocking
- WebGL context mocking
- Environment variable setup
- Global test utilities

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing (Chrome, Firefox, Safari)
- Local development server integration
- Test reporting and tracing
- Retry mechanisms for CI/CD

## Running Tests

### Unit and Integration Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run src/test/components/AvatarViewer.test.tsx
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E test
npx playwright test avatar-workflow
```

### Test UI
```bash
# Open Vitest UI
npm run test:ui

# Open Playwright UI
npm run test:e2e:ui
```

## Test Coverage

The test suite covers:

### Functional Requirements
- ✅ Avatar creation and display
- ✅ 3D rendering and camera controls
- ✅ Chatbot interactions with TTS
- ✅ Avatar code validation and conversion
- ✅ API authentication and data handling

### Non-Functional Requirements
- ✅ Performance monitoring and optimization
- ✅ Security validation and protection
- ✅ Accessibility compliance
- ✅ Error handling and recovery
- ✅ Cross-browser compatibility

### Edge Cases
- ✅ Network failures and timeouts
- ✅ Invalid input handling
- ✅ WebGL context loss
- ✅ Memory management
- ✅ Concurrent operations

## Mocking Strategy

### External Dependencies
- **Ready Player Me**: Iframe interactions mocked with message events
- **Gemini AI**: API responses mocked with configurable data
- **Supabase**: Database operations mocked with test data
- **Web Speech API**: TTS functionality mocked for testing
- **Three.js/WebGL**: 3D rendering mocked for unit tests

### Internal Dependencies
- **Performance Monitor**: Metrics collection mocked
- **Error Handler**: Error reporting mocked
- **Cache Manager**: Caching operations mocked
- **Retry Manager**: Retry logic mocked

## Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Avatar System Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

### Test Reports
- Unit test coverage reports in HTML format
- E2E test reports with screenshots and traces
- Performance metrics and benchmarks
- Security scan results

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies consistently

### Performance Testing
- Monitor memory usage during tests
- Measure rendering performance
- Test with multiple avatar instances
- Validate cleanup and disposal

### Security Testing
- Test input validation thoroughly
- Verify authentication and authorization
- Check for XSS and injection vulnerabilities
- Validate data sanitization

### Accessibility Testing
- Test keyboard navigation
- Verify screen reader compatibility
- Check color contrast and visual indicators
- Test with assistive technologies

## Troubleshooting

### Common Issues
1. **WebGL Context Errors**: Ensure proper mocking in test setup
2. **Async Test Failures**: Use proper waitFor and async/await patterns
3. **Memory Leaks**: Verify cleanup in afterEach hooks
4. **Flaky E2E Tests**: Add proper wait conditions and retries

### Debug Tips
- Use `screen.debug()` to inspect rendered DOM
- Add `console.log` statements in test setup
- Use Playwright's trace viewer for E2E debugging
- Check browser console for WebGL errors

## Contributing

When adding new avatar features:
1. Write unit tests for components
2. Add integration tests for APIs
3. Include E2E tests for user workflows
4. Test performance implications
5. Verify security and accessibility
6. Update this documentation