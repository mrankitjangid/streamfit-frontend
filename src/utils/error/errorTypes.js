// Error types for consistent error handling across the application
export const ERROR_TYPES = {
    // Socket errors
    SOCKET_CONNECTION_FAILED: 'SOCKET_CONNECTION_FAILED',
    SOCKET_DISCONNECTED: 'SOCKET_DISCONNECTED',
    SOCKET_TIMEOUT: 'SOCKET_TIMEOUT',

    // Room errors
    ROOM_JOIN_FAILED: 'ROOM_JOIN_FAILED',
    ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
    ROOM_FULL: 'ROOM_FULL',

    // Media device errors
    CAMERA_NOT_FOUND: 'CAMERA_NOT_FOUND',
    CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
    MICROPHONE_NOT_FOUND: 'MICROPHONE_NOT_FOUND',
    MICROPHONE_PERMISSION_DENIED: 'MICROPHONE_PERMISSION_DENIED',
    SCREEN_SHARE_FAILED: 'SCREEN_SHARE_FAILED',

    // WebRTC errors
    DEVICE_LOAD_FAILED: 'DEVICE_LOAD_FAILED',
    TRANSPORT_CREATE_FAILED: 'TRANSPORT_CREATE_FAILED',
    PRODUCER_CREATE_FAILED: 'PRODUCER_CREATE_FAILED',
    CONSUMER_CREATE_FAILED: 'CONSUMER_CREATE_FAILED',

    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    BANDWIDTH_INSUFFICIENT: 'BANDWIDTH_INSUFFICIENT',

    // Validation errors
    INVALID_ROOM_ID: 'INVALID_ROOM_ID',
    INVALID_NAME: 'INVALID_NAME',
    EMPTY_FIELDS: 'EMPTY_FIELDS'
};

// Error messages for user display
export const ERROR_MESSAGES = {
    [ERROR_TYPES.SOCKET_CONNECTION_FAILED]: 'Failed to connect to server. Please check your internet connection.',
    [ERROR_TYPES.SOCKET_DISCONNECTED]: 'Connection lost. Attempting to reconnect...',
    [ERROR_TYPES.SOCKET_TIMEOUT]: 'Connection timed out. Please try again.',

    [ERROR_TYPES.ROOM_JOIN_FAILED]: 'Failed to join room. Please try again.',
    [ERROR_TYPES.ROOM_NOT_FOUND]: 'Room not found. Please check the room ID.',
    [ERROR_TYPES.ROOM_FULL]: 'Room is full. Please try another room.',

    [ERROR_TYPES.CAMERA_NOT_FOUND]: 'Camera not found. Please connect a camera and try again.',
    [ERROR_TYPES.CAMERA_PERMISSION_DENIED]: 'Camera access denied. Please allow camera permissions and try again.',
    [ERROR_TYPES.MICROPHONE_NOT_FOUND]: 'Microphone not found. Please connect a microphone and try again.',
    [ERROR_TYPES.MICROPHONE_PERMISSION_DENIED]: 'Microphone access denied. Please allow microphone permissions and try again.',
    [ERROR_TYPES.SCREEN_SHARE_FAILED]: 'Screen sharing failed. Please try again.',

    [ERROR_TYPES.DEVICE_LOAD_FAILED]: 'Failed to load media device. Please refresh and try again.',
    [ERROR_TYPES.TRANSPORT_CREATE_FAILED]: 'Connection setup failed. Please try again.',
    [ERROR_TYPES.PRODUCER_CREATE_FAILED]: 'Failed to start media stream. Please check your device permissions.',
    [ERROR_TYPES.CONSUMER_CREATE_FAILED]: 'Failed to connect to participant. Please try again.',

    [ERROR_TYPES.NETWORK_ERROR]: 'Network error occurred. Please check your connection.',
    [ERROR_TYPES.BANDWIDTH_INSUFFICIENT]: 'Network bandwidth is insufficient for video streaming.',

    [ERROR_TYPES.INVALID_ROOM_ID]: 'Please enter a valid room ID.',
    [ERROR_TYPES.INVALID_NAME]: 'Please enter a valid name (2-50 characters).',
    [ERROR_TYPES.EMPTY_FIELDS]: 'Please fill in all required fields.'
};

// Error severity levels
export const ERROR_SEVERITY = {
    LOW: 'low',      // User can continue, just informational
    MEDIUM: 'medium', // Some functionality affected
    HIGH: 'high',     // Critical functionality broken
    CRITICAL: 'critical' // Application cannot continue
};

// Map error types to severity levels
export const ERROR_SEVERITY_MAP = {
    [ERROR_TYPES.SOCKET_CONNECTION_FAILED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.SOCKET_DISCONNECTED]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.SOCKET_TIMEOUT]: ERROR_SEVERITY.MEDIUM,

    [ERROR_TYPES.ROOM_JOIN_FAILED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.ROOM_NOT_FOUND]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.ROOM_FULL]: ERROR_SEVERITY.MEDIUM,

    [ERROR_TYPES.CAMERA_NOT_FOUND]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.CAMERA_PERMISSION_DENIED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.MICROPHONE_NOT_FOUND]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.MICROPHONE_PERMISSION_DENIED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.SCREEN_SHARE_FAILED]: ERROR_SEVERITY.MEDIUM,

    [ERROR_TYPES.DEVICE_LOAD_FAILED]: ERROR_SEVERITY.CRITICAL,
    [ERROR_TYPES.TRANSPORT_CREATE_FAILED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.PRODUCER_CREATE_FAILED]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.CONSUMER_CREATE_FAILED]: ERROR_SEVERITY.MEDIUM,

    [ERROR_TYPES.NETWORK_ERROR]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.BANDWIDTH_INSUFFICIENT]: ERROR_SEVERITY.MEDIUM,

    [ERROR_TYPES.INVALID_ROOM_ID]: ERROR_SEVERITY.LOW,
    [ERROR_TYPES.INVALID_NAME]: ERROR_SEVERITY.LOW,
    [ERROR_TYPES.EMPTY_FIELDS]: ERROR_SEVERITY.LOW
};
