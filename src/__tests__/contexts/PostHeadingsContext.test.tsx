import { render, screen, act } from '@testing-library/react'
import { PostHeadingsProvider, usePostHeadings } from '@/contexts/PostHeadingsContext'
import { Heading } from '@/components/blog/TableOfContents'

// Test component that uses the hook
function TestComponent() {
  const { headings, setHeadings } = usePostHeadings()

  return (
    <div>
      <div data-testid="headings-count">{headings.length}</div>
      <button
        onClick={() =>
          setHeadings([
            { id: 'heading-1', text: 'Test Heading 1', level: 2 },
            { id: 'heading-2', text: 'Test Heading 2', level: 2 },
          ])
        }
      >
        Set Headings
      </button>
      {headings.map((heading) => (
        <div key={heading.id} data-testid={`heading-${heading.id}`}>
          {heading.text}
        </div>
      ))}
    </div>
  )
}

describe('PostHeadingsContext', () => {
  it('should provide headings and setHeadings function', () => {
    render(
      <PostHeadingsProvider>
        <TestComponent />
      </PostHeadingsProvider>
    )

    expect(screen.getByTestId('headings-count')).toHaveTextContent('0')
  })

  it('should update headings when setHeadings is called', async () => {
    render(
      <PostHeadingsProvider>
        <TestComponent />
      </PostHeadingsProvider>
    )

    const button = screen.getByText('Set Headings')
    await act(async () => {
      button.click()
    })

    expect(screen.getByTestId('headings-count')).toHaveTextContent('2')
    expect(screen.getByTestId('heading-heading-1')).toHaveTextContent('Test Heading 1')
    expect(screen.getByTestId('heading-heading-2')).toHaveTextContent('Test Heading 2')
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('usePostHeadings must be used within a PostHeadingsProvider')

    console.error = originalError
  })

  it('should memoize context value to prevent unnecessary re-renders', () => {
    const { rerender } = render(
      <PostHeadingsProvider>
        <TestComponent />
      </PostHeadingsProvider>
    )

    const initialCount = screen.getByTestId('headings-count').textContent

    // Re-render with same props
    rerender(
      <PostHeadingsProvider>
        <TestComponent />
      </PostHeadingsProvider>
    )

    const afterRerenderCount = screen.getByTestId('headings-count').textContent
    expect(afterRerenderCount).toBe(initialCount)
  })
})

