import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import File from './src/classes/File.ts'
import os from 'node:os'
import folders from './src/routes/folders.ts';
import css from './src/routes/css.ts';
import img from './src/routes/img.ts';
import configs from './src/routes/configs.ts';

const root = __dirname;

const app = express();

app.use("/folders", folders);
app.use("/css", css);
app.use('/img', img);
app.use('/configs', configs);

const port = 4200;

app.listen(port, () => {
    console.log(`App is running on http://localhost:${port}...`);
});

app.get("", (req: Request, res:Response) => {
    res.status(200).sendFile(path.join(root, "src", 'index.html'));
});

app.get("/:file", (req: Request, res:Response) => {
    const file = req.params.file;
    res.status(200).sendFile(path.join(root, "src", file));
});
