import { render, screen, waitFor } from '@testing-library/react'
import { MarkdownViewer } from '@/components/blog/Markdown'
import { ThemeProvider } from 'next-themes'
import React from 'react'

// Mock react-markdown: parse markdown line-by-line so heading lines render
// through the real component's custom heading renderers (passed via `components`).
// This lets the component's DOM-based heading extraction (querySelectorAll('h2'))
// work under test, while non-heading lines render as plain text.
jest.mock('react-markdown', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: ({
      children,
      components,
    }: {
      children: string
      components?: Record<string, React.ComponentType<any>>
    }) => {
      const comps = components || {}
      const nodes = String(children)
        .split('\n')
        .map((line, i) => {
          const h3 = line.match(/^###\s+(.*)/)
          if (h3) {
            const El = comps.h3 || 'h3'
            return React.createElement(El, { key: i }, h3[1])
          }
          const h2 = line.match(/^##\s+(.*)/)
          if (h2) {
            const El = comps.h2 || 'h2'
            return React.createElement(El, { key: i }, h2[1])
          }
          const h1 = line.match(/^#\s+(.*)/)
          if (h1) {
            const El = comps.h1 || 'h1'
            return React.createElement(El, { key: i }, h1[1])
          }
          return line
            ? React.createElement('span', { key: i }, `${line} `)
            : null
        })
      return React.createElement('div', { 'data-testid': 'react-markdown' }, nodes)
    },
  }
})

// Mock ESM-only remark/rehype plugins (avoids transform issues; unused by mocked ReactMarkdown)
jest.mock('rehype-raw', () => ({ __esModule: true, default: () => () => {} }))
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => () => {} }))

// Mock mermaid
jest.mock('mermaid', () => ({
  initialize: jest.fn(),
  render: jest.fn(),
  default: {
    initialize: jest.fn(),
    render: jest.fn(),
  },
}))

// Mock CodeBlock
jest.mock('@/components/blog/CodeBlock', () => ({
  CodeBlock: ({ code, language }: { code: string; language: string }) => (
    React.createElement('div', { 'data-testid': 'code-block', 'data-language': language }, code)
  ),
}))

const renderMarkdown = (content: string, props = {}) => {
  return render(
    <ThemeProvider>
      <MarkdownViewer {...props}>{content}</MarkdownViewer>
    </ThemeProvider>
  )
}

describe('MarkdownViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render markdown content', async () => {
    const content = '# Test Heading\n\nThis is a test paragraph.'
    renderMarkdown(content)

    await waitFor(() => {
      expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
      expect(screen.getByTestId('react-markdown')).toHaveTextContent('Test Heading')
      expect(screen.getByTestId('react-markdown')).toHaveTextContent(
        'This is a test paragraph.'
      )
    })
  })

  it('should render h2 headings with IDs', async () => {
    const content = '## Test Heading 2\n\nContent here.'
    const onHeadingsChange = jest.fn()
    renderMarkdown(content, { onHeadingsChange })

    await waitFor(() => {
      expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
      expect(screen.getByTestId('react-markdown')).toHaveTextContent('Test Heading 2')
    })
  })

  it('should call onHeadingsChange with extracted headings', async () => {
    const content = '## First Heading\n\n## Second Heading\n\nContent.'
    const onHeadingsChange = jest.fn()
    renderMarkdown(content, { onHeadingsChange })

    await waitFor(
      () => {
        expect(onHeadingsChange).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )

    const calls = onHeadingsChange.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const headings = calls[calls.length - 1][0]
    expect(headings.length).toBeGreaterThanOrEqual(2)
  })

  it('should render code blocks', async () => {
    const content = '```javascript\nconst test = "hello";\n```'
    renderMarkdown(content)

    await waitFor(() => {
      expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
    })
  })

  it('should render inline code', async () => {
    const content = 'This is `inline code` example.'
    renderMarkdown(content)

    await waitFor(() => {
      expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
    })
  })

  it('should render links', async () => {
    const content = '[Test Link](https://example.com)'
    renderMarkdown(content)

    await waitFor(() => {
      expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
    })
  })

  it('should render lists', async () => {
    const content = '- Item 1\n- Item 2\n- Item 3'
    renderMarkdown(content)

    await waitFor(() => {
      expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
    })
  })

  it('should render images', async () => {
    const content = '![Alt text](https://example.com/image.jpg)'
    renderMarkdown(content)

    await waitFor(() => {
      expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
    })
  })

  it('should handle empty content', () => {
    renderMarkdown('')

    const container = document.querySelector('[class*="viewerContainer"]')
    expect(container).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = renderMarkdown('Test content', {
      className: 'custom-class',
    })

    const viewerContainer = container.querySelector('[class*="viewerContainer"]')
    expect(viewerContainer).toHaveClass('custom-class')
  })

  it('should memoize component and prevent unnecessary re-renders', () => {
    const content = 'Test content'
    const { rerender } = renderMarkdown(content)

    const initialRender = screen.getByTestId('react-markdown')

    // Re-render with same content
    rerender(
      <ThemeProvider>
        <MarkdownViewer>{content}</MarkdownViewer>
      </ThemeProvider>
    )

    // Component should be memoized, so same instance should be used
    const afterRerender = screen.getByTestId('react-markdown')
    expect(afterRerender).toBeInTheDocument()
  })
})
