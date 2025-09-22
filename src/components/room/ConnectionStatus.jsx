import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

const ConnectionStatus = ({ socket, roomClient, onReconnect }) => {
    const [connectionStatus, setConnectionStatus] = useState({
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5
    });

    useEffect(() => {
        const updateStatus = () => {
            // Check socket connection status
            let isConnected = false;
            let isConnecting = false;
            let reconnectAttempts = 0;

            if (socket) {
                // Socket.io socket has a connected property
                isConnected = socket.connected || false;
                isConnecting = socket.connecting || false;

                // Try to get connection state from socket
                if (socket.io && socket.io.engine) {
                    reconnectAttempts = socket.io.engine.transport?.state || 0;
                }
            }

            // Check room client status if available
            if (roomClient && roomClient.socket) {
                isConnected = isConnected || roomClient.socket.connected || false;
            }

            setConnectionStatus({
                isConnected,
                isConnecting,
                reconnectAttempts,
                maxReconnectAttempts: 5
            });
        };

        updateStatus();
        const interval = setInterval(updateStatus, 1000);
        return () => clearInterval(interval);
    }, [socket, roomClient]);

    const getStatusColor = () => {
        if (connectionStatus.isConnected) return 'text-green-400';
        if (connectionStatus.isConnecting) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getStatusIcon = () => {
        if (connectionStatus.isConnected) return fas.faCheckCircle;
        if (connectionStatus.isConnecting) return fas.faSpinner;
        return fas.faExclamationTriangle;
    };

    const getStatusText = () => {
        if (connectionStatus.isConnected) return 'Connected';
        if (connectionStatus.isConnecting) return 'Connecting...';
        return 'Disconnected';
    };

    const handleReconnect = async () => {
        if (onReconnect) {
            try {
                await onReconnect();
            } catch (error) {
                console.error('Manual reconnection failed:', error);
            }
        }
    };

    return (
        <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-3">
                <FontAwesomeIcon
                    icon={getStatusIcon()}
                    className={`${getStatusColor()} ${connectionStatus.isConnecting ? 'animate-spin' : ''}`}
                />
                <div>
                    <div className="text-white font-medium">{getStatusText()}</div>
                    {!connectionStatus.isConnected && !connectionStatus.isConnecting && (
                        <div className="text-gray-400 text-sm">
                            Attempts: {connectionStatus.reconnectAttempts}/{connectionStatus.maxReconnectAttempts}
                        </div>
                    )}
                </div>
                {!connectionStatus.isConnected && !connectionStatus.isConnecting && (
                    <button
                        onClick={handleReconnect}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                        Reconnect
                    </button>
                )}
            </div>
        </div>
    );
};

export default ConnectionStatus;
