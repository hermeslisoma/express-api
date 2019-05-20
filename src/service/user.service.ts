import { login, getAllUsers, getUserById, patchUser, getReimbursementByStatus, getReimbursementByUser, postReimbursement, patchReimbursement } from "../dao/user.dao";
import { reimb } from "../state";
import { sqlReimbursementToJs, sqlUserToJsUser } from "../util/user-converter";
import { sendError } from "../util/error";


export async function loginService(username:string, password:string){
    let user = await login(username, password)
    if(user && user.rows.length)
        return sqlUserToJsUser(user.rows[0])
    else return sendError(true, 'Invalid Credentials')
}

export async function getAllUsersService(){
    let allUsers = await getAllUsers()

    if(allUsers && allUsers.rows.length)
            return allUsers.rows.map(sqlUserToJsUser)
    else return sendError(true, 'Users not found')
}

export async function getUserByIdService(id){
    let userById = await getUserById(id)

    if(userById && userById.rows.length)
            return sqlUserToJsUser(userById.rows[0])
    else return sendError(true, 'User not found')
}

export async function patchUserService(body){
    return await patchUser(body)
}

export async function getReimbursementByStatusService(req){
    let reimbByStatus = await getReimbursementByStatus(req)

    if(reimbByStatus && reimbByStatus.rows.length)
        return reimbByStatus.rows.map(sqlReimbursementToJs)
    else return sendError(true, 'Reimbursements not found')
}

export async function getReimbursementByUserService(req){
    let reimbByUser = await getReimbursementByUser(req)

    if(reimbByUser && reimbByUser.rows.length)
        return reimbByUser.rows.map(sqlReimbursementToJs)
    else return sendError(true, 'Reimbursements not found')
}

export async function postReimbursementService(req){
    let reimbInserted = await postReimbursement(req)
    
    if(reimbInserted && reimbInserted.rows.length)
            return sqlReimbursementToJs(reimbInserted.rows[0])
    else return sendError(true, 'Cannot get the inserted reimbursement')
}

export async function patchReimbursementService(req){
    let reimbPatch = await patchReimbursement(req)

    if(reimbPatch && reimbPatch.rows.length)
        return sqlReimbursementToJs(reimbPatch.rows[0])
    else return sendError(true, 'Cannot get the patched reimbursement')
}