const NameInput = ({ value, onChange, placeholder = "Enter your name" }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium">Name:</label>
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

export default NameInput;
