import { User } from "../models/user";
import { Role } from "../models/role";
import { UserDTO, ReimbursementDTO } from "../dto/user.dto";
import { Reimbursement } from "../models/reimbursement";
import { ReimbursementType } from "../models/reimbursement-type";
import { ReimbursementStatus } from "../models/reimbursement-status";
import moment = require("moment");

//Converter from sql user object to js user object
export function sqlUserToJsUser(sqluser){
    let role:Role = {
        roleId: sqluser.roleid,
        role: sqluser.userrole
    }

    let user = new User(sqluser.userid, sqluser.username, '', sqluser.firstname, sqluser.lastname, 
        sqluser.email, role)
    delete user.password
    return user
}

//Converter from js user object to sql user object
export function jsUserToSqlUser(user){
    return new UserDTO(user.userId, user.username, user.password, user.firstName, user.lastName,
                        user.email, user.role)
}

//Converter from sql reimbursement object to js reimbursement object
export function sqlReimbursementToJs(sqlreimb){   
    let status:ReimbursementStatus = {
        statusId: sqlreimb.statusid,
        status: sqlreimb.status
    }
    let type:ReimbursementType = {
        typeId: sqlreimb.typeid,
        type: sqlreimb.typereimb
    }
    let author:User = {
        userId: sqlreimb.authoruserid,
        username: sqlreimb.authorusername,
        password: '',
        firstName: sqlreimb.authorfirstname,
        lastName: sqlreimb.authorlastname,
        email: sqlreimb.authoremail,
        role: {
            roleId: sqlreimb.authorroleid,
            role: sqlreimb.authorrole
        }
    }
    let resolver:User = {
        userId: sqlreimb.resolveruserid,
        username: sqlreimb.resolverusername,
        password: '',
        firstName: sqlreimb.resolverfirstname,
        lastName: sqlreimb.resolverlastname,
        email: sqlreimb.resolveremail,
        role: {
            roleId: sqlreimb.resolverroleid,
            role: sqlreimb.resolverrole
        }
    }
    delete author.password
    delete resolver.password
    return new Reimbursement(sqlreimb.reimbursementid, author, sqlreimb.amount, 
                            moment(sqlreimb.datesubmitted).format('YYYY-MM-DD'),
                            moment(sqlreimb.dateresolved).format('YYYY-MM-DD'),
                            sqlreimb.description, resolver, status, type)
}

//Converter from js reimbursement object to sql reimbursement object
export function jsReimbToSqlReimb(jsReimb){
    return new ReimbursementDTO(jsReimb.reimbursementId, jsReimb.author, jsReimb.amount,
        jsReimb.dateSubmitted, jsReimb.dateResolved, jsReimb.description, 
        jsReimb.resolver, jsReimb.status, jsReimb.type)
}