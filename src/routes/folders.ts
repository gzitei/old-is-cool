import express from "express";
import type { Request, Response } from "express";
import os from "node:os";
import File from "../classes/File.ts";
import path from "path";
import { getConfigs, setConfigs } from '../utils.ts';

const router = express.Router();

router.get("/list/:option", (req: Request, res: Response) => {
    
    const option = req.params.option;

    const html = `<h1>Escolha a pasta ${option === "input" ? "onde estão suas músicas..." : "onde ficarão as músicas organizadas..."}<h1><div><button
        hx-trigger="click"
        hx-get="/configs/remove-all/${option}"
        hx-swap="outerHTML" hx-target="#${option}"
        hx-on:afterSwap
        class="clear-button">Desmarcar tudo</button> <button hx-trigger="click" hx-get="/configs/save/${option}" hx-swap="outerHTML" hx-target="#${option}" class="red-button">Salvar</button></div>${foldersListHtml(option)}`;

    res.status(200).send(html);
});

router.get("/:folder/:state/:option", (req: Request, res: Response) => {
    const configs = getConfigs();
    const fpath = Buffer.from(req.params.folder, 'base64url').toString();
    const option = req.params.option;
    const name = path.basename(fpath);
    const folder_path = path.dirname(fpath);
    const state = req.params.state;
    const folder = new File(folder_path, name, option);
    if (!Boolean(configs["open"])) {
        configs["open"] = [];
    }
    if (state === "open"){
        configs["open"].push(folder.full_path());
    }
    if (state === "close") {
        configs["open"] = configs["open"].filter(f => !f.startsWith(folder.full_path())); 
    }
    setConfigs(configs);
    const html = foldersListHtml(option);
    res.status(200).send(html);
});

router.get("/setup/:folder/:option/:action", (req: Request, res: Response) => {
    const params = req.params;
    const fpath = Buffer.from(params.folder, 'base64url').toString();
    const parent = path.dirname(fpath);
    const name = path.basename(fpath);
    const option = params.option;
    const action = params.action;
    const configs = getConfigs();
    const file = new File(parent, name, option);
    if (option === "output") {
        if (action === "check") {
            configs[option] = [file.full_path()];
        } else {
            configs[option] = [];
        }
        setConfigs(configs);
    }
    if (option === "input") {
        if (action === "check") {
            checkInputFolder(file);
        }
        if (action === "uncheck") {
            uncheckInputFolder(file);
        }
    }
    const html = foldersListHtml(option);
    res.status(200).send(html);
});

function uncheckInputFolder(folder:File):void {
    const configs = getConfigs();
    const arr:string[] = [];
    let f = folder;
    while (f.full_path() != f.getParent()) {
        arr.push(f.full_path());
        let parsed = path.parse(f.getParent());
        f = new File(parsed.dir, parsed.base, 'input');
    }
    configs["input"] = configs["input"].filter(removeFolder);
    setConfigs(configs);
    function removeFolder(f:string) {
        if (f) {
            return !arr.includes(f);
        } else {
            return false;
        }
    }
}

function checkInputFolder(folder:File):void {
    const configs = getConfigs();
    configs["exclude"] = configs["exclude"].filter(f => f.startsWith(folder.full_path()));
    configs["input"].push(folder.full_path());
    setConfigs(configs);
}

export function foldersListHtml(option:string, oob:boolean = false):string {
    const home = os.homedir().toString();

    var root_dir: string;

    if (os.platform().startsWith("win")) {
        const arr_path: string[] = home.split(/\\/);
        root_dir = arr_path[0];
    } else {
        root_dir = "/";
    }
    const folders: File[] = [
        "Desktop",
        "Downloads",
        "Music",
        "Pictures",
        "Videos",
        "Documents",
    ].map(f => new File(home, f, option));

    folders.push(new File(root_dir, "", option));

    folders.sort((f1, f2) => f1.name < f2.name ? -1 : 1);

    let html = `<div id="folders" ${oob ? 'hx-swap-oob="true"' : ""} hx-on:htmx:load="{const storagePos = JSON.parse(sessionStorage.getItem('position')); if (storagePos) {const el = document.getElementById('folders'); el.scrollTop = storagePos.y; el.scrollLeft = storagePos.x;}}">
                         ${[...new Set(folders)].map(f => f.html()).join("")}
                </div>`;

    return html;
}

export default router;
