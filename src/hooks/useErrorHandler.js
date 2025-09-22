import { useCallback } from 'react';
import { useError } from '../contexts/ErrorContext';
import { ERROR_TYPES } from '../utils/error/errorTypes';

export const useErrorHandler = () => {
    const { addError, removeError, clearErrors, errors } = useError();

    // Handle socket connection errors
    const handleSocketError = useCallback((error, context = '') => {
        console.error('Socket error:', error);

        let errorType = ERROR_TYPES.SOCKET_CONNECTION_FAILED;
        let customMessage = null;

        if (error.message?.includes('timeout')) {
            errorType = ERROR_TYPES.SOCKET_TIMEOUT;
        } else if (error.message?.includes('disconnect')) {
            errorType = ERROR_TYPES.SOCKET_DISCONNECTED;
        }

        return addError(errorType, customMessage, {
            originalError: error.message,
            context
        });
    }, [addError]);

    // Handle media device errors
    const handleMediaError = useCallback((error, deviceType) => {
        console.error(`${deviceType} error:`, error);

        let errorType = ERROR_TYPES.CAMERA_NOT_FOUND;
        let customMessage = null;

        if (deviceType === 'camera') {
            if (error.name === 'NotAllowedError') {
                errorType = ERROR_TYPES.CAMERA_PERMISSION_DENIED;
            } else if (error.name === 'NotFoundError') {
                errorType = ERROR_TYPES.CAMERA_NOT_FOUND;
            }
        } else if (deviceType === 'microphone') {
            if (error.name === 'NotAllowedError') {
                errorType = ERROR_TYPES.MICROPHONE_PERMISSION_DENIED;
            } else if (error.name === 'NotFoundError') {
                errorType = ERROR_TYPES.MICROPHONE_NOT_FOUND;
            }
        } else if (deviceType === 'screen') {
            errorType = ERROR_TYPES.SCREEN_SHARE_FAILED;
        }

        return addError(errorType, customMessage, {
            originalError: error.message,
            deviceType
        });
    }, [addError]);

    // Handle room joining errors
    const handleRoomError = useCallback((error, roomId) => {
        console.error('Room error:', error);

        let errorType = ERROR_TYPES.ROOM_JOIN_FAILED;
        let customMessage = null;

        if (error.message?.includes('not found')) {
            errorType = ERROR_TYPES.ROOM_NOT_FOUND;
        } else if (error.message?.includes('full')) {
            errorType = ERROR_TYPES.ROOM_FULL;
        }

        return addError(errorType, customMessage, {
            originalError: error.message,
            roomId
        });
    }, [addError]);

    // Handle WebRTC errors
    const handleWebRTCError = useCallback((error, operation) => {
        console.error('WebRTC error:', error);

        let errorType = ERROR_TYPES.DEVICE_LOAD_FAILED;
        let customMessage = null;

        if (operation === 'transport') {
            errorType = ERROR_TYPES.TRANSPORT_CREATE_FAILED;
        } else if (operation === 'producer') {
            errorType = ERROR_TYPES.PRODUCER_CREATE_FAILED;
        } else if (operation === 'consumer') {
            errorType = ERROR_TYPES.CONSUMER_CREATE_FAILED;
        }

        return addError(errorType, customMessage, {
            originalError: error.message,
            operation
        });
    }, [addError]);

    // Handle network errors
    const handleNetworkError = useCallback((error) => {
        console.error('Network error:', error);

        return addError(ERROR_TYPES.NETWORK_ERROR, null, {
            originalError: error.message
        });
    }, [addError]);

    // Handle validation errors
    const handleValidationError = useCallback((field, value) => {
        let errorType = ERROR_TYPES.EMPTY_FIELDS;
        let customMessage = null;

        if (field === 'roomId') {
            if (!value) {
                errorType = ERROR_TYPES.EMPTY_FIELDS;
                customMessage = 'Room ID is required';
            } else if (value.length < 3) {
                errorType = ERROR_TYPES.INVALID_ROOM_ID;
            }
        } else if (field === 'name') {
            if (!value) {
                errorType = ERROR_TYPES.EMPTY_FIELDS;
                customMessage = 'Name is required';
            } else if (value.length < 2 || value.length > 50) {
                errorType = ERROR_TYPES.INVALID_NAME;
            }
        }

        return addError(errorType, customMessage, {
            field,
            value: value ? value.substring(0, 20) + '...' : ''
        });
    }, [addError]);

    // Handle generic errors
    const handleGenericError = useCallback((error, context = '') => {
        console.error('Generic error:', error);

        return addError(ERROR_TYPES.NETWORK_ERROR, null, {
            originalError: error.message,
            context
        });
    }, [addError]);

    // Retry mechanism for failed operations
    const retryOperation = useCallback(async (operation, maxRetries = 3) => {
        let lastErrorId = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                // Clear any previous errors on success
                if (lastErrorId) {
                    removeError(lastErrorId);
                }
                return result;
            } catch (error) {
                lastErrorId = handleGenericError(error, `Attempt ${attempt}/${maxRetries}`);

                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }

        throw new Error(`Operation failed after ${maxRetries} attempts`);
    }, [handleGenericError, removeError]);

    // Clear specific error types
    const clearErrorType = useCallback((errorType) => {
        const errorsToRemove = errors.filter(error => error.type === errorType);
        errorsToRemove.forEach(error => removeError(error.id));
    }, [errors, removeError]);

    return {
        handleSocketError,
        handleMediaError,
        handleRoomError,
        handleWebRTCError,
        handleNetworkError,
        handleValidationError,
        handleGenericError,
        retryOperation,
        clearErrorType,
        clearErrors
    };
};

export default useErrorHandler;
