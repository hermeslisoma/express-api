import jwt from 'jsonwebtoken'
import { secretKey } from './session-middleware';

//Middleware to check if user is authorized to access resources 
export function authorization(authRole?, authId?:string){
    return (req, res, next) => { 
        // console.log(req.body);
        //console.log(req.query[authId]);
        
          
        // console.log(authId);
        
        // console.log(req.params[authId]);
        // console.log(req.decoded.id);
        // console.log(req.body[authId]);
        // console.log(req.decoded.id);     

        if (!((authRole.length && authRole.includes(req.decoded.role)) || 
                (authId && ((+req.params[authId] === +req.decoded.id) || 
                    (+req.body[authId] === +req.decoded.id) || 
                        (+req.query[authId] === +req.decoded.id))))){
                            res.sendStatus(403)
                            return
        }
        req.authorized = authRole
        req.authUserId = +req.decoded.id
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
