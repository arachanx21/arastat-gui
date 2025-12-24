import { express } from 'express';

const app = express();
const port = 3000;


app.get("/",(res,req)=>{
    res.send("test");
})

export default app;