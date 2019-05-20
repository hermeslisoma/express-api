import {User} from './models/user'
import {Role} from './models/role'
import {Reimbursement} from './models/reimbursement'
import {ReimbursementType} from './models/reimbursement-type'
import {ReimbursementStatus} from './models/reimbursement-status'

export let roles:Role[] = [
    new Role(1,'admin'),
    new Role(2,'finance-manager'),
    new Role(3, 'user'),
    new Role(4, 'trainee')
]
export let users:User[] =[
    new User(1,'john','password','John','Doe','johndoe@gmail.com',roles[0]),
    new User(2,'jane','password','Jane','Doe','janedoe@gmail.com',roles[1]),
    new User(3,'hermes','password','Hermes','Lisoma','hermeslisoma@gmail.com',roles[2]),
    new User(4,'daniel','password','Daniel','Wembola','danielwembola@gmail.com',roles[2]),
    new User(5,'esther','password','Esther','Matomisa','esthermatomisa@gmail.com',roles[2])
]

export let reimbStatus:ReimbursementStatus[] = [
    new ReimbursementStatus(1,'Pending'),
    new ReimbursementStatus(2,'Approved'),
    new ReimbursementStatus(3,'Denied')
]

export let reimbTypes:ReimbursementType[] = [
    new ReimbursementType(1,'Lodging'),
    new ReimbursementType(2,'Travel'),
    new ReimbursementType(3,'Food'),
    new ReimbursementType(4,'Other')
]

export let reimb:Reimbursement[] = [
    new Reimbursement(1, users[2]['userId'], 250, new Date("2019-05-06").getTime(), 
                        new Date("2019-05-10").getTime(), 'Travel from Home to Revature Office', 
                        users[1]['userId'], reimbStatus[1]['statusId'], reimbTypes[1]['typeId']),
    new Reimbursement(2, users[3]['userId'], 250, new Date("2019-05-07").getTime(), 
                        new Date("2019-05-10").getTime(), 'Travel from Home to Revature Office', 
                        users[1]['userId'], reimbStatus[1]['statusId'], reimbTypes[1]['typeId']),
    new Reimbursement(3, users[4]['userId'], 250, new Date("2019-05-10").getTime(), 
                        new Date("2019-05-13").getTime(), 'Travel from Home to Revature Office', 
                        users[1]['userId'], reimbStatus[0]['statusId'], reimbTypes[1]['typeId'])                     
]