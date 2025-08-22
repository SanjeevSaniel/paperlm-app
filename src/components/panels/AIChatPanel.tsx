'use client';

import { useDocumentContext } from '@/contexts/DocumentContext';
import { useUsage } from '@/contexts/UsageContext';
import { getSessionId } from '@/lib/sessionStorage';
import { ChatMessage, Citation } from '@/types';
import { useUser } from '@clerk/nextjs';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import AIAssistantAnimation from '../AIAssistantAnimation';
import ChatHeader from '../chat/ChatHeader';
import ChatInput from '../chat/ChatInput';
import ChatMessageComponent from '../chat/ChatMessage';
import EmptyState from '../chat/EmptyState';
import LoadingIndicator from '../chat/LoadingIndicator';
import StreamingMessage from '../chat/StreamingMessage';
import { EnhancedCitation, mapUserToChatUser } from '../chat/types';
import { useStreamingChat } from '@/hooks/useStreamingChat';

export default function AIChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [currentUserQuery, setCurrentUserQuery] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [streamingCitations, setStreamingCitations] = useState<EnhancedCitation[]>([]);
  
  // Convert EnhancedCitation to Citation format
  const convertCitations = (enhancedCitations: EnhancedCitation[]): Citation[] => {
    return enhancedCitations.map((citation, index) => ({
      id: citation.id,
      documentId: citation.documentId || '',
      documentName: citation.documentName || 'Unknown Document',
      documentType: citation.documentType,
      sourceUrl: citation.sourceUrl,
      loader: 'enhanced', // Default loader since EnhancedCitation doesn't have this
      chunkId: citation.chunkId || `chunk-${index}`,
      chunkIndex: index, // Use array index as chunk index
      content: citation.content,
      fullContent: citation.fullContent || citation.content,
      startChar: 0, // Default values since EnhancedCitation doesn't have these
      endChar: citation.content.length,
      relevanceScore: citation.relevanceScore,
      uploadedAt: undefined, // EnhancedCitation doesn't have uploadedAt
      author: citation.author,
      publishedAt: citation.publishedAt,
    }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { hasDocuments, documentCount } = useDocumentContext();
  const { canChat, incrementChatUsage, chatCount, maxFreeChats } = useUsage();
  const { user } = useUser();
  
  // Streaming chat hook
  const {
    isStreaming,
    streamingContent,
    startStream,
    abortStream,
    clearStream,
  } = useStreamingChat({
    onStreamStart: () => {
      setIsLoading(false); // Turn off loading when streaming starts
    },
    onStreamComplete: async (content: string) => {
      // Convert streaming content to a regular message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        citations: convertCitations(streamingCitations),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingCitations([]);
      clearStream();

      // Save assistant response to NeonDB
      try {
        if (currentConversationId) {
          await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: assistantMessage.content,
              sessionId: getSessionId(),
              conversationId: currentConversationId,
              role: 'assistant',
              citations: assistantMessage.citations,
            }),
          });
        }
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }

      // Increment usage count on successful response
      await incrementChatUsage();
    },
    onError: (error) => {
      console.error('Streaming error:', error);
      setIsLoading(false);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  // Clear chat functionality
  const clearChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    toast.success('Chat cleared!', {
      duration: 2000,
      icon: '🗑️',
    });
  };

  // New chat session functionality - starts a new conversation
  const newChatSession = () => {
    setMessages([]);
    setCurrentConversationId(null);
    toast.success('New chat session started!', {
      duration: 2000,
      icon: '💬',
    });
  };

  // Cycle through loading messages
  useEffect(() => {
    if (!isLoading) return;

    let index = 0;
    setLoadingMessageIndex(0);

    const interval = setInterval(() => {
      index = (index + 1) % 4; // Assuming 4 loading messages
      setLoadingMessageIndex(index);
    }, 1500); // Change message every 1.5 seconds

    return () => clearInterval(interval);
  }, [isLoading, currentUserQuery]);

  // Responsive screen size
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load chat conversations from NeonDB API
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const sessionId = getSessionId();
        if (!sessionId) {
          setMessages([]);
          setIsInitialized(true);
          return;
        }

        const response = await fetch(`/api/chat?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          // For now, we'll load the most recent conversation's messages
          // In the future, we could implement conversation switching
          if (data.conversations && data.conversations.length > 0) {
            const latestConversation = data.conversations[0];
            const messagesResponse = await fetch(
              `/api/chat?conversationId=${latestConversation.id}`,
            );
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              const parsedMessages = messagesData.messages.map((msg: { id: string; role: string; content: string; citations?: EnhancedCitation[]; createdAt: string; metadata?: Record<string, unknown> }) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.createdAt),
                citations: msg.citations || [],
                metadata: msg.metadata || {},
              }));
              setMessages(parsedMessages);
              setCurrentConversationId(latestConversation.id);
            }
          } else {
            setMessages([]);
          }
        } else {
          console.warn('Failed to load chat history from API');
          setMessages([]);
        }
      } catch (error) {
        console.warn('Failed to load chat history:', error);
        setMessages([]);
      } finally {
        setIsInitialized(true);
      }
    };

    loadChatHistory();
  }, []);

  // Toggle animation visibility
  useEffect(() => {
    if (hasDocuments || messages.length > 0 || documentCount > 0) {
      setShowAnimation(false);
    } else {
      setShowAnimation(true);
    }
  }, [hasDocuments, messages.length, documentCount]);

  const scrollToBottom = (smooth: boolean) => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  };

  // Scroll when messages change
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollToBottom(isInitialized);
    });
    return () => cancelAnimationFrame(id);
  }, [messages, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Check usage limit
    if (!canChat) {
      // Show authentication prompt instead of just an error
      const authMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `You've reached the free chat limit of ${maxFreeChats} messages. Sign in to continue with unlimited access!`,
        timestamp: new Date(),
        isAuthPrompt: true,
      };

      setMessages((prev) => [...prev, authMessage]);
      return;
    }

    if (showAnimation) setShowAnimation(false);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setCurrentUserQuery(inputValue); // Store query for context-aware loading
    setInputValue('');
    setIsLoading(true);

    // Save user message to NeonDB via chat API
    try {
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          sessionId: getSessionId(),
          conversationId: currentConversationId,
          documentIds: [], // Could be populated with relevant document IDs
        }),
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        if (!currentConversationId) {
          setCurrentConversationId(chatData.conversationId);
        }
      }
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    try {
      const endpoint = enableStreaming ? '/api/query/stream' : '/api/query';
      
      if (enableStreaming) {
        // Use streaming approach with custom hook
        const requestBody = {
          message: currentInput,
          sessionId: getSessionId(),
          userEmail: user?.primaryEmailAddress?.emailAddress,
          chatHistory: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        };

        const streamResult = await startStream(endpoint, requestBody);
        // Citations are already handled in the hook's response parsing
        if (streamResult.citations) {
          setStreamingCitations(streamResult.citations as EnhancedCitation[]);
        }
      } else {
        // Use non-streaming approach (fallback)
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            sessionId: getSessionId(),
            userEmail: user?.primaryEmailAddress?.emailAddress,
            chatHistory: messages.slice(-5).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (response.ok) {
          const result = await response.json();

          // Increment usage count on successful response
          await incrementChatUsage();

          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content:
              result.response ||
              "I received your message but couldn't generate a proper response.",
            timestamp: new Date(),
            citations: result.citations || [],
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // Save assistant response to NeonDB
          try {
            if (currentConversationId) {
              await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: assistantMessage.content,
                  sessionId: getSessionId(),
                  conversationId: currentConversationId,
                  role: 'assistant',
                  citations: assistantMessage.citations,
                }),
              });
            }
          } catch (error) {
            console.error('Error saving assistant message:', error);
          }
        } else {
          throw new Error('Query failed');
        }
      }
    } catch (error) {
      console.error('Query error:', error);
      setIsLoading(false);
      
      // Only show error message if not streaming (streaming errors are handled by hook)
      if (!enableStreaming) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Sorry, I encountered an error processing your request. Please make sure you have uploaded documents and your API keys are configured.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    }
  };

  return (
    <div className='h-full min-h-0 flex flex-col overflow-hidden'>
      {/* Header */}
      <ChatHeader
        hasDocuments={hasDocuments}
        messages={messages}
        onClearChat={clearChat}
        onNewChatSession={newChatSession}
        user={mapUserToChatUser(user)}
        canChat={canChat}
        chatCount={chatCount}
        maxFreeChats={maxFreeChats}
      />

      {/* Messages section */}
      <div className='flex-1 min-h-0'>
        <div
          className='h-full min-h-0 overflow-y-auto overflow-x-hidden px-4 py-2 space-y-3 relative'
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent',
          }}>
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 4px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
              margin: 4px 0;
            }
            div::-webkit-scrollbar-thumb {
              background: rgba(148, 163, 184, 0.3);
              border-radius: 10px;
              transition: all 0.2s ease;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: rgba(148, 163, 184, 0.6);
              transform: scaleX(1.2);
            }
            div::-webkit-scrollbar-thumb:active {
              background: rgba(148, 163, 184, 0.8);
            }
            div::-webkit-scrollbar-corner {
              background: transparent;
            }

            /* Modern floating effect */
            div:hover::-webkit-scrollbar-thumb {
              background: rgba(148, 163, 184, 0.5);
              box-shadow: 0 0 6px rgba(148, 163, 184, 0.2);
            }
          `}</style>

          <AIAssistantAnimation
            isVisible={showAnimation}
            onComplete={() => setShowAnimation(false)}
          />

          <AnimatePresence>
            {/* Empty states */}
            {!showAnimation && messages.length === 0 && (
              <EmptyState hasDocuments={hasDocuments} />
            )}

            {/* Messages */}
            {!showAnimation &&
              messages.map((message) => (
                <ChatMessageComponent key={message.id} message={message} />
              ))}
            
            {/* Streaming message */}
            {!showAnimation && isStreaming && (
              <StreamingMessage
                content={streamingContent}
                isStreaming={isStreaming}
                onStreamComplete={() => {
                  // Stream completion is handled by the useStreamingChat hook
                }}
              />
            )}
          </AnimatePresence>

          {/* Loading indicator */}
          {!showAnimation && isLoading && !isStreaming && (
            <LoadingIndicator
              currentUserQuery={currentUserQuery}
              loadingMessageIndex={loadingMessageIndex}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        canChat={canChat}
        hasDocuments={hasDocuments}
        isSmallScreen={isSmallScreen}
        user={mapUserToChatUser(user)}
        enableStreaming={enableStreaming}
        onToggleStreaming={setEnableStreaming}
        isStreaming={isStreaming}
        onAbortStream={abortStream}
      />
    </div>
  );
}