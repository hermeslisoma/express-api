import { login, getAllUsers, getUserById, patchUser, createUser } from "../dao/user.dao";
import { sqlUserToJsUser } from "../util/user-converter";
import { sendError } from "../util/error";

//Service to handle response after login
export async function loginService(username:string, password:string){
    let user = await login(username, password)    

    if(!user['errorStatus'])
        return sqlUserToJsUser(user.rows[0])
    
    return user
}

//Service to handle response after request to get all users
export async function getAllUsersService(query){
    let allUsers:any = await getAllUsers(query)      

    if(allUsers && allUsers[0].rows && allUsers[0].rows.length)
            return [allUsers[0].rows.map(sqlUserToJsUser), allUsers[1].rows[0].count, allUsers[2], allUsers[3]]
    else return sendError(true, 'Users not found')
}

//Service to handle response after request to get user by id
export async function getUserByIdService(id){
    let userById = await getUserById(id)

    if(userById.rows && userById.rows.length)
            return sqlUserToJsUser(userById.rows[0])
    return sendError(true, 'User not found')
}

//Service to handle response after updating a user
export async function patchUserService(body){
    let patchedUser = await patchUser(body)
    
    if (patchedUser.rows && patchedUser.rows.length)
        return sqlUserToJsUser(patchedUser.rows[0])
    else return patchedUser
}

//Service to handle response after creating a new user
export async function createUserService(body){
    let newUser = await createUser(body)
    
    if(newUser.rows && newUser.rows.length)
        return sqlUserToJsUser(newUser.rows[0])
    else return newUser
}
