import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

const MediaControls = ({
    onExitRoom,
    onToggleVoice,
    onToggleVideo,
    onToggleScreen,
    openVoiceRef,
    openVideoRef,
    openScreenRef
}) => {
    return (
        <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button className="btn-control bg-red-600 hover:bg-red-700" onClick={onExitRoom}>
                <FontAwesomeIcon icon={fas.faArrowLeft} /> Exit
            </button>

            <button className="btn-control bg-blue-600 hover:bg-blue-700" onClick={onToggleVoice}>
                <FontAwesomeIcon icon={openVoiceRef.current ? fas.faMicrophone : fas.faMicrophoneSlash} />
                {openVoiceRef.current ? "Mute Audio" : "Unmute Audio"}
            </button>

            <button className="btn-control bg-green-600 hover:bg-green-700" onClick={onToggleVideo}>
                <FontAwesomeIcon icon={openVideoRef.current ? fas.faVideo : fas.faVideoSlash} />
                {openVideoRef.current ? "Disable Video" : "Enable Video"}
            </button>

            <button className="btn-control bg-purple-600 hover:bg-purple-700" onClick={onToggleScreen}>
                <FontAwesomeIcon icon={openScreenRef.current ? fas.faDisplay : fas.faDisplay} />
                {openScreenRef.current ? "Stop Screen Share" : "Share Screen"}
            </button>
        </div>
    );
};

export default MediaControls;
