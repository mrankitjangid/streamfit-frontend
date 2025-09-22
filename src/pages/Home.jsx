import { useNavigate } from 'react-router-dom';

import { useJoinForm } from '../hooks/useJoinForm';
import JoinForm from '../components/home/JoinForm';

const Home = () => {
    const { room, setRoom, name, setName } = useJoinForm();
    const navigate = useNavigate();

    const joinRoom = (e) => {
        e.preventDefault();
        const path = `/room/${ room }?name=${ name }`;
        navigate(path);
    };

    return (
        <div className="flex items-center justify-center min-h-screen w-screen bg-gray-900 text-white">
            <JoinForm
                onSubmit={joinRoom}
                room={room}
                setRoom={setRoom}
                name={name}
                setName={setName}
            />
        </div>
    );
};

export default Home;
