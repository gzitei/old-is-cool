import { readdirSync } from "node:fs";
import * as os from "os";
import * as lpath from "path";
import * as cp from 'child_process';
import express, { json } from 'express';
import type { Request, Response } from 'express';
import { file } from "bun";

const root = __dirname;

const app = express();

const port = 4200;

app.listen(port, () => {
    console.log(`App is running on http://localhost:${port}...`);
});

app.post("/teste-param", (req: Request, res: Response) => {
    console.log(req.params, req.body);
    res.send("");
});

app.get("/css/:file", (req: Request, res: Response) => {
    const file = req.params.file;
    res.status(200).sendFile(lpath.join(root, "css", file));
});

app.get("/api/:folder/:state", (req: Request, res: Response) => {
    const fpath = Buffer.from(req.params.folder, 'base64url').toString();
    const name = lpath.basename(fpath);
    const state = req.params.state;
    const folder = new Folder(fpath, name);
    const html = state === "close" ? folder.closed() : folder.opened();
    res.status(200).send(html);
});

app.get("", (req: Request, res:Response) => {
    res.status(200).sendFile(lpath.join(root, 'index.html'));
});

app.get("/start", (req:Request, res:Response) => {
    let result = createHtml(folders);
    let html = `<div id="folders" style="height:100%;"><h1>Escolha a pasta:</h1><ul>${result}</ul></div>`;
    res.status(200).send(html);
});

const music_ext:string[] = [
 ".mp3", ".wav", ".flac", ".aac", ".ogg", ".midi", ".wma", ".alac", ".aiff",
 ".mp4", ".m4a", ".m4b", ".m4p", ".m4v", ".amr", ".au", ".s3m", ".xm",
 ".it", ".mod", ".sid", ".vgm", ".gym", ".spc", ".nsf", ".riff", ".m3u",
 ".pls", ".asx", ".xspf"
];

const home = os.homedir().toString();

var root_dir:string;

if (os.platform().startsWith("win")) {
    const arr_path:string[] = home.split(/\\/);
    root_dir = arr_path[0];
} else {
    root_dir = "/";
}

class mockDirent {
    public name:string;
    public path:string;
    private directory: boolean;
    constructor (name:string, path:string, directory:boolean) {
        this.name = name;
        this.path = path;
        this.directory = directory;
    }
    isDirectory() {
        return this.directory;
    }
}

const root_dirent = new mockDirent(root_dir, "", true);

const folders:mockDirent[] = [
    "Desktop",
    "Downloads",
    "Music",
    "Pictures",
    "Videos",
    "Documents",
].map(f => {
    const new_dirent = new mockDirent(f, home, true);
    return new_dirent;
});

folders.push(root_dirent);

folders.sort((f1, f2) => f1.name < f2.name ? -1 : 1);

function list_content(dir :string):mockDirent[] {
    const content = readdirSync(dir,{withFileTypes: true})
    .filter(f => (!f.name.startsWith(".") && f.isDirectory() && !["root", "boot"].includes(f.name)) || (!f.isDirectory() && music_ext.includes(lpath.extname(f.name))))
    .sort((f1, f2) => Number(f2.isDirectory) - Number(f1.isDirectory))
    .map(f => {return new mockDirent(f.name, dir, f.isDirectory());});
    return content;
}

function createHtml(content:mockDirent[]):string {
    const content_list:string[] = new Array(content.length);
    content.map(el => {
        const full_path = lpath.join(el.path!, el.name!);
        if (el.isDirectory()) {
            const folder = new Folder(full_path, el.name!);
            content_list.push(folder.closed());
        } else {
            const file = new File(full_path, el.name!);
            content_list.push(file.html());
        }
    });
    return content_list.join("");
}

class File {
    
    full_path:string;
    name:string;
    
    constructor (full_path:string, name:string) {
        this.name = name;
        this.full_path = full_path;
    }

    id() {
        return Buffer.from(this.full_path).toString("base64url");
    }

    html() {
        return `<li id="${this.id()}">
                    <i class="material-symbols-outlined music-note icon">
                        music_note
                    </i>
                    <input type="checkbox">
                    ${this.name}
                </li>`;
    }
}

class Folder extends File {

    constructor (full_path:string, name:string) {
        super(full_path, name);
    }

    closed() {
        return `<li id="${this.id()}-line">
                    <input type="checkbox">
                    <div id="${this.id()}" hx-trigger="click" hx-target="#${this.id()}-line" hx-swap="outerHTML" hx-get="/api/${this.id()}/open" class="inline">
                         <i class="material-symbols-outlined folder icon">
                            folder
                        </i>
                        ${this.name||this.full_path}
                    </div>
                </li>`;
    }

    opened() {
        const content = list_content(this.full_path);
        const html = createHtml(content);
        return  `<div id="${this.id()}-parent">
                    <li id="${this.id()}-line">
                        <input type="checkbox">
                        <div id="${this.id()}" hx-trigger="click" hx-target="#${this.id()}-parent" hx-swap="outerHTML" hx-get="/api/${this.id()}/close" class="inline">
                            <i class="material-symbols-outlined folder icon">
                                folder_open
                            </i>
                            ${this.name||this.full_path}
                        </div>
                    </li>
                    ${Boolean(html) ? `<ul>${html}</ul>` : ""}
                </div>`;
    }
}

