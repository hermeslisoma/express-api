import * as EmailValidator from 'email-validator';
import { User } from '../models/user';

//Middleware for validation of login input
export function validationPostLogin(){
    return (req,res,next) => {
        const {username, password} = req.body
        let error = false
        let msgError = ''

        if(!username || !password || typeof(username) !== 'string' || typeof(password) !== 'string'){
            error = true
            msgError += 'Invalid username or password.'
        }

        if(!error){
            next()
        } else {
            res.status(400).send(msgError)
        }
    }
}

//Middleware to validate user input for pagination and sorting of users
export function validationPageUser(){
    return (req, res, next) => {
        let {query} = req
        let error = false
        let msgError = ''
        let sort = false
        
        if(query.limit && isNaN(+query.limit)){
            error = true
            msgError += 'limit is not a number. '
        }
        
        if(query.limit && (query.limit < 0 || query.limit > 20)){
            error = true
            msgError += 'Limit number should be between 0 and 20. '
        }
        
        if(query.offset && isNaN(+query.offset)){
            error = true
            msgError += 'offset is not a number. '
        }

        if(query.offset && query.offset < 0){
            error = true
            msgError += 'offset must be positive. '
        }

        if(query.sort){
            let userSort = User.getProp()
            for(let key in userSort){
                if(query.sort === key){
                    query.sort = userSort[key]
                    sort = true
                }
            }

            if(!sort){
                error = true
                msgError += 'Sort field does not exist. '
            }
        }

        if(!error){
            next()
        } else {
            res.status(400).send(msgError)
        }
    }
}

//Middleware for validation of user input id
export function validationGetUser(){
    return (req,res,next) =>{
        let id = +req.params.id
        let error = false
        let msgError = ''

        if(isNaN(id)){
            error = true
            msgError += 'id: is not a number. '
        }

        if(!error){
            next()
        } else {
            res.status(400).send(msgError)
        }
    }
}

//Middleware to validate user input before creating a new user
export function validationPostUser(){
    return (req, res, next) => {
        let {body} = req
        let error = false
        let msgError = ''

        if(!body.username || typeof(body.username) !== 'string'){
            error = true
            msgError += 'Invalid username. '
        }

        if(!body.password || typeof(body.password) !== 'string'){
            error = true
            msgError += 'Invalid password. '
        }

        if(!body.firstName || typeof(body.firstName) !== 'string'){
            error = true
            msgError += 'Invalid firstname. '
        }

        if(!body.lastName || typeof(body.lastName) !== 'string'){
            error = true
            msgError += 'Invalid lastname. '
        }

        if(!body.email || !EmailValidator.validate(body.email)){
            error = true
            msgError += 'Invalid email. '
        }

        if(!error){
            next()
        } else {
            res.status(400).send(msgError)
        }
    }
}

//Middleware to validate user input before updating a user
export function validationPatchUser(){
    return (req,res,next) => {
        let {body} = req
        let error = false
        let msgError = ''

        if (!body.userId){
            error = true
            msgError += 'Missing user id. '
        }

        if(body.username && typeof(body.username) !== 'string'){
            error = true
            msgError += 'Invalid username. '
        }

        if(body.firstName && typeof(body.firstName) !== 'string'){
            error = true
            msgError += 'Invalid firstname. '
        }

        if(body.lastName && typeof(body.lastName) !== 'string'){
            error = true
            msgError += 'Invalid lastname. '
        }

        if(body.email && !EmailValidator.validate(body.email)){
            error = true
            msgError += 'Invalid email. '
        }

        if(!error){
            next()
        } else {
            res.status(400).send(msgError)
        }
    }
}
