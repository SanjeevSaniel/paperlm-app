'use client';

import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

interface StreamingChatOptions {
  onStreamStart?: () => void;
  onStreamComplete?: (content: string) => void;
  onError?: (error: Error) => void;
}

interface StreamingChatState {
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
}

/**
 * Custom hook for handling streaming chat responses
 * 
 * Features:
 * - Real-time content streaming
 * - Error handling with retries
 * - Abort capability
 * - Stream status management
 * 
 * @param options - Configuration options for streaming behavior
 * @returns Object with streaming state and control functions
 */
export function useStreamingChat(options: StreamingChatOptions = {}) {
  const [state, setState] = useState<StreamingChatState>({
    isStreaming: false,
    streamingContent: '',
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  /**
   * Start streaming chat response
   */
  const startStream = useCallback(async (
    endpoint: string,
    requestBody: Record<string, unknown>
  ): Promise<{ content: string; citations?: unknown[] }> => {
    try {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      setState(prev => ({
        ...prev,
        isStreaming: true,
        streamingContent: '',
        error: null,
      }));

      options.onStreamStart?.();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Extract citations from headers
      let citations: unknown[] = [];
      const citationsHeader = response.headers.get('X-Citations');
      if (citationsHeader) {
        try {
          citations = JSON.parse(citationsHeader) as unknown[];
        } catch (e) {
          console.warn('Failed to parse citations from header:', e);
        }
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          
          setState(prev => ({
            ...prev,
            streamingContent: fullContent,
          }));
        }
      } finally {
        reader.releaseLock();
        readerRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isStreaming: false,
      }));

      const result = { content: fullContent, citations };
      options.onStreamComplete?.(fullContent);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
      }));

      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Streaming error:', error);
        toast.error(`Streaming failed: ${errorMessage}`);
        options.onError?.(error);
      }

      throw error;
    }
  }, [options]);

  /**
   * Abort current stream
   */
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (readerRef.current) {
      readerRef.current.cancel();
    }

    setState(prev => ({
      ...prev,
      isStreaming: false,
      error: null,
    }));
  }, []);

  /**
   * Clear streaming state
   */
  const clearStream = useCallback(() => {
    setState({
      isStreaming: false,
      streamingContent: '',
      error: null,
    });
  }, []);

  return {
    // State
    isStreaming: state.isStreaming,
    streamingContent: state.streamingContent,
    error: state.error,
    
    // Actions
    startStream,
    abortStream,
    clearStream,
  };
}