import express from 'express'
import { authorization } from '../middleware/auth-middleware';
import { reimb, users, reimbTypes, reimbStatus } from '../state';
import { Reimbursement } from '../models/reimbursement';
import moment from 'moment'
import { validationPostReimbursement, validationPatchReimbursement, validationGetReimbursement } from '../middleware/validation-middleware';
import { getReimbursementByStatusService, getReimbursementByUserService, postReimbursementService, patchReimbursementService } from '../service/user.service';

export const reimbursementRouter = express.Router()

reimbursementRouter.get('/status/:statusId/date-submitted',[authorization('finance-manager'),
                                        validationGetReimbursement('statusId'), async (req,res) => {
    let reimbByStatus = await getReimbursementByStatusService(req)

    if(reimbByStatus['errorStatus'])
        res.status(400).send(reimbByStatus['errorMessage'])
    else res.json(reimbByStatus)
}])

reimbursementRouter.get('/author/userId/:userId/date-submitted',[authorization('finance-manager','userId'),
                                            validationGetReimbursement('userId'), async (req, res) => {
    let reimbByUser = await getReimbursementByUserService(req)

    if(reimbByUser['errorStatus'])
        res.status(400).send(reimbByUser['errorMessage'])
    else res.json(reimbByUser)
}])

reimbursementRouter.post('',[authorization('finance-manager','author'), validationPostReimbursement(), 
                            async (req, res) => {

    let postReimb = await postReimbursementService(req)
    if(postReimb['errorStatus'])
        res.status(400).send(postReimb['errorMessage'])   
    else res.status(201).send(postReimb)     
}])

reimbursementRouter.patch('',[authorization('finance-manager'), validationPatchReimbursement(), 
                            async (req, res) => {
    let patchReimb = await patchReimbursementService(req)
    
    if(patchReimb['errorStatus'])
        res.status(400).send(patchReimb['errorMessage'])
    res.json(patchReimb)
}])