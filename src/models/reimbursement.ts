import {ReimbursementStatus} from './reimbursement-status'

export class Reimbursement{
    reimbursementId: number // primary key
	author: number  // foreign key -> User, not null
	amount: number  // not null
    dateSubmitted: number // not null
    dateResolved: number // not null
    description: string // not null
    resolver: number // foreign key -> User
    status: number // foreign key -> ReimbursementStatus, not null
    type: number // foreign key -> ReimbursementType

    constructor(reimbursementId:number = 0, author:number = 0, amount:number = 0, 
                dateSubmitted:number = new Date().getTime(), dateResolved:number = new Date().getTime(), 
                description:string = '', resolver:number = 2, status:number = 1, type:number = 0){
            this.reimbursementId = reimbursementId
            this.author = author
            this.amount = amount
            this.dateSubmitted = dateSubmitted
            this.dateResolved = dateResolved
            this.description = description
            this.resolver = resolver
            this.status = status
            this.type = type
        }
}