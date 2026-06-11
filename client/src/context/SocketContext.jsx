import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (!isSignedIn) {
      setToken(null);
      return;
    }

    const fetchToken = async () => {
      try {
        const t = await getToken();
        setToken(t);
      } catch (err) {
        console.error('Socket token retrieval failed:', err);
      }
    };

    fetchToken();
  }, [isSignedIn, getToken]);

  useEffect(() => {
    // If no token is present, ensure any active socket is disconnected
    if (!token) {
      if (socket) {
        console.log('🔌 Disconnecting socket connection due to token removal...');
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
    const socketUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
    console.log(`🔌 Attempting secure Socket.io connection to: ${socketUrl}`);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('🟢 Secure Socket.io connection established successfully! 🎉');
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`🔴 Socket disconnected: ${reason}`);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🧹 Cleaning up socket instance...');
      socketInstance.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
