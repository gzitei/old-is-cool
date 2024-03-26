import fs from "fs";
import path from "path";

const file = path.join(path.dirname(__dirname), "env.config.json");

export interface Config {
    [key: string]: string[];
};

export var configs:Config = getConfigs();

export function getConfigs():Config {
    return JSON.parse(fs.readFileSync(file).toString());
}

export function setConfigs(data:Config):Config {
    try {
        Object.entries(data).forEach(([k, v]) => data[k] = [... new Set(v)]);
        fs.writeFileSync(file, JSON.stringify(data, null, 4));
        const config = getConfigs();
        return config;
    } catch (e) {
        console.error("error writing config file", e);
        return configs;
    }
}

export default { getConfigs, setConfigs, configs };
