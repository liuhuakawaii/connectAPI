import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
// import { getEndpoint } from "./net";

export const useWebSocket = (initialPath) => {
  const socketRef = useRef(null);
  const subscriptionRef = useRef(null);
  const [status, setSocketStatus] = useState('disconnected');
  const BASE_URL = 'https://hyperhuman.deemos.com/api'
  const deFaultpath = BASE_URL + initialPath;
  const maxReconnectAttempts = 5;
  const [shouldReconnect, setShouldReconnect] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback((subscription, uuid) => {
    if (reconnectAttempts < maxReconnectAttempts) {
      console.log('reconnectAttempts', reconnectAttempts);
      initSocket(subscription, uuid);
      socketRef.current?.connect();
      setReconnectAttempts((attempts) => attempts + 1);
    }
  }, [reconnectAttempts]);

  const initSocket = useCallback((subscription, uuid) => {
    if (socketRef.current) {
      disconnect();
    }
    subscriptionRef.current = subscription; // 更新当前的subscription
    socketRef.current = io(deFaultpath, {
      query: {
        subscription,
      },
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      setSocketStatus('connected');
      if (uuid) {
        socketRef.current.emit('query', uuid);
      }
      console.log('Connected to WebSocket');
    });

    socketRef.current.on('disconnect', () => {
      setSocketStatus('disconnected');
      console.log('Disconnected from WebSocket');
    });

    socketRef.current.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }, []);

  const query = useCallback((uuid) => {
    socketRef.current.emit('query', uuid);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off();
      socketRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    // 当status变为"failed"，尝试重连
    if (status === 'failed' && shouldReconnect) {
      const reconnectDelay = 5000;
      setTimeout(() => {
        connect(subscriptionRef.current);
      }, reconnectDelay);
    } else if (status === 'disconnected') {
      setShouldReconnect(false); // 一旦断开连接，禁用重连，直到下一个`failed`状态
    }
  }, [status, shouldReconnect, connect]);

  const onMessage = useCallback((event, callback, onFailed) => {
    if (socketRef.current) {
      socketRef.current.on(event, (data, res) => {
        console.log('---message-id:---', data);
        console.log('---message-result:---', res);
        setReconnectAttempts(prevReconnectAttempts => {
          if (res?.jobStatus === 'Failed') {  //Failed  Running
            console.log('Failed - current reconnect attempts', prevReconnectAttempts);
            if (prevReconnectAttempts >= maxReconnectAttempts) {
              setTimeout(() => {
                setShouldReconnect(true);
                setSocketStatus('failed');
              }, 1500);
              onFailed && onFailed();
              return prevReconnectAttempts;
            }
            return prevReconnectAttempts + 1;
          }
          return prevReconnectAttempts;
        });
        return callback(data, res);
      });
    }
  }, []);

  useEffect(() => {
    if (reconnectAttempts > maxReconnectAttempts && status === 'failed') {
      console.log('failed after max reconnect attempts');
      disconnect();
    }
  }, [reconnectAttempts, status, disconnect]);

  return { status, connect, query, setSocketStatus, disconnect, onMessage, setReconnectAttempts };
};