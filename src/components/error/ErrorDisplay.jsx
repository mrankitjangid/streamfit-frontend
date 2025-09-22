import { useError } from '../../contexts/ErrorContext';
import { ERROR_SEVERITY } from '../../utils/error/errorTypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

const ErrorDisplay = ({ className = '' }) => {
    const { errors, removeError, clearErrors } = useError();

    if (errors.length === 0) {
        return null;
    }

    // Group errors by severity
    const criticalErrors = errors.filter(error => error.severity === ERROR_SEVERITY.CRITICAL);
    const highErrors = errors.filter(error => error.severity === ERROR_SEVERITY.HIGH);
    const mediumErrors = errors.filter(error => error.severity === ERROR_SEVERITY.MEDIUM);
    const lowErrors = errors.filter(error => error.severity === ERROR_SEVERITY.LOW);

    const getErrorIcon = (severity) => {
        switch (severity) {
            case ERROR_SEVERITY.CRITICAL:
                return <FontAwesomeIcon icon={fas.faExclamationTriangle} className="text-red-400" />;
            case ERROR_SEVERITY.HIGH:
                return <FontAwesomeIcon icon={fas.faExclamationCircle} className="text-orange-400" />;
            case ERROR_SEVERITY.MEDIUM:
                return <FontAwesomeIcon icon={fas.faInfoCircle} className="text-yellow-400" />;
            case ERROR_SEVERITY.LOW:
                return <FontAwesomeIcon icon={fas.faInfo} className="text-blue-400" />;
            default:
                return <FontAwesomeIcon icon={fas.faInfo} className="text-gray-400" />;
        }
    };

    const getErrorStyles = (severity) => {
        switch (severity) {
            case ERROR_SEVERITY.CRITICAL:
                return 'bg-red-900 border-red-700 text-red-100';
            case ERROR_SEVERITY.HIGH:
                return 'bg-orange-900 border-orange-700 text-orange-100';
            case ERROR_SEVERITY.MEDIUM:
                return 'bg-yellow-900 border-yellow-700 text-yellow-100';
            case ERROR_SEVERITY.LOW:
                return 'bg-blue-900 border-blue-700 text-blue-100';
            default:
                return 'bg-gray-900 border-gray-700 text-gray-100';
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <div className={`fixed top-4 left-4 z-50 space-y-2 ${className}`}>
            {/* Critical Errors */}
            {criticalErrors.map((error) => (
                <div
                    key={error.id}
                    className={`border-l-4 p-4 rounded-lg shadow-lg max-w-sm ${getErrorStyles(error.severity)}`}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                            {getErrorIcon(error.severity)}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">Critical Error</p>
                            <p className="text-sm mt-1">{error.message}</p>
                            {error.details && (
                                <details className="mt-2">
                                    <summary className="text-xs cursor-pointer hover:underline">
                                        Technical Details
                                    </summary>
                                    <pre className="text-xs mt-1 bg-black bg-opacity-20 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(error.details, null, 2)}
                                    </pre>
                                </details>
                            )}
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-xs opacity-75">
                                    {formatTimestamp(error.timestamp)}
                                </span>
                                <button
                                    onClick={() => removeError(error.id)}
                                    className="text-xs hover:underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* High Priority Errors */}
            {highErrors.map((error) => (
                <div
                    key={error.id}
                    className={`border-l-4 p-3 rounded shadow-md max-w-sm ${getErrorStyles(error.severity)}`}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-2">
                            {getErrorIcon(error.severity)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm">{error.message}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs opacity-75">
                                    {formatTimestamp(error.timestamp)}
                                </span>
                                <button
                                    onClick={() => removeError(error.id)}
                                    className="text-xs hover:underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Medium Priority Errors */}
            {mediumErrors.map((error) => (
                <div
                    key={error.id}
                    className={`border-l-4 p-3 rounded shadow max-w-sm ${getErrorStyles(error.severity)}`}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-2">
                            {getErrorIcon(error.severity)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm">{error.message}</p>
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={() => removeError(error.id)}
                                    className="text-xs hover:underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Low Priority Errors */}
            {lowErrors.length > 0 && (
                <div className={`border-l-4 p-3 rounded shadow max-w-sm ${getErrorStyles(ERROR_SEVERITY.LOW)}`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-2">
                            {getErrorIcon(ERROR_SEVERITY.LOW)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm">
                                {lowErrors.length === 1
                                    ? lowErrors[0].message
                                    : `${lowErrors.length} notifications`
                                }
                            </p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs opacity-75">
                                    {formatTimestamp(lowErrors[0].timestamp)}
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={clearErrors}
                                        className="text-xs hover:underline"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ErrorDisplay;
