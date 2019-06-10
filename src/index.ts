import express from 'express'
import bodyParser from 'body-parser'
import { userRouter } from './routers/user-router'
import { secretKey } from './middleware/session-middleware';
import { reimbursementRouter } from './routers/reimbursement-router';
import { validationPostLogin, validationPostUser } from './middleware/user-validation-middleware';
import { loginService, createUserService } from './service/user.service';
import jwt from 'jsonwebtoken'
import { authentication } from './middleware/auth-middleware';
import cors from 'cors'

const app = express()

app.use(bodyParser.json())
app.use(cors({
    origin: 'http://localhost:3000',
    //origin: 'http://hermes-react.s3-website.us-east-2.amazonaws.com',
    //origin: '*',
    credentials: true
    //methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS'
}))

//Endpoint to register a new user with
//prior validation middleware
app.post('/register', validationPostUser(), async (req, res) =>{
    let {body} = req
    let user:any = await createUserService(body)    

    if(user['errorStatus']){
        res.status(400).send(user['errorMessage'])
    } else {
    let token = await jwt.sign({id: user.userId, role: user.role.role}, secretKey.secret, 
        {expiresIn: 86400})
    user.token = token
    res.json(user)
    }
})

//Endpoint to login with
//prior validation middleware
app.post('/login', validationPostLogin(), async (req, res) => {
    const {username, password} = req.body
    const user:any = await loginService(username, password)    
    
    if(user['errorStatus']){
        res.status(400).send(user['errorMessage'])
    } else {
    let token = jwt.sign({id: user.userId, role: user.role.role}, secretKey.secret, 
                        {expiresIn: 86400})
    user.token = token
    res.send(user)         
    }
})

//Endpoint with JWT authentication middleware
app.use(authentication())

app.use('/users', userRouter)

app.use('/reimbursement', reimbursementRouter)

app.use((req, res) => {
    res.sendStatus(404)
})

app.listen('3030',() => {
    console.log('ERS has started')
})

