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
   
        query = `SELECT * FROM "ers".reimbursements r INNER JOIN "ers".reimbursementstatus s 
                    ON r.statusid = s.statusid INNER JOIN "ers".reimbursementtypes t 
                    ON r.typeid = t.typeid INNER JOIN "ers".users u ON r.author = u.userid 
                    INNER JOIN "ers".roles l ON u.roleid = l.roleid `
        let inc = 1
        let queryArray = []

        if(!page.sort){
            query += `ORDER BY reimbursementid `
        }

        if(!page.limit && !page.offset){
            query += `LIMIT 10 OFFSET 0 `
        } else if (page.limit && !page.offset){
            query += `LIMIT $${inc} `
            queryArray.push(page.limit)
            inc++
        } else if(page.limit && page.offset){
            query += `LIMIT $${inc} OFFSET $${inc+1} `
            queryArray.push(page.limit, page.offset)
            inc++
        }
  
        result = await client.query(query, queryArray)

        if(page.sort && result.rows && result.rows.length){
            let sortBy = page.sort
            result.rows.sort((u1,u2) => (u1[sortBy] < u2[sortBy])? -1 : 
                                            (u1[sortBy] > u2[sortBy])? 1 : 0);
        }

        count = await client.query(`SELECT COUNT(*) FROM "ers".reimbursements`)
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
        queryStatus += `SELECT * FROM "ers".reimbursements r INNER JOIN "ers".reimbursementstatus s 
        ON r.statusid = s.statusid INNER JOIN "ers".reimbursementtypes t 
        ON r.typeid = t.typeid INNER JOIN "ers".users u ON r.author = u.userid 
        INNER JOIN "ers".roles l ON u.roleid = l.roleid `
        if(!start && !end){
            queryStatus += `WHERE r.statusid=$1 `   
            reimbByStatus = await client.query(queryStatus,[statusId])
        } else if(start && !end){ 
            queryStatus += `WHERE r.statusid=$1 AND r.dateSubmitted>=$2 ORDER BY r.dateSubmitted `
            reimbByStatus = await client.query(queryStatus,[statusId, start])
            
        } else if(!start && end){ 
            queryStatus += `WHERE r.statusid=$1 AND r.dateResolved<=$2 ORDER BY r.dateResolved `
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
        queryStatus += `SELECT * FROM "ers".reimbursements r INNER JOIN "ers".reimbursementstatus s 
        ON r.statusid = s.statusid INNER JOIN "ers".reimbursementtypes t 
        ON r.typeid = t.typeid INNER JOIN "ers".users u ON r.author = u.userid 
        INNER JOIN "ers".roles l ON u.roleid = l.roleid `
        if(!start && !end){ 
            queryStatus += `WHERE r.author=$1 `  
            reimbByUser = await client.query(queryStatus,[userId])
        } else if(start && !end){ 
            queryStatus += `WHERE r.author=$1 AND r.dateSubmitted >= $2 ` 
            reimbByUser = await client.query(queryStatus,[userId,start])
        } else if(!start && end){ 
            queryStatus += `WHERE r.author=$1 AND r.dateResolved<=$2 `
            reimbByUser = await client.query(queryStatus,[userId,end]) 
        } else {
            queryStatus += `WHERE r.author=$1 AND r.dateSubmitted >=$2 AND r.dateResolved<=$3 `
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

    getReimb = await client.query(`SELECT * FROM "ers".reimbursements r INNER JOIN "ers".reimbursementstatus s 
                            ON r.statusid = s.statusid INNER JOIN "ers".reimbursementtypes t 
                            ON r.typeid = t.typeid INNER JOIN "ers".users u ON r.author = u.userid 
                            INNER JOIN "ers".roles l ON u.roleid = l.roleid WHERE reimbursementid=$1 `,
                                    [result.rows[0].reimbursementid])
        
    return getReimb

    }catch(e){
        return sendError(true,'Internal error')
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
    
        getReimb = await client.query(`SELECT * FROM "ers".reimbursements r INNER JOIN "ers".reimbursementstatus s 
                                    ON r.statusid = s.statusid INNER JOIN "ers".reimbursementtypes t 
                                ON r.typeid = t.typeid INNER JOIN "ers".users u ON r.author = u.userid 
                            INNER JOIN "ers".roles l ON u.roleid = l.roleid  WHERE reimbursementid=$1`,
                                        [body.reimbursementId])            
        return getReimb

    }catch(e){        
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}