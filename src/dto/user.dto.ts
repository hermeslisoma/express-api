
export class UserDTO{
    userId:number
    username:string
    pass:string
    firstname:string
    lastname:string
    email:string
    roleId:number

    constructor(userId:number, username:string, pass:string, firstname:string, 
        lastname:string, email:string, roleId:number){
            this.userId = userId
            this.username = username
            this.pass = pass
            this.firstname = firstname
            this.lastname = lastname
            this.email = email
            this.roleId = roleId
        }
}

export class ReimbursementDTO{
    reimbursementId:number
    author:number
    amount:number
    dateSubmitted:any
    dateResolved:any
    description:string
    resolver:number
    statusId:number
    typeId:number

    constructor(reimbursementId:number, author:number, amount:number, dateSubmitted:any,
        dateResolved:any, description:string, resolver:number, statusId:number, typeId:number){
            this.reimbursementId = reimbursementId
            this.author = author
            this.amount = amount
            this.dateSubmitted = dateSubmitted
            this.dateResolved = dateResolved
            this.description = description
            this.resolver = resolver
            this.statusId = statusId
            this.typeId = typeId
        }
}