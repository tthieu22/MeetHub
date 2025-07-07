import { useEffect, useRef, useCallback } from "react";

interface UseChatScrollProps {
  messages: unknown[];
  isLoading?: boolean;
}

export const useChatScroll = ({
  messages,
  isLoading = false,
}: UseChatScrollProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = useRef(true);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll to bottom instantly (without animation)
  const scrollToBottomInstant = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  // Check if user is scrolled to bottom
  const checkIfScrolledToBottom = useCallback(() => {
    if (!containerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 100; // 100px threshold
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, []);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    isScrolledToBottom.current = checkIfScrolledToBottom();
  }, [checkIfScrolledToBottom]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && isScrolledToBottom.current && !isLoading) {
      scrollToBottomInstant();
    }
  }, [messages, isLoading, scrollToBottomInstant]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      scrollToBottomInstant();
    }
  }, [messages.length, isLoading, scrollToBottomInstant]);

  return {
    messagesEndRef,
    containerRef,
    scrollToBottom,
    scrollToBottomInstant,
    isScrolledToBottom: isScrolledToBottom.current,
    handleScroll,
  };
};
