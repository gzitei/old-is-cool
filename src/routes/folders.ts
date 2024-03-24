import express from "express";
import type { Request, Response } from "express";
import os from "node:os";
import File from "../classes/File.ts";
import path from "path";

const router = express.Router();

router.get("/", (req:Request, res:Response) => {

    const home = os.homedir().toString();
    
    var root_dir:string;

    if (os.platform().startsWith("win")) {
        const arr_path:string[] = home.split(/\\/);
        root_dir = arr_path[0];
    } else {
        root_dir = "/";
    }

    const folders:File[] = [
        "Desktop",
        "Downloads",
        "Music",
        "Pictures",
        "Videos",
        "Documents",
    ].map(f => new File(home, f));

    folders.push(new File(root_dir, ""));

    folders.sort((f1, f2) => f1.name < f2.name ? -1 : 1);;
    let html = `<div id="folders" style="height:100%;">
                    <h1>Escolha a pasta:</h1>
                    <ul>
                        ${folders.map(f => f.isDirectory() ? f.closed() : f.html()).join("")}
                    </ul>
                </div>`;
    res.status(200).send(html);
});

router.get("/:folder/:state", (req: Request, res: Response) => {
    const fpath = Buffer.from(req.params.folder, 'base64url').toString();
    const name = path.basename(fpath);
    const folder_path = path.dirname(fpath);
    const state = req.params.state;
    const folder = new File(folder_path, name);
    const html = state === "close" ? folder.closed() : folder.opened();
    res.status(200).send(html);
});

export default router;
