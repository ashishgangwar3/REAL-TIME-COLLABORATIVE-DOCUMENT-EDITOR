
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:4000'; // Change if backend runs elsewhere

function App() {
  const [docId] = useState('my-document');  // static document id
  const [content, setContent] = useState('');
  const socketRef = useRef();

  useEffect(() => {
    // Connect to backend socket
    socketRef.current = io(SERVER_URL);

    // Join document room
    socketRef.current.emit('join-document', docId);

    // Load initial content
    socketRef.current.on('load-document', (documentContent) => {
      setContent(documentContent);
    });

    // Listen for changes from others
    socketRef.current.on('receive-changes', (delta) => {
      setContent(delta);
    });

    // Save document every 2 seconds
    const interval = setInterval(() => {
      socketRef.current.emit('save-document', docId, content);
    }, 2000);

    return () => {
      clearInterval(interval);
      socketRef.current.disconnect();
    };
  }, [docId, content]);

  // Handle local text changes
  function handleChange(e) {
    const newContent = e.target.value;
    setContent(newContent);

    // Send changes to server
    socketRef.current.emit('send-changes', docId, newContent);
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      <h1>Real-Time Collaborative Editor</h1>
      <textarea
        style={{ width: '100%', height: '400px' }}
        value={content}
        onChange={handleChange}
        placeholder="Start editing..."
      />
    </div>
  );
}

export default App;
