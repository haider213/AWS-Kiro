import { beforeAll, afterEach, afterAll, vi } from 'vitest'

// Mock AWS SDK
const mockBedrockClient = {
  send: vi.fn(),
}

vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: vi.fn(() => mockBedrockClient),
  InvokeModelCommand: vi.fn(),
}))

// Mock environment variables
process.env.AWS_REGION = 'us-east-1'
process.env.AWS_ACCESS_KEY_ID = 'test-key'
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret'

beforeAll(() => {
  // Setup before all tests
})

afterEach(() => {
  // Reset mocks after each test
  vi.clearAllMocks()
})

afterAll(() => {
  // Cleanup after all tests
})