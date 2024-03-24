import fs from 'node:fs';
import path from 'node:path';
class File {
    public path:string;
    public name:string;

    constructor (path:string, name:string) {
        this.name = name;
        this.path = path;
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
        if (this.isDirectory()) {return null;}
        return `<li id="${this.id()}">
                    <i class="material-symbols-outlined music-note icon">
                        music_note
                    </i>
                    ${this.name}
                </li>`;
    }
    
    public closed():string | null {
        if(!this.isDirectory()) {return null;}
        return `<li id="${this.id()}-line">
                    <input type="checkbox" id="${this.id()}-check" value="${this.id()}" hx-on:click="{const value = this.value; const checked = this.checked;const content = localStorage.getItem('FOLDERS');if (content) {let arr = content.split(',');if(checked) {arr.push(value)} else {arr = arr.filter(i => i.toString()!=value.toString());};if(arr.length === 0) {localStorage.removeItem('FOLDERS');} else {localStorage.setItem('FOLDERS', [...new Set(arr)]);}} else {if (!checked) return;localStorage.setItem('FOLDERS', value);}console.log(localStorage);}">
                    <div id="${this.id()}" hx-trigger="click" hx-target="#${this.id()}-line" hx-swap="outerHTML" hx-get="/folders/${this.id()}/open" class="inline">
                         <i class="material-symbols-outlined folder icon">
                            folder
                        </i>
                        ${this.name||this.full_path()}
                    </div>
                </li>`;
    }
    
    public opened(): string | null {
        if(!this.isDirectory()) {return null;}
        const content = this.content();
        const html_content = content!.length > 0 ? `<ul>${content!.map(f => f.isDirectory() ? f.closed() : f.html()).join("")}</ul>` : "";
        return  `<div id="${this.id()}-parent">
                    <li id="${this.id()}-line">
                        <input type="checkbox" id="${this.id()}-check" value="${this.id()}" hx-on:click="{const value = this.value; const checked = this.checked;const content = localStorage.getItem('FOLDERS');if (content) {let arr = content.split(',');if(checked) {arr.push(value)} else {arr = arr.filter(i => i.toString()!=value.toString());};if(arr.length === 0) {localStorage.removeItem('FOLDERS');} else {localStorage.setItem('FOLDERS', [...new Set(arr)]);}} else {if (!checked) return;localStorage.setItem('FOLDERS', value);}console.log(localStorage);}">
                        <div id="${this.id()}" hx-trigger="click" hx-target="#${this.id()}-parent" hx-swap="outerHTML" hx-get="/folders/${this.id()}/close" class="inline">
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
            .map(f => new File(this.full_path(), f.name));
        return content;
    }

}

export default File;
