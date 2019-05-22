import { ReimbursementStatus } from "./reimbursement-status";
import { ReimbursementType } from "./reimbursement-type";
import { User } from "./user";

//class for reimbursement objects
export class Reimbursement{
    reimbursementId: number // primary key
	author: User  // foreign key -> User, not null
	amount: number  // not null
    dateSubmitted: any // not null
    dateResolved: any // not null
    description: string // not null
    resolver: number // foreign key -> User
    status: ReimbursementStatus // foreign key -> ReimbursementStatus, not null
    type: ReimbursementType // foreign key -> ReimbursementType

    constructor(reimbursementId:number, author:User, amount:number, 
                dateSubmitted:any, dateResolved:any, 
                description:string, resolver:number, status:ReimbursementStatus, type:ReimbursementType){
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

//static method to get reimbursement properties
    public static getProp(){
        return {
            reimbursementId: 'reimbursementid',
            author: 'author',
            amount: 'amount',
            dateSubmitted: 'datesubmitted',
            dateResolved: 'dateresolved',
            description: 'description',
            resolver: 'resolver',
            status: 'statusid',
            type: 'typeid'
        }
    }
}