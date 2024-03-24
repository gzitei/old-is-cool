import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import File from './src/classes/File.ts'
import os from 'node:os'
import folders from './src/routes/folders.ts';
import css from './src/routes/css.ts';

const root = __dirname;

const app = express();

app.use("/folders", folders);
app.use("/css", css);

const port = 4200;

app.listen(port, () => {
    console.log(`App is running on http://localhost:${port}...`);
});

app.get("", (req: Request, res:Response) => {
    res.status(200).sendFile(path.join(root, "src", 'index.html'));
});

