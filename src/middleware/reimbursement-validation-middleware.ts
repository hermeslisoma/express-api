import { Reimbursement } from '../models/reimbursement';
import moment from 'moment'

//Middleware to validate user input for pagination and sorting
export function validationPageReimbursement(){
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
            let reimbSort = Reimbursement.getProp()
            for(let key in reimbSort){
                if(query.sort === key){
                    query.sort = reimbSort[key]
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

//Middleware for validation of user input to get reimbursements
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

//Middleware for validation of user input to post reimbursement
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

        req.newReimbursement = Reimbursement.getProp()
        
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

//Middleware for validation of user input to update reimbursement
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



