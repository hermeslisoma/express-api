import { getReimbursementByStatus, getReimbursementByUser, postReimbursement, patchReimbursement, getAllReimbursements, getReimbursementById } from "../dao/reimbursement.dao";
import { sqlReimbursementToJs } from "../util/user-converter";
import { sendError } from "../util/error";

//Service to handle all reimbursement result
export async function getAllReimbursementsService(query){
    let allReimbursements:any = await getAllReimbursements(query)       

    if(allReimbursements[0].rows && allReimbursements[0].rows.length)
            return [allReimbursements[0].rows.map(sqlReimbursementToJs), allReimbursements[1].rows[0].count]
    else return sendError(true, 'Users not found')
}

//Service to handle reimbursement by status
export async function getReimbursementByStatusService(req){
    let reimbByStatus = await getReimbursementByStatus(req)

    if(reimbByStatus.rows && reimbByStatus.rows.length)
        return reimbByStatus.rows.map(sqlReimbursementToJs)
    else return sendError(true, 'Reimbursements not found')
}

//Service to handle reimbursement by user
export async function getReimbursementByUserService(req){
    let reimbByUser = await getReimbursementByUser(req)

    if(reimbByUser.rows && reimbByUser.rows.length)
        return reimbByUser.rows.map(sqlReimbursementToJs)
    else return sendError(true, 'Reimbursements not found')
}

//Service to handle the return value after posting a reimbursement
export async function postReimbursementService(req){
    let reimbInserted = await postReimbursement(req)
    if(reimbInserted.rows && reimbInserted.rows.length)
        return sqlReimbursementToJs(reimbInserted.rows[0])
    return reimbInserted
}

//Service to handle response after request to get reimbursement by id
export async function getReimbursementByIdService(id){
    let reimbById = await getReimbursementById(id)

    if(reimbById.rows && reimbById.rows.length)
            return sqlReimbursementToJs(reimbById.rows[0])
    return sendError(true, 'Reimbursement not found')
}

//Service to handle the return value after updating a reimbursement
export async function patchReimbursementService(req){
    let reimbPatch = await patchReimbursement(req)
    if(reimbPatch.rows && reimbPatch.rows.length)
        return sqlReimbursementToJs(reimbPatch.rows[0])
    return reimbPatch
}