// ============================================================================
// useOptimistic.ts — Optimistic Update Helper Hook
// ============================================================================
// Provides utilities for optimistic UI updates with automatic rollback on error.
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OptimisticUpdateOptions<TData, TVariables> {
  /**
   * Query key to update optimistically
   */
  queryKey: QueryKey;
  
  /**
   * Function to compute the optimistic data
   */
  updater: (oldData: TData | undefined, variables: TVariables) => TData;
  
  /**
   * Mutation function that performs the actual update
   */
  mutationFn: (variables: TVariables) => Promise<TData>;
  
  /**
   * Optional callback on success
   */
  onSuccess?: (data: TData, variables: TVariables) => void;
  
  /**
   * Optional callback on error
   */
  onError?: (error: Error, variables: TVariables) => void;
  
  /**
   * Optional callback on settled (success or error)
   */
  onSettled?: () => void;
}

interface UseOptimisticReturn<TVariables> {
  /**
   * Execute the optimistic update
   */
  mutate: (variables: TVariables) => Promise<void>;
  
  /**
   * Is the mutation in progress?
   */
  isPending: boolean;
  
  /**
   * Did the mutation fail?
   */
  isError: boolean;
  
  /**
   * Error from the mutation
   */
  error: Error | null;
  
  /**
   * Reset the mutation state
   */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook for optimistic updates with automatic rollback
 * 
 * @example
 * const updateTask = useOptimistic({
 *   queryKey: ['tasks', taskId],
 *   updater: (oldTask, { status }) => ({ ...oldTask, status }),
 *   mutationFn: ({ status }) => api.updateTask(taskId, { status }),
 *   onError: (error) => toast.error(error.message),
 * });
 * 
 * // Usage
 * await updateTask.mutate({ status: 'completed' });
 */
export function useOptimistic<TData = unknown, TVariables = unknown>(
  options: OptimisticUpdateOptions<TData, TVariables>
): UseOptimisticReturn<TVariables> {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Store previous data for rollback
  const previousDataRef = useRef<TData | undefined>(undefined);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsPending(true);
      setIsError(false);
      setError(null);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });

      // Snapshot the previous value
      previousDataRef.current = queryClient.getQueryData<TData>(options.queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<TData>(
        options.queryKey,
        (old) => options.updater(old, variables)
      );

      try {
        // Perform the actual mutation
        const data = await options.mutationFn(variables);
        
        // Update with server response
        queryClient.setQueryData(options.queryKey, data);
        
        // Call success callback
        options.onSuccess?.(data, variables);
        
        setIsPending(false);
      } catch (err) {
        // Rollback to previous value on error
        queryClient.setQueryData(options.queryKey, previousDataRef.current);
        
        const error = err instanceof Error ? err : new Error('Unknown error');
        setIsError(true);
        setError(error);
        
        // Call error callback
        options.onError?.(error, variables);
        
        setIsPending(false);
      } finally {
        // Always refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: options.queryKey });
        
        // Call settled callback
        options.onSettled?.();
      }
    },
    [queryClient, options]
  );

  const reset = useCallback(() => {
    setIsPending(false);
    setIsError(false);
    setError(null);
  }, []);

  return {
    mutate,
    isPending,
    isError,
    error,
    reset,
  };
}

// ---------------------------------------------------------------------------
// Simplified Hook for Common Patterns
// ---------------------------------------------------------------------------

/**
 * Simplified optimistic update for toggling boolean values
 * 
 * @example
 * const toggleComplete = useOptimisticToggle({
 *   queryKey: ['task', taskId],
 *   field: 'completed',
 *   mutationFn: (value) => api.updateTask(taskId, { completed: value }),
 * });
 * 
 * // Usage
 * await toggleComplete();
 */
export function useOptimisticToggle<TData extends Record<string, any>>(options: {
  queryKey: QueryKey;
  field: keyof TData;
  mutationFn: (value: boolean) => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();
  return useOptimistic<TData, void>({
    queryKey: options.queryKey,
    updater: (oldData) => {
      if (!oldData) return undefined as any;
      return {
        ...oldData,
        [options.field]: !oldData[options.field],
      } as TData;
    },
    mutationFn: async () => {
      const currentData = queryClient.getQueryData<TData>(options.queryKey);
      const newValue = currentData ? !currentData[options.field] : true;
      return options.mutationFn(newValue);
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
