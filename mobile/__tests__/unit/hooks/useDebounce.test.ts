import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../../hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Rapid changes
    rerender({ value: 'change1' });
    act(() => jest.advanceTimersByTime(200));
    
    rerender({ value: 'change2' });
    act(() => jest.advanceTimersByTime(200));
    
    rerender({ value: 'final' });
    act(() => jest.advanceTimersByTime(500));

    // Only final value should be set
    expect(result.current).toBe('final');
  });

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe('initial');

    act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe('updated');
  });

  it('should cleanup timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebounce('value', 500));
    
    unmount();
    
    // Should not throw error
    act(() => {
      jest.advanceTimersByTime(500);
    });
  });
});
