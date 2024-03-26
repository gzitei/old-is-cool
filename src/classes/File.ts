import fs from 'node:fs';
import path from 'node:path';
import { getConfigs, setConfigs } from '../utils.ts';

class File {
    public path:string;
    public name:string;
    public option:string;
    constructor (path:string, name:string, option:string) {
        this.name = name;
        this.path = path;
        this.option = option;
    }

    public isDirectory():boolean {
        return fs.statSync(this.full_path()).isDirectory();
    }

    public full_path():string {
        return path.join(this.path, this.name);
    }

    public id():string {
        return Buffer.from(this.full_path()).toString("base64url");
    }

    public html():string | null {
        const configs = getConfigs();
        if (this.isDirectory()) {
            const open = configs["open"];
            if (open.includes(this.full_path())) {
                return this.opened();
            } else {
                return this.closed();
            }
        }
        return `<li id="${this.id()}">
                    <i class="material-symbols-outlined music-note icon">
                        music_note
                    </i>
                    ${this.name}
                </li>`;
    }
    
    private closed():string | null {
        if(!this.isDirectory()) {return null;}
        return `<li id="${this.id()}">
                    ${this.getCheckbox()}
                    <div id="${this.id()}-content" hx-on:htmx:before-request="sessionStorage.setItem('position', JSON.stringify({'x':document.getElementById('folders').scrollLeft, 'y': document.getElementById('folders').scrollTop}))" hx-boost="true" hx-trigger="click" hx-target="#folders" hx-swap="outerHTML" hx-get="/folders/${this.id()}/open/${this.option}" class="inline">
                         <i class="material-symbols-outlined folder icon">
                            folder
                        </i>
                        ${this.name||this.full_path()}
                    </div>
                </li>`;
    }
    
    private opened(): string | null {
        if(!this.isDirectory()) {return null;}
        const configs = getConfigs();
        const content = this.content();
        for (let i = 0; i < content!.length; i++) {
            if (content![i].getChecked() === "checked") {
                configs[this.option].push(content![i].full_path());
            }
        }
        setConfigs(configs);
        const html_content = content!.length > 0 ? `<ul>${content!.map(f => f.html()).join("")}</ul>` : "";
        return  `<div id="${this.id()}">
                    <li id="${this.id()}-line">
                        ${this.getCheckbox()}
                        <div id="${this.id()}-content" hx-on:htmx:before-request="sessionStorage.setItem('position', JSON.stringify({'x':document.getElementById('folders').scrollLeft, 'y': document.getElementById('folders').scrollTop}))" hx-boost="true" hx-trigger="click" hx-target="#folders" hx-swap="outerHTML" hx-get="/folders/${this.id()}/close/${this.option}" class="inline">
                            <i class="material-symbols-outlined folder icon">
                                folder_open
                            </i>
                            ${this.name||this.full_path()}
                        </div>
                    </li>
                    ${html_content}
                </div>`;
    }

    public content():File[] | null {
        if(!this.isDirectory()) {return null;}
        const music_ext:string[] = [
            ".mp3", ".wav", ".flac", ".aac", ".ogg", ".midi", ".wma", ".alac", ".aiff",
            ".mp4", ".m4a", ".m4b", ".m4p", ".m4v", ".amr", ".au", ".s3m", ".xm",
            ".it", ".mod", ".sid", ".vgm", ".gym", ".spc", ".nsf", ".riff", ".m3u",
            ".pls", ".asx", ".xspf"
        ];
        const content = fs.readdirSync(this.full_path(),{withFileTypes: true})
            .filter(f => (!f.name.startsWith(".") && f.isDirectory() && !["root", "boot"].includes(f.name)) || (!f.isDirectory() && music_ext.includes(path.extname(f.name))))
            .sort((f1, f2) => Number(f2.isDirectory()) - Number(f1.isDirectory()))
            .map(f => new File(this.full_path(), f.name, this.option));
        return content;
    }

    public getParent() {
        return path.dirname(this.full_path());
    }

    public getParentChecked():boolean {
        const configs = getConfigs();
        const options = configs[this.option];
        const exclude = configs["exclude"];
        const parent_included = options.some(f => this.full_path().startsWith(`${f}/`));
        const parent_excluded = exclude.some(f => this.full_path().startsWith(`${f}/`));
        return parent_included && !parent_excluded;

    }

    private getChecked():string|null {
        if (!this.isDirectory()) return null;
        const configs = getConfigs();
        if (this.option === "output") {
            return configs[this.option].includes(this.full_path()) ? "checked" : "";
        }
        const exclude = configs["exclude"];
        const options = configs[this.option];
        if (options.includes(this.full_path())) {
            setConfigs(configs);
            return "checked";
        } else if (!exclude.includes(this.full_path()) && this.getParentChecked()) {
            return "checked";
        } else {
            return "";
        }
    }

    public getCheckbox():string | null {
        if (!this.isDirectory()) return null;
        if (this.full_path() === this.getParent()) return "";
        return `<input type="checkbox" hx-on:htmx:before-request="sessionStorage.setItem('position', JSON.stringify({'x':document.getElementById('folders').scrollLeft, 'y': document.getElementById('folders').scrollTop}))" hx-trigger="click" hx-target="#folders" hx-swap="outerHTML" hx-get="/folders/setup/${this.id()}/${this.option}/${this.getChecked() ? "uncheck" : "check"}" id="${this.id()}-check" value="${this.id()}" ${this.getChecked()}>`;
    }

}

export default File;
