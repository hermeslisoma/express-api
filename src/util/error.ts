//Function to send error status and message
export function sendError(errorStatus, errorMessage){
    return {
        errorStatus: errorStatus,
        errorMessage: errorMessage
    }
}