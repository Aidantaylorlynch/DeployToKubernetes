import express from 'express';
import { Request, Response } from 'express';

const app = express();

const port = 3000;

app.get("/", (req: Request, res: Response) => {
    res.send('<h1>express GET "/" hell yeh </h1>');
});

app.listen(port, () => {
    console.log("app listening on port ", port);
});