
export function sendError(errorStatus, errorMessage){
    return {
        errorStatus: errorStatus,
        errorMessage: errorMessage
    }
}