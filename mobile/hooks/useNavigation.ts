/**
 * Safe navigation hook that handles cases when navigation context is not available
 * This prevents "Couldn't find a navigation context" errors
 */

import { useCallback, useEffect, useState } from 'react';
import { router, useRouter, usePathname, useSegments, useRootNavigationState } from 'expo-router';

export interface SafeNavigation {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  canGoBack: () => boolean;
  pathname: string;
  segments: string[];
  isReady: boolean;
}

/**
 * Hook that provides safe navigation methods
 * Falls back gracefully when navigation context is not available
 */
export function useNavigation(): SafeNavigation {
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  let routerInstance: ReturnType<typeof useRouter> | null = null;
  let pathname = '';
  let segments: string[] = [];
  let rootNavigationState: ReturnType<typeof useRootNavigationState> | null = null;

  try {
    routerInstance = useRouter();
    pathname = usePathname() || '';
    segments = useSegments() || [];
    rootNavigationState = useRootNavigationState();
  } catch (error) {
    // Navigation context not available
    console.warn('Navigation context not available');
  }

  // Check if navigation is ready
  useEffect(() => {
    if (rootNavigationState?.key) {
      setIsNavigationReady(true);
    }
  }, [rootNavigationState?.key]);

  const isReady = isNavigationReady && !!rootNavigationState?.key;

  const push = useCallback((href: string) => {
    // Use setTimeout to ensure we're not in the middle of a render
    setTimeout(() => {
      try {
        if (routerInstance && isReady) {
          routerInstance.push(href as any);
        } else {
          // Fallback to global router
          router.push(href as any);
        }
      } catch (error) {
        console.error('Navigation push failed:', error);
      }
    }, 0);
  }, [routerInstance, isReady]);

  const replace = useCallback((href: string) => {
    setTimeout(() => {
      try {
        if (routerInstance && isReady) {
          routerInstance.replace(href as any);
        } else {
          router.replace(href as any);
        }
      } catch (error) {
        console.error('Navigation replace failed:', error);
      }
    }, 0);
  }, [routerInstance, isReady]);

  const back = useCallback(() => {
    setTimeout(() => {
      try {
        if (routerInstance && isReady) {
          routerInstance.back();
        } else {
          router.back();
        }
      } catch (error) {
        console.error('Navigation back failed:', error);
      }
    }, 0);
  }, [routerInstance, isReady]);

  const canGoBack = useCallback(() => {
    try {
      if (routerInstance && isReady) {
        return routerInstance.canGoBack();
      }
      return router.canGoBack();
    } catch (error) {
      return false;
    }
  }, [routerInstance, isReady]);

  return {
    push,
    replace,
    back,
    canGoBack,
    pathname,
    segments,
    isReady,
  };
}

/**
 * Safe navigation function for use outside of React components
 * Use this in Alert callbacks, setTimeout, etc.
 */
export const safeNavigate = {
  push: (href: string) => {
    // Use setTimeout to ensure navigation happens after current execution
    setTimeout(() => {
      try {
        router.push(href as any);
      } catch (error) {
        console.error('Safe navigate push failed:', error);
      }
    }, 0);
  },
  replace: (href: string) => {
    setTimeout(() => {
      try {
        router.replace(href as any);
      } catch (error) {
        console.error('Safe navigate replace failed:', error);
      }
    }, 0);
  },
  back: () => {
    setTimeout(() => {
      try {
        router.back();
      } catch (error) {
        console.error('Safe navigate back failed:', error);
      }
    }, 0);
  },
};

export default useNavigation;
