import { useState } from 'react';

export const useJoinForm = () => {
    const [room, setRoom] = useState('');
    const [name, setName] = useState('');

    return {
        room,
        setRoom,
        name,
        setName
    };
};
