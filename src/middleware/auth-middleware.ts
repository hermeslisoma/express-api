export function authorization(authRole:string, authId?:string){
    return (req, res, next) => {      
        let isAuth = false  

        if(!req.session.user){
            res.sendStatus(401)
        }        
        if (authRole.includes(req.session.user.role.role) || 
                (authId && ((+req.params[authId] === req.session.user.userId) || 
                    (+req.body[authId] === req.session.user.userId)))){
                isAuth = true
        }

        if(isAuth){
            req.authorized = authRole
            next()
        } 
        else {
            res.sendStatus(403)
        }             
    }
}