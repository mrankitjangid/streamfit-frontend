const JoinForm = ({ onSubmit, room, setRoom, name, setName }) => {
    return (
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
                onClick={onSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
            >
                Join Room
            </button>
        </div>
    );
};

export default JoinForm;
