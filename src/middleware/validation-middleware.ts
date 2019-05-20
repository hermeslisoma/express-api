import { reimb, users, reimbTypes, reimbStatus, roles } from '../state';
import { Reimbursement } from '../models/reimbursement';
import moment from 'moment'
import * as EmailValidator from 'email-validator';

export function validationPostLogin(){
    return (req,res,next) => {
        const {username, password} = req.body
        let error = false
        let msgError = ''

        if(!username || !password || typeof(username) !== 'string'){
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

export function validationGetReimbursement(reimbId:string){
    return (req,res,next) => {
        let id:number = +req.params[reimbId]
        let {start, end}  = req.query
        let error = false
        let msgError = ''

        if(isNaN(id)){
            error = true
            msgError += reimbId  + ': is not a number. '
        }

        if((start || end) && (!moment(start).isValid() || !moment(end).isValid())){
            error = true
            msgError += 'Invalid date format. '
        }

        if(!error){
            next()
        } else {
            res.status(400).send(msgError)
        }
    }
}

export function validationPostReimbursement(){
    return (req, res, next) => {
        let {body} = req
        let error = false
        let msgError = ''
        let propExcept = ['reimbursementId','dateResolved','resolver','status']
        
        if(!moment(body.dateSubmitted).isValid()){
            error = true
            msgError += 'Invalid date format. '
        }

        req.newReimbursement = new Reimbursement()
        
        for(let key in req.newReimbursement){
            if(!propExcept.includes(key) && !body[key]){
                error = true
                msgError += key + ': field is missing. '
            } 
        }

        if(!error){
            body.dateSubmitted = new Date(body.dateSubmitted)
            body.dateResolved = body.dateSubmitted
            next()
        } else {
            res.status(400).send(msgError)
        }
    }
}

export function validationPatchReimbursement(){
    return (req, res, next) => {
        let {body} = req
        let error = false
        let msgError = ''

        if(!body.reimbursementId){
            error = true
            msgError += 'Invalid reimbursement id. '
        }

        if(body.dateResolved && !moment(body.dateResolved).isValid()){
            error = true
            msgError += 'Invalid date format. '         
        }

        if (!error){
            body.dateResolved = moment(body.dateResolved).format('YYYY-MM-DD HH:MM:SS')
            next()
        } else {
            res.status(400).send(msgError)
        }
    }
}



