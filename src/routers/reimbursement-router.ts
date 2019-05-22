import express from 'express'
import { authorization } from '../middleware/auth-middleware';
import { validationPostReimbursement, validationPatchReimbursement, validationGetReimbursement, validationPageReimbursement } from '../middleware/reimbursement-validation-middleware';
import { getReimbursementByStatusService, getReimbursementByUserService, postReimbursementService, patchReimbursementService, getAllReimbursementsService } from '../service/reimbursement.service';

export const reimbursementRouter = express.Router()

//Endpoint to get all reimbursements with
//prior authorization and validation middlewares
//Optional query string for paging and sorting
reimbursementRouter.get('', [authorization('finance-manager'), validationPageReimbursement(), async (req, res) => {
    let {query} = req
    let reimbursements = await getAllReimbursementsService(query)

    if (reimbursements['errorStatus'])
        res.status(400).send(reimbursements['errorMessage'])    
    else res.json([reimbursements[0],+reimbursements[1]])
}])

//Endpoint to get reimbursements by status with
//prior Authorization and validation middlewares
//optional search by date range
reimbursementRouter.get('/status/:statusId/date-submitted',[authorization('finance-manager'),
                                        validationGetReimbursement('statusId'), async (req,res) => {
    let reimbByStatus = await getReimbursementByStatusService(req)

    if(reimbByStatus['errorStatus'])
        res.status(400).send(reimbByStatus['errorMessage'])
    else res.json(reimbByStatus)
}])

//Endpoint to get reimbursements by user with
//prior Authorization and validation middlewares
//optional search by date range
reimbursementRouter.get('/author/userId/:userId/date-submitted',[authorization('finance-manager','userId'),
                                            validationGetReimbursement('userId'), async (req, res) => {
    let reimbByUser = await getReimbursementByUserService(req)

    if(reimbByUser['errorStatus'])
        res.status(400).send(reimbByUser['errorMessage'])
    else res.json(reimbByUser)
}])

//Endpoint to post reimbursement with
//prior Authorization and validation middleware
reimbursementRouter.post('',[authorization('finance-manager','author'), validationPostReimbursement(), 
                            async (req, res) => {

    let postReimb = await postReimbursementService(req)
    if(postReimb['errorStatus'])
        res.status(400).send(postReimb['errorMessage'])   
    else res.status(201).send(postReimb)     
}])

//Endpoint to patch reimbursement with
//prior Authorization and validation middleware
reimbursementRouter.patch('',[authorization('finance-manager'), validationPatchReimbursement(), 
                            async (req, res) => {
    let patchReimb = await patchReimbursementService(req)
    
    if(patchReimb['errorStatus'])
        res.status(400).send(patchReimb['errorMessage'])
    res.json(patchReimb)
}])