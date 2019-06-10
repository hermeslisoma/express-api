import { PoolClient } from "pg";
import { connectionPool } from ".";
import { jsReimbToSqlReimb } from "../util/user-converter";
import { sendError } from "../util/error";

//Get all reimbursements, optional query strings for paging and sorting
export async function getAllReimbursements(page){
    let client:PoolClient
    let result, query, count
    let sort = false
    try{
        client = await connectionPool.connect()
   
        query = `SELECT reimbursementid, author, amount, datesubmitted, dateresolved, description, 
                        resolver, s.statusid, t.typeid, status, typereimb, 
                        u.userid as authorUserId, u.username as authorUsername, u.pass as authorPassword, 
                        u.firstname as authorFirstName, u.lastname as authorLastName, 
                        u.email as authorEmail, u.roleid as authorRoleId, l.userrole as authorRole, 
                        v.userid as resolverUserId, v.username as resolverUsername, 
                        v.pass as resolverPassword, v.firstname as resolverFirstName, 
                        v.lastname as resolverFirstName, v.email as resolverEmail, 
                        v.roleid as resolverRoleId, e.userrole as resolverRole 
                        FROM "ers".reimbursements r 
                    INNER JOIN "ers".reimbursementstatus s ON r.statusid = s.statusid 
                    INNER JOIN "ers".reimbursementtypes t ON r.typeid = t.typeid 
                    INNER JOIN "ers".users u ON r.author = u.userid
                    INNER JOIN "ers".users v ON r.resolver = v.userid
                    INNER JOIN "ers".roles e ON v.roleid = e.roleid  
                    INNER JOIN "ers".roles l ON u.roleid = l.roleid `
        let inc = 1
        let queryArray = []

        if(page.status && !page.user){
            query += ` WHERE s.statusid = $${inc} `
            queryArray.push(page.status)
            inc++
        }

        if(page.user && !page.status){
            query += ` WHERE u.userid = $${inc} `
            queryArray.push(page.user)
            inc++
        }

        if(page.user && page.status){
            query += ` WHERE u.userid = $${inc} AND s.statusid = $${inc+1} `
            queryArray.push(page.user, page.status)
            inc++
        }

        if(!page.sort){
            query += `ORDER BY r.datesubmitted, r.dateResolved `
        }

        if(!page.limit && !page.offset){
            //query += `LIMIT 10 OFFSET 0 `
        } else if (page.limit && !page.offset){
            query += `LIMIT $${inc} `
            queryArray.push(page.limit)
            inc++
        } else if(page.limit && page.offset){
            query += `LIMIT $${inc} OFFSET $${inc+1} `
            queryArray.push(page.limit, page.offset)
            inc++
        } else if(!page.limit && page.offset){
            query += `LIMIT 10 OFFSET $${inc} `
            queryArray.push(page.offset)
            inc++
        }
  
        result = await client.query(query, queryArray)

        if(page.sort && result.rows && result.rows.length){
            let sortBy = page.sort
            result.rows.sort((u1,u2) => (u1[sortBy] < u2[sortBy])? -1 : 
                                            (u1[sortBy] > u2[sortBy])? 1 : 0);
        }

        count = await client.query(`SELECT COUNT(*) FROM "ers".reimbursements`)

        if(page.status && !page.user){
        count = await client.query(`SELECT COUNT(*) FROM "ers".reimbursements r
            WHERE r.statusid = $1`,[page.status])
        } 
        if(page.user && !page.status) {
            count = await client.query(`SELECT COUNT(*) FROM "ers".reimbursements r
                WHERE r.author = $1`,[page.user])
        }

        if(page.user && page.status){
            count = await client.query(`SELECT COUNT(*) FROM "ers".reimbursements r
            WHERE r.author = $1 AND r.statusid = $2`,[page.user, page.status])
        }
 
        return [result,count]

    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

//Get reimbursement by status, optional date range
export async function getReimbursementByStatus(req){
    let client:PoolClient
    let statusId:number = +req.params.statusId
    let {start, end}  = req.query
    let reimbByStatus
    let queryStatus = ''
    try{     
        client = await connectionPool.connect()
        queryStatus += `SELECT reimbursementid, author, amount, datesubmitted, dateresolved, description, 
                        resolver, s.statusid, t.typeid, status, typereimb, 
                        u.userid as authorUserId, u.username as authorUsername, u.pass as authorPassword, 
                        u.firstname as authorFirstName, u.lastname as authorLastName, 
                        u.email as authorEmail, u.roleid as authorRoleId, l.userrole as authorRole, 
                        v.userid as resolverUserId, v.username as resolverUsername, 
                        v.pass as resolverPassword, v.firstname as resolverFirstName, 
                        v.lastname as resolverFirstName, v.email as resolverEmail, 
                        v.roleid as resolverRoleId, e.userrole as resolverRole 
                        FROM "ers".reimbursements r 
                        INNER JOIN "ers".reimbursementstatus s ON r.statusid = s.statusid 
                        INNER JOIN "ers".reimbursementtypes t ON r.typeid = t.typeid 
                        INNER JOIN "ers".users u ON r.author = u.userid 
                        INNER JOIN "ers".users v ON r.resolver = v.userid
                        INNER JOIN "ers".roles e ON v.roleid = e.roleid 
                        INNER JOIN "ers".roles l ON u.roleid = l.roleid `
        if(!start && !end){
            queryStatus += `WHERE r.statusid=$1 ORDER BY r.dateSubmitted, r.dateResolved `   
            reimbByStatus = await client.query(queryStatus,[statusId])
        } else if(start && !end){ 
            queryStatus += `WHERE r.statusid=$1 AND r.dateSubmitted>=$2 ORDER BY r.dateSubmitted, r.dateResolved `
            reimbByStatus = await client.query(queryStatus,[statusId, start])
            
        } else if(!start && end){ 
            queryStatus += `WHERE r.statusid=$1 AND r.dateResolved<=$2 ORDER BY r.dateSubmitted, r.dateResolved `
            reimbByStatus = await client.query(queryStatus,[statusId, end])
        } else {
            queryStatus += `WHERE r.statusid=$1 AND r.dateSubmitted>=$2 AND r.dateResolved<=$3 
            ORDER BY r.dateSubmitted, r.dateResolved `
            reimbByStatus = await client.query(queryStatus,[statusId, start, end])
        }

        return reimbByStatus

    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

//Get reimbursement by user, optional date range
export async function getReimbursementByUser(req){
    let client:PoolClient
    let userId:number = +req.params.userId
    let {start, end} = req.query
    let reimbByUser
    let queryStatus = ''
    try{    
        client = await connectionPool.connect()
        queryStatus += `SELECT reimbursementid, author, amount, datesubmitted, dateresolved, description, 
                        resolver, s.statusid, t.typeid, status, typereimb, 
                        u.userid as authorUserId, u.username as authorUsername, u.pass as authorPassword, 
                        u.firstname as authorFirstName, u.lastname as authorLastName, 
                        u.email as authorEmail, u.roleid as authorRoleId, l.userrole as authorRole, 
                        v.userid as resolverUserId, v.username as resolverUsername, 
                        v.pass as resolverPassword, v.firstname as resolverFirstName, 
                        v.lastname as resolverFirstName, v.email as resolverEmail, 
                        v.roleid as resolverRoleId, e.userrole as resolverRole 
                        FROM "ers".reimbursements r 
                        INNER JOIN "ers".reimbursementstatus s ON r.statusid = s.statusid 
                        INNER JOIN "ers".reimbursementtypes t ON r.typeid = t.typeid 
                        INNER JOIN "ers".users u ON r.author = u.userid
                        INNER JOIN "ers".users v ON r.resolver = v.userid
                        INNER JOIN "ers".roles e ON v.roleid = e.roleid  
                        INNER JOIN "ers".roles l ON u.roleid = l.roleid `
        if(!start && !end){ 
            queryStatus += `WHERE r.author=$1 ORDER BY r.dateSubmitted, r.dateResolved `  
            reimbByUser = await client.query(queryStatus,[userId])
        } else if(start && !end){ 
            queryStatus += `WHERE r.author=$1 AND r.dateSubmitted >= $2 ORDER BY r.dateSubmitted, r.dateResolved ` 
            reimbByUser = await client.query(queryStatus,[userId,start])
        } else if(!start && end){ 
            queryStatus += `WHERE r.author=$1 AND r.dateResolved<=$2 ORDER BY r.dateSubmitted, r.dateResolved `
            reimbByUser = await client.query(queryStatus,[userId,end]) 
        } else {
            queryStatus += `WHERE r.author=$1 AND r.dateSubmitted >=$2 AND r.dateResolved<=$3 ORDER BY r.dateSubmitted, r.dateResolved `
            reimbByUser = await client.query(queryStatus,[userId,start, end])
        }

        return reimbByUser

    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

//Insert a new reimbursement
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

    if (['finance-manager','admin'].includes(req.authorized)){
        body.resolver = +req.decoded.id
    } else {
        resolver = await client.query(`SELECT userId FROM "ers".users u INNER JOIN "ers".roles r 
                                ON u.roleId = r.roleId WHERE r.userrole=$1`,['finance-manager'])
    if(resolver && resolver.rows.length)
        body.resolver = resolver.rows[0].userid
    }

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

    getReimb = await client.query(`SELECT reimbursementid, author, amount, datesubmitted, dateresolved, description, 
                            resolver, s.statusid, t.typeid, status, typereimb, 
                            u.userid as authorUserId, u.username as authorUsername, u.pass as authorPassword, 
                            u.firstname as authorFirstName, u.lastname as authorLastName, 
                            u.email as authorEmail, u.roleid as authorRoleId, l.userrole as authorRole, 
                            v.userid as resolverUserId, v.username as resolverUsername, 
                            v.pass as resolverPassword, v.firstname as resolverFirstName, 
                            v.lastname as resolverFirstName, v.email as resolverEmail, 
                            v.roleid as resolverRoleId, e.userrole as resolverRole 
                            FROM "ers".reimbursements r 
                            INNER JOIN "ers".reimbursementstatus s ON r.statusid = s.statusid 
                            INNER JOIN "ers".reimbursementtypes t ON r.typeid = t.typeid 
                            INNER JOIN "ers".users u ON r.author = u.userid 
                            INNER JOIN "ers".users v ON r.resolver = v.userid
                            INNER JOIN "ers".roles e ON v.roleid = e.roleid 
                            INNER JOIN "ers".roles l ON u.roleid = l.roleid WHERE reimbursementid=$1 
                            ORDER BY r.dateSubmitted, r.dateResolved `,
                                    [result.rows[0].reimbursementid])
        
    return getReimb

    }catch(e){
        return sendError(true,'Internal error')
    }finally{
        client && client.release()
    }
}

//Find reimbursement by id
export async function getReimbursementById(id){
    let client:PoolClient
    let result
    try{
        client = await connectionPool.connect()
        let query = `SELECT reimbursementid, author, amount, datesubmitted, dateresolved, description, 
                    resolver, s.statusid, t.typeid, status, typereimb, 
                    u.userid as authorUserId, u.username as authorUsername, u.pass as authorPassword, 
                    u.firstname as authorFirstName, u.lastname as authorLastName, 
                    u.email as authorEmail, u.roleid as authorRoleId, l.userrole as authorRole, 
                    v.userid as resolverUserId, v.username as resolverUsername, 
                    v.pass as resolverPassword, v.firstname as resolverFirstName, 
                    v.lastname as resolverFirstName, v.email as resolverEmail, 
                    v.roleid as resolverRoleId, e.userrole as resolverRole 
                    FROM "ers".reimbursements r 
                    INNER JOIN "ers".reimbursementstatus s ON r.statusid = s.statusid 
                    INNER JOIN "ers".reimbursementtypes t ON r.typeid = t.typeid 
                    INNER JOIN "ers".users u ON r.author = u.userid 
                    INNER JOIN "ers".users v ON r.resolver = v.userid
                    INNER JOIN "ers".roles e ON v.roleid = e.roleid 
                    INNER JOIN "ers".roles l ON u.roleid = l.roleid  WHERE reimbursementid=$1 
                    ORDER BY r.dateSubmitted, r.dateResolved `
        result = await client.query(query,[id])
        
        return result
    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

//Update a reimbursement
export async function patchReimbursement(req){
    let client:PoolClient
    let {body} = req
    let emptyQuery = true
    let getReimb
    body.resolver = +req.authUserId

    try{
        client = await connectionPool.connect()

        let reimbId = await client.query(`SELECT reimbursementid FROM "ers".reimbursements 
                                    WHERE reimbursementid=$1`,[+body.reimbursementId])
        
        if(reimbId && !reimbId.rows.length)
            return sendError(true, 'Reimbursement id does not exist')

        // let reimbResolv = await client.query(`SELECT * FROM "ers".users u INNER JOIN "ers".roles r 
        //     ON u.userid = $1 AND r.userrole=$2`,[body.resolver, req.authorized])

        let reimbResolv = await client.query(`SELECT * FROM "ers".users u INNER JOIN "ers".roles r 
                    ON u.userid = $1`,[body.resolver])
            
        if(reimbResolv && !reimbResolv.rows.length)
                return sendError(true, 'Invalid resolver value.')

        if(body.status !== undefined){
            let reimbStatus = await client.query(`SELECT * FROM "ers".reimbursementStatus 
                        WHERE statusid = $1`,[+body.status])
            //console.log(reimbStatus.rows[0].statusid);
            
            
            if(reimbStatus && !reimbStatus.rows.length)
                return sendError(true, 'Invalid reimbursement status value.')
            //else body.status = reimbStatus.rows[0].statusid
        }

        if(body.type !== undefined){
            let reimbType = await client.query(`SELECT * FROM "ers".reimbursementTypes 
                        WHERE typeId = $1`,[+body.type])
            
            if(reimbType && !reimbType.rows.length)
                return sendError(true, 'Invalid reimbursement type value.')
        }
        
        let reimbdto =  jsReimbToSqlReimb(body)
        
        let query = `UPDATE "ers".reimbursements SET `
        let inc = 1
        let queryArray = []

        for(let key in reimbdto){
            if(key !== 'dateSubmitted' && key !== 'reimbursementId' && reimbdto[key]){                  
                query += `${key} = $${inc}, `
                inc++
                queryArray.push(reimbdto[key])
                emptyQuery = false
            }
        }
        
        queryArray.push(body.reimbursementId)
        query = query.replace(/,\s*$/, '')
        query += ` WHERE reimbursementid=$${inc}`            

        if(emptyQuery){
            return sendError(true, 'Nothing to patch')
        }

        let result = await client.query(query,queryArray)
        
        if(!result.rowCount){
            return sendError(true, 'Nothing patched')
        }
    
        getReimb = await client.query(`SELECT reimbursementid, author, amount, datesubmitted, dateresolved, description, 
                                    resolver, s.statusid, t.typeid, status, typereimb, 
                                    u.userid as authorUserId, u.username as authorUsername, u.pass as authorPassword, 
                                    u.firstname as authorFirstName, u.lastname as authorLastName, 
                                    u.email as authorEmail, u.roleid as authorRoleId, l.userrole as authorRole, 
                                    v.userid as resolverUserId, v.username as resolverUsername, 
                                    v.pass as resolverPassword, v.firstname as resolverFirstName, 
                                    v.lastname as resolverFirstName, v.email as resolverEmail, 
                                    v.roleid as resolverRoleId, e.userrole as resolverRole 
                                    FROM "ers".reimbursements r 
                                    INNER JOIN "ers".reimbursementstatus s ON r.statusid = s.statusid 
                                    INNER JOIN "ers".reimbursementtypes t ON r.typeid = t.typeid 
                                    INNER JOIN "ers".users u ON r.author = u.userid 
                                    INNER JOIN "ers".users v ON r.resolver = v.userid
                                    INNER JOIN "ers".roles e ON v.roleid = e.roleid 
                                    INNER JOIN "ers".roles l ON u.roleid = l.roleid  WHERE reimbursementid=$1 
                                    ORDER BY r.dateSubmitted, r.dateResolved `,
                                        [body.reimbursementId])            
        return getReimb

    }catch(e){        
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}