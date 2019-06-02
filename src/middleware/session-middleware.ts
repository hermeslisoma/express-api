import session from 'express-session'

//session object
const sess =  {
    secret: 'secret',
    cookie: { secure: false },
    resave: false,
    saveUninitialized: false
}

export const sessionMiddleware = session(sess)

//JWT key object
export const secretKey = {
    secret: 'secret'
    //secret: process.env['ERS_JWT_KEY']
}