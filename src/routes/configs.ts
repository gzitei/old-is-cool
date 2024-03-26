import express from "express";
import type { Request, Response } from "express";
import { getConfigs, setConfigs } from "../utils";
import os from "os";
import File from "../classes/File.ts";
import { foldersListHtml } from "./folders.ts";

const router = express.Router();

router.get("/:option", (req: Request, res: Response) => {
    const option = req.params.option;
    const html = buildConfig(option);
    res.status(200).send(html);
});

router.get("/remove-all/:option", (req: Request, res: Response) => {
    const option = req.params.option;
    const configs = getConfigs();
    configs[option] = [];
    setConfigs(configs);
    const html = buildConfig(option) + foldersListHtml(option, true);
    res.status(200).send(html);
});


router.get("/save/:option", (req: Request, res: Response) => {
    const option = req.params.option;
    const html = buildConfig(option);
    res.status(200).send(html);
});

function buildConfig(option:string):string {
    const configs = getConfigs();
    const file =  new File(os.homedir(), "Music", option);
    const options = configs[option];
    let html = [];
    if (options.length === 0) {
        configs[option] = [file.full_path()];
        setConfigs(configs);
        html.push(`<div class="config-box bottom-border"><p>${file.full_path()}</p></div>`);
    } else {
        html.push(options.map(f => `<div class="config-box bottom-border"><p>${f}</p></div>`).join(""));
    } 
    return `<div id="${option}">${html.join("")}</div>`;
}

export default router;
