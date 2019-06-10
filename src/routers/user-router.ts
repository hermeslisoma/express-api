import express from 'express'
import { authorization } from '../middleware/auth-middleware';
import { validationGetUser, validationPatchUser, validationPageUser } from '../middleware/user-validation-middleware';
import { getAllUsersService, getUserByIdService, patchUserService } from '../service/user.service';

export const userRouter = express.Router()

//Endpoint to get all users with
//prior Authorization, validation middleware
//optional query string for paging and sorting
userRouter.get('',[authorization(['finance-manager','admin']), validationPageUser(), async (req,res) => {
    let {query} = req
    let users = await getAllUsersService(query)

    if (users['errorStatus'])
        res.status(400).send(users['errorMessage'])    
    else res.json([users[0],+users[1],+users[2],+users[3]])
}])

//Endpoint to patch a user with
//prior Authorization and validation middleware
userRouter.patch('',[authorization(['admin'],'userId'), validationPatchUser(), async (req,res) => {
    let {body} = req
    let user = await patchUserService(body)

    if(user['errorStatus'])
        res.status(400).send(user['errorMessage'])
    else res.json(user)
}])

//Endpoint to get a user by id with
//prior Authorization, validation middlewares
userRouter.get('/:id',[authorization(['finance-manager','admin'],'id'), validationGetUser(), async (req,res) => {
    let id = +req.params.id
    let user = await getUserByIdService(id)
    
    if(user['errorStatus'])
        res.status(400).send(user['errorMessage'])    
    else res.json(user)   
}])
