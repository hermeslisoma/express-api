import { User } from "../models/user";
import { Role } from "../models/role";
import { UserDTO, ReimbursementDTO } from "../dto/user.dto";
import { Reimbursement } from "../models/reimbursement";


export function sqlUserToJsUser(sqluser){
    let role:Role = {
        roleId: sqluser.roleid,
        role: sqluser.userrole
    }
    return new User(sqluser.userid, sqluser.username, sqluser.pass, sqluser.firstname, sqluser.lastname, 
        sqluser.email, role)
}

export function jsUserToSqlUser(user){
    return new UserDTO(user.userId, user.username, user.password, user.firstName, user.lastName,
                        user.email, user.role)
}

export function sqlReimbursementToJs(sqlreimb){
    return new Reimbursement(sqlreimb.reimbursementid, sqlreimb.author, sqlreimb.amount, 
                new Date(sqlreimb.datesubmitted).getTime(), new Date(sqlreimb.dateresolved).getTime(),
                    sqlreimb.description, sqlreimb.resolver, sqlreimb.statusid, sqlreimb.typeid)
}

export function jsReimbToSqlReimb(jsReimb){
    return new ReimbursementDTO(jsReimb.reimbursementId, jsReimb.author, jsReimb.amount,
        jsReimb.dateSubmitted, jsReimb.dateResolved, jsReimb.description, 
        jsReimb.resolver, jsReimb.statusId, jsReimb.typeId)
}