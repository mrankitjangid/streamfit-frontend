import { createContext, useContext, useReducer, useCallback } from 'react';
import { ERROR_TYPES, ERROR_SEVERITY, ERROR_SEVERITY_MAP } from '../utils/error/errorTypes';

// Error state
const initialState = {
    errors: [],
    isOnline: true,
    retryCount: 0
};

// Error actions
const ERROR_ACTIONS = {
    ADD_ERROR: 'ADD_ERROR',
    REMOVE_ERROR: 'REMOVE_ERROR',
    CLEAR_ERRORS: 'CLEAR_ERRORS',
    SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
    INCREMENT_RETRY: 'INCREMENT_RETRY',
    RESET_RETRY: 'RESET_RETRY'
};

// Error reducer
const errorReducer = (state, action) => {
    switch (action.type) {
        case ERROR_ACTIONS.ADD_ERROR:
            return {
                ...state,
                errors: [...state.errors, action.payload]
            };

        case ERROR_ACTIONS.REMOVE_ERROR:
            return {
                ...state,
                errors: state.errors.filter(error => error.id !== action.payload)
            };

        case ERROR_ACTIONS.CLEAR_ERRORS:
            return {
                ...state,
                errors: []
            };

        case ERROR_ACTIONS.SET_ONLINE_STATUS:
            return {
                ...state,
                isOnline: action.payload
            };

        case ERROR_ACTIONS.INCREMENT_RETRY:
            return {
                ...state,
                retryCount: state.retryCount + 1
            };

        case ERROR_ACTIONS.RESET_RETRY:
            return {
                ...state,
                retryCount: 0
            };

        default:
            return state;
    }
};

// Create context
const ErrorContext = createContext();

// Error provider component
export const ErrorProvider = ({ children }) => {
    const [state, dispatch] = useReducer(errorReducer, initialState);

    // Add error with automatic ID generation
    const addError = useCallback((type, customMessage = null, details = null) => {
        const error = {
            id: Date.now() + Math.random(),
            type,
            message: customMessage || getErrorMessage(type),
            severity: ERROR_SEVERITY_MAP[type] || ERROR_SEVERITY.MEDIUM,
            timestamp: new Date().toISOString(),
            details
        };

        dispatch({ type: ERROR_ACTIONS.ADD_ERROR, payload: error });

        // Auto-remove low severity errors after 5 seconds
        if (error.severity === ERROR_SEVERITY.LOW) {
            setTimeout(() => {
                dispatch({ type: ERROR_ACTIONS.REMOVE_ERROR, payload: error.id });
            }, 5000);
        }

        return error.id;
    }, []);

    // Remove specific error
    const removeError = useCallback((errorId) => {
        dispatch({ type: ERROR_ACTIONS.REMOVE_ERROR, payload: errorId });
    }, []);

    // Clear all errors
    const clearErrors = useCallback(() => {
        dispatch({ type: ERROR_ACTIONS.CLEAR_ERRORS });
    }, []);

    // Set online status
    const setOnlineStatus = useCallback((isOnline) => {
        dispatch({ type: ERROR_ACTIONS.SET_ONLINE_STATUS, payload: isOnline });
    }, []);

    // Increment retry count
    const incrementRetry = useCallback(() => {
        dispatch({ type: ERROR_ACTIONS.INCREMENT_RETRY });
    }, []);

    // Reset retry count
    const resetRetry = useCallback(() => {
        dispatch({ type: ERROR_ACTIONS.RESET_RETRY });
    }, []);

    // Get errors by severity
    const getErrorsBySeverity = useCallback((severity) => {
        return state.errors.filter(error => error.severity === severity);
    }, [state.errors]);

    // Check if there are critical errors
    const hasCriticalErrors = state.errors.some(error => error.severity === ERROR_SEVERITY.CRITICAL);

    // Get the latest error
    const latestError = state.errors[state.errors.length - 1];

    const value = {
        ...state,
        addError,
        removeError,
        clearErrors,
        setOnlineStatus,
        incrementRetry,
        resetRetry,
        getErrorsBySeverity,
        hasCriticalErrors,
        latestError
    };

    return (
        <ErrorContext.Provider value={value}>
            {children}
        </ErrorContext.Provider>
    );
};

// Custom hook to use error context
export const useError = () => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
};

// Helper function to get error message
const getErrorMessage = (errorType) => {
    const messages = {
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

    return messages[errorType] || 'An unexpected error occurred. Please try again.';
};

export default ErrorContext;
