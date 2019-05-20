import express from 'express'
import { users, roles } from '../state'
import { authorization } from '../middleware/auth-middleware';
import { User } from '../models/user'
import { validationGetUser, validationPatchUser } from '../middleware/validation-middleware';
import { getAllUsersService, getUserByIdService, patchUserService } from '../service/user.service';

export const userRouter = express.Router()

userRouter.get('',[authorization('finance-manager'), async (req,res) => {
    let users = await getAllUsersService()
    if (users['errorStatus'])
        res.status(400).send(users['errorMessage'])    
    else res.json(users)
}])

userRouter.patch('',[authorization('admin'), validationPatchUser(), async (req,res) => {
    let {body} = req
    let user = await patchUserService(body)

    if(user['errorStatus']){
        res.status(400).send(user['errorMessage'])
    } else {
    res.json(user)
    }
}])

userRouter.get('/:id',[authorization('finance-manager','id'), validationGetUser(), async (req,res) => {
    let id = +req.params.id
    let user = await getUserByIdService(id)
    
    if(user['errorStatus'])
        res.status(400).send(user['errorMessage'])    
    else res.json(user)   
}])


