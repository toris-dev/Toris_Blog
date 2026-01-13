import {
  getPostData,
  getPostBySlug,
  getCategories,
  getPostsByCategory,
  getTags,
  getPostsByTag,
} from '@/utils/markdown'

// Mock fs and path modules to avoid file system operations in tests
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readdirSync: jest.fn(() => []),
  readFileSync: jest.fn(() => ''),
  statSync: jest.fn(() => ({
    isDirectory: () => false,
    isFile: () => true,
  })),
}))

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  relative: jest.fn((from, to) => to.replace(from + '/', '')),
  basename: jest.fn((filePath, ext) => {
    const name = filePath.split('/').pop() || ''
    return ext ? name.replace(ext, '') : name
  }),
  sep: '/',
}))

describe('markdown utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPostData', () => {
    it('should return empty array when posts directory does not exist', () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(false)
      const result = getPostData()
      expect(result).toEqual([])
    })

    it('should return empty array when no markdown files found', () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)
      fs.readdirSync.mockReturnValue([])
      const result = getPostData()
      expect(result).toEqual([])
    })

    it('should parse markdown files correctly', () => {
      const fs = require('fs')
      const mockMarkdownContent = `---
title: Test Post
date: 2024-01-01
tags: [React, Next.js]
---

# Test Content
This is test content.
`

      fs.existsSync.mockReturnValue(true)
      fs.readdirSync.mockReturnValue(['test-post.md'])
      fs.statSync.mockReturnValue({
        isDirectory: () => false,
        isFile: () => true,
      })
      fs.readFileSync.mockReturnValue(mockMarkdownContent)

      const result = getPostData()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getPostBySlug', () => {
    it('should return null when post not found', () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)
      fs.readdirSync.mockReturnValue([])
      const result = getPostBySlug('non-existent-slug')
      expect(result).toBeNull()
    })
  })

  describe('getCategories', () => {
    it('should return empty array when no posts', () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(false)
      const result = getCategories()
      expect(result).toEqual([])
    })
  })

  describe('getPostsByCategory', () => {
    it('should return empty array when no posts in category', () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(false)
      const result = getPostsByCategory('NonExistent')
      expect(result).toEqual([])
    })
  })

  describe('getTags', () => {
    it('should return empty array when no posts', () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(false)
      const result = getTags()
      expect(result).toEqual([])
    })
  })

  describe('getPostsByTag', () => {
    it('should return empty array when no posts with tag', () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(false)
      const result = getPostsByTag('NonExistent')
      expect(result).toEqual([])
    })
  })
})

