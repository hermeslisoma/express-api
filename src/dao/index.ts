import {Pool} from 'pg'

//Connection factory
export const connectionPool:Pool = new Pool({
    user: process.env['ERS_DB_USER'],
    host: process.env['ERS_DB_HOST'],
    database: process.env['ERS_DB_NAME'],
    password: process.env['ERS_DB_PASS'],
    port: 5432,
    max: 5
})
