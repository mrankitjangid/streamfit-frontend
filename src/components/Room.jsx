import { useRef } from 'react';
import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons'
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

import RoomClient from '../utils/Room';
import { useState } from 'react';

const Room = () => {

    const socketRef = useRef(null);
    const roomClientRef = useRef(null);

    // Get the room id and User Name from the URL
    const [searchParams] = useSearchParams();
    const name = searchParams.get('name');
    const { room_id } = useParams();

    const navigate = useNavigate();


    const openVoiceRef = useRef(false);
    const openVideoRef = useRef(false);
    const openScreenRef = useRef(false);

    const [, setForceRerender] = useState(false);


    useEffect(() => {
        socketRef.current = io('http://localhost:3000');

        if (!name || !room_id) {
            navigate('/');
        }

        socketRef.current.request = function (type, data = {}) {
            return new Promise((resolve, reject) => {
                socketRef.current.emit(type, data, (res) => {
                    if (res?.error) {
                        reject(res.error);
                    } else {
                        resolve(res);
                    }
                })
            });
        }

        socketRef.current.on('connection-success', async () => {
            roomClientRef.current = new RoomClient(room_id, name, socketRef.current, mediasoupClient);
            console.log(roomClientRef.current);
            await roomClientRef.current.joinRoom();
        });

        socketRef.current.emit('hello-server', {}, ({ message }) => {
            console.log('Server saying:', message);
        });


        return () => {
            socketRef.current?.disconnect();
        }
    }, [name, room_id, navigate]);

    const exitRoomHandler = () => {
        roomClientRef.current.exit();
        navigate('/');
    }

    const toggleVoiceHandler = () => {
        openVoiceRef.current = !openVoiceRef.current;
        forceRerender();
        if( openVoiceRef.current ) {
            roomClientRef.current.produce('audio');
        } else {
            roomClientRef.current.closeProducer('audio');
        }
    }

    const toggleVideoHandler = () => {
        openVideoRef.current = !openVideoRef.current;
        forceRerender();
        if( openVideoRef.current ) {
            roomClientRef.current.produce('video');
        } else {
            roomClientRef.current.closeProducer('video');
        }
    }

    const toggleScreenHandler = () => {
        openScreenRef.current = !openScreenRef.current;
        forceRerender();
        if( openScreenRef.current ) {
            roomClientRef.current.produce('screen');
        } else {
            roomClientRef.current.closeProducer('screen');
        }
    }

    const forceRerender = () => {
        setForceRerender(prev => !prev);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
            {/* Control Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
                <button className="btn-control bg-red-600 hover:bg-red-700" onClick={ exitRoomHandler }>
                    <FontAwesomeIcon icon={ fas.faArrowLeft } /> Exit
                </button>
                
                <button className="btn-control bg-blue-600 hover:bg-blue-700" onClick={ toggleVoiceHandler }>
                    <FontAwesomeIcon icon={ openVoiceRef.current ? fas.faMicrophone : fas.faMicrophoneSlash } /> 
                    { openVoiceRef.current ? "Mute Audio" : "Unmute Audio" }
                </button>

                <button className="btn-control bg-green-600 hover:bg-green-700" onClick={ toggleVideoHandler }>
                    <FontAwesomeIcon icon={ openVideoRef.current ? fas.faVideo : fas.faVideoSlash } /> 
                    { openVideoRef.current ? "Disable Video" : "Enable Video" }
                </button>

                <button className="btn-control bg-purple-600 hover:bg-purple-700" onClick={ toggleScreenHandler }>
                    <FontAwesomeIcon icon={ openScreenRef.current ? fas.faDisplay : fas.faDisplay } /> 
                    { openScreenRef.current ? "Stop Screen Share" : "Share Screen" }
                </button>
            </div>

            {/* Local Media */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-center">Your Streams</h2>
                <div id="localMedia" className="flex flex-wrap justify-center gap-6">
                    {/* {localMedia.map((stream, index) => (
                        <div key={index} className="media-card">
                            <video className="w-40 h-28 rounded-lg" autoPlay muted ref={(el) => el && (el.srcObject = stream)} />
                            <span className="text-sm">Local Stream {index + 1}</span>
                        </div>
                    ))} */}
                </div>
            </div>

            {/* Remote Media */}
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-center">Remote Participants</h2>
                <div id="remoteMedia" className="flex flex-wrap justify-center gap-6">
                    {/* {remoteMedia.map((stream, index) => (
                        <div key={index} className="media-card">
                            <video className="w-40 h-28 rounded-lg" autoPlay ref={(el) => el && (el.srcObject = stream)} />
                            <span className="text-sm">Remote Stream {index + 1}</span>
                        </div>
                    ))} */}
                </div>
            </div>

            <div id="audioEl"></div>
        </div>
    );
}

export default Room;