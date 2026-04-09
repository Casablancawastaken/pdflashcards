import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { useDebounce } from '../api/useDebounce'

describe('useDebounce', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500))
    expect(result.current).toBe('hello')
  })

  it('updates value after delay', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ val }) => useDebounce(val, 500),
      {
        initialProps: { val: 'first' },
      }
    )

    expect(result.current).toBe('first')

    rerender({ val: 'second' })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('second')
  })
})