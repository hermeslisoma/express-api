import { PoolClient, Client, Pool } from "pg";
import { connectionPool } from ".";
import { sqlUserToJsUser, jsUserToSqlUser, sqlReimbursementToJs, jsReimbToSqlReimb } from "../util/user-converter";
import { roles, reimbTypes } from "../state";
import { UserDTO } from "../dto/user.dto";
import { sendError } from "../util/error";
import { Resolver } from "dns";
import moment = require("moment");


export async function login(username:string, password:string){
    let client:PoolClient
    let result
    try{
        client = await connectionPool.connect()      
        result = await client.query(`SELECT * FROM "ers".users u INNER JOIN "ers".roles r
                                    ON u.roleId = r.roleId WHERE u.username=$1 AND u.pass=$2`,
                                            [username, password])

        return result
    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

export async function getAllUsers(){
    let client:PoolClient
    let result
    try{
        client = await connectionPool.connect()
        let query = 'SELECT * FROM "ers".users u INNER JOIN "ers".roles r ON u.roleid = r.roleid'
        result = await client.query(query)

        return result

    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

export async function getUserById(id){
    let client:PoolClient
    let result
    try{
        client = await connectionPool.connect()
        let query = `SELECT * FROM "ers".users u INNER JOIN "ers".roles r ON u.roleid = r.roleid
                                WHERE u.userid=$1`
        result = await client.query(query,[id])

        return result
    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

export async function patchUser(body){
    let client:PoolClient
    let emptyQuery = true
    try {      
        client = await connectionPool.connect()
        
        let userid = await client.query('SELECT userid FROM "ers".users WHER userid=$1',[body.userId])       

        if(userid && !userid.rows.length){
            return sendError(true, 'Invalid user id')
        }

        if(body.role){
            let role = await client.query('SELECT * FROM "ers".roles WHERE userRole=$1',[body.role])
            if(role && !role.rows.length){
                return sendError(true, 'Invalid role')
            }
    
            body.role = role.rows[0].roleid
        }

        let userdto = jsUserToSqlUser(body)
        let query = `UPDATE "ers".users SET `

        for(let key in userdto){
            if(key !== 'userId' && userdto[key]){
                query += `${key} = '${userdto[key]}', `
                emptyQuery = false
            }
        }

        query = query.replace(/,\s*$/, '')
        query += ` WHERE userid=$1`

        if(emptyQuery){
            return sendError(true, 'Nothing to patch')
        }

        let result = await client.query(query,[body.userId])
        if(!result.rowCount){
            return sendError(true, 'Nothing patched')
        }

        return await getUserById(body.userId)

    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

export async function getReimbursementByStatus(req){
    let client:PoolClient
    let statusId:number = +req.params.statusId
    let {start, end}  = req.query
    let reimbByStatus
    try{     
        client = await connectionPool.connect()
        
        if(!start && !end){    
            reimbByStatus = await client.query(`SELECT * FROM "ers".reimbursements WHERE statusid=$1`,
                                            [statusId])
        } else if(start && !end){  
            reimbByStatus = await client.query(`SELECT * FROM "ers".reimbursements WHERE statusid=$1
                                        AND dateSubmitted>=$2 ORDER BY dateSubmitted`,[statusId, start])
            
        } else if(!start && end){ 
            reimbByStatus = await client.query(`SELECT * FROM "ers".reimbursements WHERE statusid=$1 AND 
                                            dateResolved<=$2 ORDER BY dateResolved`,[statusId, end])
        } else {
            reimbByStatus = await client.query(`SELECT * FROM "ers".reimbursements WHERE statusid=$1 AND
                                        dateSubmitted>=$2 AND dateResolved<=$3 
                                        ORDER BY dateSubmitted, dateResolved`,[statusId, start, end])
        }

        return reimbByStatus

    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

export async function getReimbursementByUser(req){
    let client:PoolClient
    let userId:number = +req.params.userId
    let {start, end} = req.query
    let reimbByUser
    try{    
        client = await connectionPool.connect()

        if(!start && !end){    
            reimbByUser = await client.query(`SELECT * FROM "ers".reimbursements WHERE author=$1`,[userId])
        } else if(start && !end){  
            reimbByUser = await client.query(`SELECT * FROM "ers".reimbursements WHERE author=$1
                                        AND dateSubmitted >= $2`,[userId,start])
        } else if(!start && end){ 
            reimbByUser = await client.query(`SELECT * FROM "ers".reimbursements WHERE author=$1
                                        AND dateResolved<=$2`,[userId,end]) 
        } else {
            reimbByUser = await client.query(`SELECT * FROM "ers".reimbursements WHERE author=$1
                                        AND dateSubmitted >=$2 AND dateResolved<=$3`,[userId,start, end])
        }

        return reimbByUser

    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

export async function postReimbursement(req){
    let client:PoolClient
    let {body} = req  
    let status = 'Pending'
    let statusId, reimbType, resolver, result, getReimb  

    try{
        client = await connectionPool.connect()
        
    if(body.type !== undefined){
        reimbType = await client.query(`SELECT * FROM "ers".reimbursementTypes WHERE typeId=$1`,
                                    [body.type])
        
        if(reimbType && !reimbType.rows.length)
            return sendError(true, 'Invalid reimbursement type value')
    }

    resolver = await client.query(`SELECT userId FROM "ers".users u INNER JOIN "ers".roles r 
                                ON u.roleId = r.roleId WHERE r.userrole=$1`,[req.authorized])

    if(resolver && resolver.rows.length)
        body.resolver = resolver.rows[0].userid

    statusId = await client.query(`SELECT * FROM "ers".reimbursementStatus WHERE status=$1`,[status])

    if(statusId && statusId.rows.length)
        body.status = statusId.rows[0].statusid  
    
    let query = `INSERT INTO "ers".reimbursements (author, amount, dateSubmitted, dateResolved,
                description, resolver, statusId, typeId) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
                RETURNING reimbursementid`

    result = await client.query(query,[body.author, body.amount, body.dateSubmitted, body.dateResolved,
                        body.description, body.resolver, body.status, body.type])
    
    if(result && !result.rows.length){
        return sendError(true, 'Reimbursement insertion error')
    }  

    getReimb = await client.query(`SELECT * FROM "ers".reimbursements WHERE reimbursementid=$1`,
                                    [result.rows[0].reimbursementid])
        
    return getReimb

    }catch(e){
        return sendError(true,'Internal error')
    }finally{
        client && client.release()
    }
}

export async function patchReimbursement(req){
    let client:PoolClient
    let {body} = req
    let emptyQuery = true
    let getReimb

    try{
        client = await connectionPool.connect()

        let reimbId = await client.query(`SELECT reimbursementid FROM "ers".reimbursements 
                                    WHERE reimbursementid=$1`,[+body.reimbursementId])
        
        if(reimbId && !reimbId.rows.length)
            return sendError(true, 'Reimbursement id does not exist')

        if(body.resolver !== undefined){
            let reimbResolv = await client.query(`SELECT * FROM "ers".users u INNER JOIN "ers".roles r 
            ON u.userid = $1 AND r.userrole=$2`,[+body.resolver, req.authorized])
            
            if(reimbResolv && !reimbResolv.rows.length)
                return sendError(true, 'Invalid resolver value.')
        }

        if(body.status !== undefined){
            let reimbStatus = await client.query(`SELECT * FROM "ers".reimbursementStatus 
                        WHERE statusId = $1`,[+body.status])
            
            if(reimbStatus && !reimbStatus.rows.length)
                return sendError(true, 'Invalid reimbursement status value.')
        }

        if(body.type !== undefined){
            let reimbType = await client.query(`SELECT * FROM "ers".reimbursementTypes 
                        WHERE typeId = $1`,[+body.type])
            
            if(reimbType && !reimbType.rows.length)
                return sendError(true, 'Invalid reimbursement type value.')
        }
        
        let reimbdto =  jsReimbToSqlReimb(body)
        
        let query = `UPDATE "ers".reimbursements SET `

        for(let key in reimbdto){
            if(key !== 'dateSubmitted' && key !== 'reimbursementId' && reimbdto[key]){                  
                query += `${key} = '${reimbdto[key]}', `
                emptyQuery = false
            }
        }

        query = query.replace(/,\s*$/, '')
        query += ` WHERE reimbursementid=$1`

        if(emptyQuery){
            return sendError(true, 'Nothing to patch')
        }

        let result = await client.query(query,[body.reimbursementId])
        
        if(!result.rowCount){
            return sendError(true, 'Nothing patched')
        }
    
        getReimb = await client.query(`SELECT * FROM "ers".reimbursements WHERE reimbursementid=$1`,
                                        [body.reimbursementId])            
        return getReimb

    }catch(e){        
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}