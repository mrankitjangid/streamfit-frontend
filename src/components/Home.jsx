import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [room, setRoom] = useState('');
    const [name, setName] = useState('');

    const navigate = useNavigate();

    const joinRoom = (e) => {
        e.preventDefault();
        const path = `/room/${ room }?name=${ name }`;
        navigate(path);
    };

    return (
        <div className="flex items-center justify-center min-h-screen w-screen bg-gray-900 text-white">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg w-96">
                <h2 className="text-2xl font-semibold text-center mb-4">Join a Room</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Room Id:</label>
                    <input
                        type="text"
                        className="w-full mt-1 p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="Enter room ID"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Name:</label>
                    <input
                        type="text"
                        className="w-full mt-1 p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                    />
                </div>
                <button
                    onClick={joinRoom}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
                >
                    Join Room
                </button>
            </div>
        </div>
    );
};

export default Home;
