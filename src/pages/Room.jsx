import { useRef, useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import * as mediasoupClient from 'mediasoup-client';

import { useSocket } from '../hooks/useSocket';
import { useRoomState } from '../hooks/useRoomState';
import { useErrorHandler } from '../hooks/useErrorHandler';
import RoomClient from '../utils/Room';
import MediaControls from '../components/room/MediaControls';
import LocalMediaArea from '../components/room/LocalMediaArea';
import RemoteMediaArea from '../components/room/RemoteMediaArea';
import ConnectionStatus from '../components/room/ConnectionStatus';

const Room = () => {
    const socketRef = useRef(null);
    const roomClientRef = useRef(null);

    // Get the room id and User Name from the URL
    const [searchParams] = useSearchParams();
    const name = searchParams.get('name');
    const { room_id } = useParams();

    const navigate = useNavigate();

    // Use enhanced hooks
    const { socket, reconnect } = useSocket(name, room_id);
    const { openVoiceRef, openVideoRef, openScreenRef, forceRerender } = useRoomState();
    const { handleGenericError } = useErrorHandler();

    // Store socket reference
    socketRef.current = socket;

    // State to hold local and remote media streams for rendering
    const [localStreams, setLocalStreams] = useState([]);
    const [remoteStreams, setRemoteStreams] = useState([]);

    useEffect(() => {
        if (!socket) return;

        const initializeRoom = async () => {
            try {
                // Create room client with error handler
                roomClientRef.current = new RoomClient(
                    room_id,
                    name,
                    socket,
                    mediasoupClient
                );

                // Listen for local stream updates
                roomClientRef.current.onLocalStreamUpdate = (streams) => {
                    setLocalStreams(streams);
                };

                // Listen for remote stream updates
                roomClientRef.current.onRemoteStreamUpdate = (streams) => {
                    setRemoteStreams(streams);
                };

                console.log('Initializing room client...');
                await roomClientRef.current.joinRoom();
                console.log('Room client initialized successfully');
            } catch (error) {
                console.error('Failed to initialize room:', error);
                handleGenericError(error, 'room-initialization');
            }
        };

        initializeRoom();

        return () => {
            if (roomClientRef.current) {
                roomClientRef.current.exit();
            }
        }
    }, [socket, room_id, name, handleGenericError]);

    const exitRoomHandler = () => {
        if (roomClientRef.current) {
            roomClientRef.current.exit();
        }
        navigate('/');
    }

    const toggleVoiceHandler = async () => {
        const newState = !openVoiceRef.current;
        openVoiceRef.current = newState;
        forceRerender();

        try {
            if (newState) {
                console.log('Enabling audio...');
                await roomClientRef.current.produce('audio');
                console.log('Audio enabled successfully');
            } else {
                console.log('Disabling audio...');
                roomClientRef.current.closeProducer('audio');
                console.log('Audio disabled successfully');
            }
        } catch (error) {
            console.error('Audio toggle failed:', error);
            openVoiceRef.current = !newState; // Revert state
            forceRerender();
            handleGenericError(error, 'audio-toggle');
        }
    }

    const toggleVideoHandler = async () => {
        const newState = !openVideoRef.current;
        openVideoRef.current = newState;
        forceRerender();

        try {
            if (newState) {
                console.log('Enabling video...');
                const result = await roomClientRef.current.produce('video');
                console.log('Video enabled successfully:', result);
            } else {
                console.log('Disabling video...');
                roomClientRef.current.closeProducer('video');
                console.log('Video disabled successfully');
            }
        } catch (error) {
            console.error('Video toggle failed:', error);
            openVideoRef.current = !newState; // Revert state
            forceRerender();

            // Provide specific error messages based on error type
            let errorMessage = 'Failed to toggle video';
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Camera permission denied. Please allow camera access and try again.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = 'Camera is already in use by another application.';
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                errorMessage = 'Camera does not support the required video quality.';
            } else if (error.message.includes('Failed to get video stream')) {
                errorMessage = 'Unable to access camera. Please check camera permissions and try again.';
            } else if (error.message.includes('OperationError') || error.message.includes('createOffer')) {
                errorMessage = 'WebRTC connection failed. This may be due to codec incompatibility or network issues.';
            }

            handleGenericError(new Error(errorMessage), 'video-toggle');
        }
    }

    const toggleScreenHandler = async () => {
        const newState = !openScreenRef.current;
        openScreenRef.current = newState;
        forceRerender();

        try {
            if (newState) {
                console.log('Enabling screen share...');
                await roomClientRef.current.produce('screen');
                console.log('Screen share enabled successfully');
            } else {
                console.log('Disabling screen share...');
                roomClientRef.current.closeProducer('screen');
                console.log('Screen share disabled successfully');
            }
        } catch (error) {
            console.error('Screen share toggle failed:', error);
            openScreenRef.current = !newState; // Revert state
            forceRerender();
            handleGenericError(error, 'screen-toggle');
        }
    }

    const handleReconnect = async () => {
        try {
            if (roomClientRef.current) {
                await roomClientRef.current.reconnect();
            } else {
                await reconnect();
            }
        } catch (error) {
            console.error('Reconnection failed:', error);
            handleGenericError(error, 'manual-reconnect');
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {/* Connection Status */}
            <ConnectionStatus
                socket={socket}
                roomClient={roomClientRef.current}
                onReconnect={handleReconnect}
            />

            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">
                    Room: {room_id}
                </h1>

                {/* Media Controls */}
                <MediaControls
                    onExitRoom={exitRoomHandler}
                    onToggleVoice={toggleVoiceHandler}
                    onToggleVideo={toggleVideoHandler}
                    onToggleScreen={toggleScreenHandler}
                    openVoiceRef={openVoiceRef}
                    openVideoRef={openVideoRef}
                    openScreenRef={openScreenRef}
                />

                {/* Local Media */}
                <LocalMediaArea localStreams={localStreams} />

                {/* Remote Media */}
                <RemoteMediaArea remoteStreams={remoteStreams} />

                <div id="audioEl"></div>
            </div>
        </div>
    );
}

export default Room;
