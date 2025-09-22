import { useRef, useState } from 'react';

export const useRoomState = () => {
    const openVoiceRef = useRef(false);
    const openVideoRef = useRef(false);
    const openScreenRef = useRef(false);

    const [itIsWhatItIs, setForceRerender] = useState(false);

    const forceRerender = () => {
        setForceRerender(prev => !prev);
    };

    return {
        openVoiceRef,
        openVideoRef,
        openScreenRef,
        itIsWhatItIs,
        forceRerender
    };
};
