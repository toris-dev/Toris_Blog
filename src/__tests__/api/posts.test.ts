import { GET } from '@/app/api/posts/route'
import { getPostData } from '@/utils/markdown'
import { NextResponse } from 'next/server'

// Mock the markdown utility
jest.mock('@/utils/markdown', () => ({
  getPostData: jest.fn(),
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

const mockedGetPostData = getPostData as jest.MockedFunction<typeof getPostData>

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return posts successfully', async () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Test Post 1',
        slug: 'test-post-1',
        content: 'Content 1',
        description: 'Description 1',
        category: 'Learning',
        tags: ['React'],
        date: '2024-01-01',
        filePath: 'test1.md',
      },
      {
        id: 2,
        title: 'Test Post 2',
        slug: 'test-post-2',
        content: 'Content 2',
        description: 'Description 2',
        category: 'Projects',
        tags: ['Next.js'],
        date: '2024-01-02',
        filePath: 'test2.md',
      },
    ]

    mockedGetPostData.mockReturnValue(mockPosts)

    const response = await GET()
    const data = await response.json()

    expect(getPostData).toHaveBeenCalled()
    expect(data).toEqual(mockPosts)
    expect(response.status).toBe(200)
  })

  it('should return empty array when no posts', async () => {
    mockedGetPostData.mockReturnValue([])

    const response = await GET()
    const data = await response.json()

    expect(data).toEqual([])
    expect(response.status).toBe(200)
  })

  it('should handle errors and return 500 status', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockedGetPostData.mockImplementation(() => {
      throw new Error('Test error')
    })

    const response = await GET()
    const data = await response.json()

    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Failed to fetch posts')
    expect(response.status).toBe(500)
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})

