const RoomHeader = ({ onExitRoom }) => {
    return (
        <div className="flex justify-center mb-8">
            <button
                className="btn-control bg-red-600 hover:bg-red-700"
                onClick={onExitRoom}
            >
                Exit Room
            </button>
        </div>
    );
};

export default RoomHeader;
