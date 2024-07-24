
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://xplain-ai.net',
    
]

export const corsOption = {
    origin: (origin, callback) => {
        if(allowedOrigins.indexOf(origin) !== -1 || !origin){
            callback(null, true)
        } else{
            callback(new Error("not allowed by Cors"))
        }
    },
    optionSuccessStatus:200
}