import { Component } from 'react';
import { ERROR_TYPES, ERROR_SEVERITY } from '../../utils/error/errorTypes';
import { useError } from '../../contexts/ErrorContext';

class ErrorBoundaryClass extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Report error to error context if available
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            // Render custom error UI
            return this.props.fallback || (
                <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
                    <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md">
                        <h2 className="text-xl font-bold text-red-100 mb-4">
                            Something went wrong
                        </h2>
                        <p className="text-red-200 mb-4">
                            An unexpected error occurred. Please refresh the page and try again.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// HOC wrapper to use hooks in class component
const ErrorBoundary = (props) => {
    const { addError } = useError();

    const handleError = (error, errorInfo) => {
        // Add critical error to global error state
        addError(
            ERROR_TYPES.DEVICE_LOAD_FAILED,
            'A critical application error occurred. Please refresh the page.',
            {
                originalError: error.message,
                componentStack: errorInfo.componentStack
            }
        );
    };

    return <ErrorBoundaryClass {...props} onError={handleError} />;
};

export default ErrorBoundary;
