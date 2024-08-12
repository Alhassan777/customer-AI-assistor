"use client"; // Ensure this file is client-side only

import { Box, Button, Stack, TextField, CircularProgress } from '@mui/material';
import { useState, useRef, useEffect, useCallback } from 'react';
import withAuth from './hoc/withAuth';

function useScrollToBottom(messages) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return messagesEndRef;
}

function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm the Headstarter support assistant. How can I help you today?" },
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useScrollToBottom(messages);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);
    setMessage('');

    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '...' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      await reader.read().then(function processText({ done, value }) {
        if (done) return result;
        const text = decoder.decode(value || new Uint8Array(), { stream: true });

        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content === '...' ? text : lastMessage.content + text },
          ];
        });

        return reader.read().then(processText);
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((messages) => [
        ...messages.slice(0, messages.length - 1), // Remove the typing indicator if an error occurs
        { role: 'assistant', content: 'Sorry, something went wrong.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [message, isLoading, messages]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#121212" // Dark background
      color="#FFFFFF"   // Light text for better contrast
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        bgcolor="#1E1E1E" // Darker background for the chat area
        borderRadius="12px"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
        p={2}
        spacing={3}
        border="1px solid #333" // Subtle border
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
          px={1}
          py={2}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
              mb={2}
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? '#007AFF'  // Blue for assistant messages
                    : '#4CAF50'  // Green for user messages
                }
                color="white"
                borderRadius={16}
                p={2}
                maxWidth="75%" // Limit the width of the messages
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2} pt={1}>
          <TextField
            label="Type your message here…"
            variant="outlined"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            InputProps={{
              style: { color: '#FFFFFF', backgroundColor: '#333' }, // Darker input field
            }}
            InputLabelProps={{
              style: { color: '#BBBBBB' }, // Light label color
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            disabled={isLoading}
            style={{ minWidth: '100px', padding: '12px' }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default withAuth(Home);
