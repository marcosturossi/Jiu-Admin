export interface SendLogin {
    username:string
    password:string
}

export interface Login {
    token:string
    refreshToken:string
    expirations: Date
}


export interface ResetPassword{
    username:string
    password:string
}

