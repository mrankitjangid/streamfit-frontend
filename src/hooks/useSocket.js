import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useError } from '../contexts/ErrorContext';
import { useErrorHandler } from './useErrorHandler';

export const useSocket = (name, room_id) => {
    const socketRef = useRef(null);
    const navigate = useNavigate();
    const { addError, removeError, clearErrors } = useError();
    const { handleSocketError, handleGenericError } = useErrorHandler();

    // Connection state management
    const connectionStateRef = useRef({
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectDelay: 1000
    });

    // Reconnection logic
    const attemptReconnection = useCallback(() => {
        const state = connectionStateRef.current;

        if (state.reconnectAttempts >= state.maxReconnectAttempts) {
            handleSocketError(
                new Error('Maximum reconnection attempts reached'),
                'max-reconnect-attempts'
            );
            navigate('/');
            return;
        }

        state.reconnectAttempts++;
        state.isConnecting = true;

        const errorId = addError(
            'SOCKET_CONNECTION_FAILED',
            `Attempting to reconnect... (${state.reconnectAttempts}/${state.maxReconnectAttempts})`,
            { attempt: state.reconnectAttempts }
        );

        setTimeout(() => {
            if (socketRef.current) {
                socketRef.current.connect();
            }
        }, state.reconnectDelay);

        // Exponential backoff
        state.reconnectDelay = Math.min(state.reconnectDelay * 2, 30000);
    }, [addError, handleSocketError, navigate]);

    // Reset connection state
    const resetConnectionState = useCallback(() => {
        connectionStateRef.current = {
            isConnected: false,
            isConnecting: false,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5,
            reconnectDelay: 1000
        };
        clearErrors();
    }, [clearErrors]);

    useEffect(() => {
        // Validate required parameters
        if (!name || !room_id) {
            handleGenericError(new Error('Name and room ID are required'), 'missing-parameters');
            navigate('/');
            return;
        }

        resetConnectionState();

        // Create socket with enhanced configuration
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
        socketRef.current = io(socketUrl, {
            timeout: 10000, // 10 second timeout
            reconnection: false, // We'll handle reconnection manually
            forceNew: true
        });

        // Enhanced request method with error handling
        socketRef.current.request = function (type, data = {}) {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Request timeout: ${type}`));
                }, 10000);

                socketRef.current.emit(type, data, (res) => {
                    clearTimeout(timeout);

                    if (res?.error) {
                        const error = new Error(res.error.message || 'Request failed');
                        error.type = res.error.type;
                        error.context = res.error.context;
                        reject(error);
                    } else {
                        resolve(res);
                    }
                });
            });
        };

        // Connection event handlers
        socketRef.current.on('connect', () => {
            console.log('Socket connected successfully');
            connectionStateRef.current.isConnected = true;
            connectionStateRef.current.isConnecting = false;
            connectionStateRef.current.reconnectAttempts = 0;
            connectionStateRef.current.reconnectDelay = 1000;

            // Clear any connection errors
            clearErrors();

            // Send hello message
            socketRef.current.emit('hello-server', {}, ({ message }) => {
                console.log('Server saying:', message);
            });
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            connectionStateRef.current.isConnecting = false;

            const errorId = handleSocketError(error, 'connection-error');

            // Attempt reconnection if not at max attempts
            if (connectionStateRef.current.reconnectAttempts < connectionStateRef.current.maxReconnectAttempts) {
                setTimeout(() => {
                    attemptReconnection();
                }, connectionStateRef.current.reconnectDelay);
            }
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            connectionStateRef.current.isConnected = false;

            if (reason === 'io server disconnect') {
                // Server initiated disconnect - don't reconnect
                handleSocketError(new Error('Disconnected by server'), 'server-disconnect');
            } else {
                // Client or network disconnect - attempt reconnection
                handleSocketError(new Error(`Connection lost: ${reason}`), 'client-disconnect');
                attemptReconnection();
            }
        });

        socketRef.current.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            connectionStateRef.current.isConnected = true;
            connectionStateRef.current.isConnecting = false;
        });

        socketRef.current.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
            handleSocketError(error, 'reconnection-error');
        });

        socketRef.current.on('reconnect_failed', () => {
            console.error('Socket reconnection failed');
            handleSocketError(
                new Error('Failed to reconnect after maximum attempts'),
                'reconnection-failed'
            );
            navigate('/');
        });

        // Initial connection attempt
        connectionStateRef.current.isConnecting = true;
        socketRef.current.connect();

        // Cleanup function
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            resetConnectionState();
        };
    }, [name, room_id, navigate, handleSocketError, clearErrors, resetConnectionState, attemptReconnection, addError]);

    // Get connection status
    const getConnectionStatus = useCallback(() => {
        return {
            isConnected: connectionStateRef.current.isConnected,
            isConnecting: connectionStateRef.current.isConnecting,
            reconnectAttempts: connectionStateRef.current.reconnectAttempts,
            maxReconnectAttempts: connectionStateRef.current.maxReconnectAttempts
        };
    }, []);

    // Manual reconnection method
    const reconnect = useCallback(() => {
        if (socketRef.current) {
            resetConnectionState();
            socketRef.current.connect();
        }
    }, [resetConnectionState]);

    return {
        socket: socketRef.current,
        getConnectionStatus,
        reconnect
    };
};
