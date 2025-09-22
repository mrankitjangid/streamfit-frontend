const RoomInput = ({ value, onChange, placeholder = "Enter room ID" }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium">Room Id:</label>
            <input
                type="text"
                className="w-full mt-1 p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
};

export default RoomInput;
