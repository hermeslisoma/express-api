import express from 'express'
import bodyParser from 'body-parser'
import { userRouter } from './routers/user-router'
import { users } from './state'
import { sessionMiddleware } from './middleware/session-middleware';
import { reimbursementRouter } from './routers/reimbursement-router';
import { validationPostLogin } from './middleware/validation-middleware';
import { loginService } from './service/user.service';

const app = express()

app.use(bodyParser.json())
app.use(sessionMiddleware)

app.post('/login', validationPostLogin(), async (req, res) => {
    const {username, password} = req.body
    const user = await loginService(username, password)    
    
    if(user['errorStatus']){
        res.status(400).send(user['errorMessage'])
    } else {
        req.session.user = user
        res.send(user)  
    }
})

app.use('/users', userRouter)
app.use('/reimbursement', reimbursementRouter)

app.listen('3000',() => {
    console.log('ERS has started')
})