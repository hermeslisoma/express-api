import { PoolClient } from "pg";
import { connectionPool } from ".";
import { jsUserToSqlUser } from "../util/user-converter";
import { sendError } from "../util/error";
import bcrypt from 'bcrypt'

//Login with hashed password comparison
export async function login(username:string, password:string){
    let client:PoolClient
    let result, match
    try{
        client = await connectionPool.connect()      
        result = await client.query(`SELECT * FROM "ers".users u INNER JOIN "ers".roles r
                                    ON u.roleId = r.roleId WHERE u.username=$1`,
                                            [username])
        if(result.rows && !result.rows.length)
            return sendError(true, 'Incorrect username')
        
        match = await bcrypt.compare(password, result.rows[0].pass)

        if(!match)
            return sendError(true, 'Invalid credentials')

        return result
    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

//Get all users with optional pagaing and sorting
export async function getAllUsers(page){
    let client:PoolClient
    let result, query, count
    try{
        client = await connectionPool.connect()

        query = `SELECT * FROM "ers".users u INNER JOIN "ers".roles r ON u.roleid = r.roleid `
        let inc = 1
        let queryArray = []

        if(!page.sort){
            query += `ORDER BY u.userid `
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

        count = await client.query(`SELECT COUNT(*) FROM "ers".users`)
        return [result,count]

    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

//Find user by id
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

//insert a new user in the database
export async function createUser(body){
    let client:PoolClient
    let role = 'trainee'
    let roleId, query, result, getNewUser, genSalt, hashString

    try{
        client = await connectionPool.connect()
        roleId = await client.query(`SELECT * FROM "ers".roles WHERE userrole=$1`,[role])        

    if(roleId.rows && roleId.rows.length)
        body.role = roleId.rows[0].roleid    

    genSalt = await bcrypt.genSalt()
    
    hashString = await bcrypt.hash(body.password, genSalt)     
    
    query = `INSERT INTO "ers".users(username, pass, firstname, lastname, email, roleid)
            VALUES($1,$2,$3,$4,$5,$6) RETURNING userid`
    
    result = await client.query(query, [body.username, hashString, body.firstName, body.lastName,
                body.email, body.role])
        
    if(result.rows && !result.rows.length){
        return sendError(true, 'User creation error')
    }

    return getUserById(result.rows[0].userid)

    }catch(e){
        return sendError(true, 'Internal error')
    }finally{
        client && client.release()
    }
}

//Update existing user
export async function patchUser(body){
    let client:PoolClient
    let emptyQuery = true
    try {      
        client = await connectionPool.connect()
        
        let userid = await client.query('SELECT userid FROM "ers".users WHERE userid=$1',[body.userId])               

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
        let inc = 1
        let queryArray = []
        for(let key in userdto){
            if(key !== 'userId' && userdto[key]){
                query += `${key} = $${inc}, `
                inc++
                queryArray.push(userdto[key])
                emptyQuery = false
            }
        }

        queryArray.push(body.userId)
        query = query.replace(/,\s*$/, '')
        query += ` WHERE userid=$${inc}`        

        if(emptyQuery){
            return sendError(true, 'Nothing to patch')
        }

        let result = await client.query(query,queryArray)
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