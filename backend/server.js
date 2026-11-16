import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
const PORT=process.env.PORT||3000
const app=express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
    extended:true
}))
app.get('/',(req,res)=>{
    res.send(`server is live on 3000 locally ...`)
})
app.listen(PORT,()=>{
    console.log(`server is runing on the port http://localhost:${PORT}`)
})