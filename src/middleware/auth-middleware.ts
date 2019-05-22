import jwt from 'jsonwebtoken'
import { secretKey } from './session-middleware';

//Middleware to check if user is authorized to access resources 
export function authorization(authRole?:string, authId?:string){
    return (req, res, next) => {   

        if (!((authRole && authRole === req.decoded.role) || 
                (authId && ((+req.params[authId] === +req.decoded.id) || 
                    (+req.body[authId] === +req.decoded.id))))){
                        res.sendStatus(403)
        }
        req.authorized = authRole
        next()        
    }
}

//Middleware to Check if user is authenticated
export function authentication(){
    return (req, res, next) => {   
        try{
        let token = req.headers['x-access-token']         

        if(!token)
            res.status(401).send('No token provided')

        let decoded = jwt.verify(token, secretKey.secret)
        req.decoded = decoded

        next()
    } catch(e){
        res.status(400).send('Failed to authenticate token.')
    }          
    }
}
