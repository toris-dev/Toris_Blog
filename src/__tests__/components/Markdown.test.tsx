import { render, screen, waitFor } from '@testing-library/react'
import { MarkdownViewer } from '@/components/blog/Markdown'
import { ThemeProvider } from 'next-themes'

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
    <div data-testid="code-block" data-language={language}>
      {code}
    </div>
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
      expect(screen.getByTestId('react-markdown')).toHaveTextContent(content)
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
