import {
    flagMapper,
    makeSimpleCommand,
    splitIntoLines,
    asyncOuputHandler,
} from "../CommandUtils";
import { isTruthy } from "../../TsUtils";

export interface ClientsOptions {
    nameFilter?: string;
    max?: number;
    me?: true;
}

const clientsFlags = flagMapper<ClientsOptions>([
    ["E", "nameFilter"],
    ["m", "max"],
    ["-me", "me"],
]);

const clientsCommand = makeSimpleCommand("clients", clientsFlags);

export type ClientInfo = {
    client: string;
    date: string;
    root: string;
    description: string;
};

function parseClientLine(line: string) {
    const matches = /^Client (\S*) (\S*) root (.*) '(.*)'$/.exec(line);
    if (matches) {
        const [, client, date, root, description] = matches;
        return {
            client,
            date,
            root,
            description,
        };
    }
}

function parseClientsOutput(output: string) {
    const lines = splitIntoLines(output);
    return lines.map(parseClientLine).filter(isTruthy);
}

export interface ClientOptions {
    name: string;
    output: boolean;
}

const clientFlags = flagMapper<ClientOptions>([["o", "output"]], "name");

export const clients = asyncOuputHandler(clientsCommand, parseClientsOutput);

const clientCommand = makeSimpleCommand("client", clientFlags);

export type ClientSpec = {
    client: string | undefined;
    owner: string | undefined;
    host: string | undefined;
    root: string | undefined;
};

function parseClientOutput(output: string): ClientSpec {
    const values = new Map<string, string>();
    const lines = splitIntoLines(output);
    for (let i = 0, n = lines.length; i < n; ++i) {
        if (lines[i].startsWith("#")) {
            continue;
        }
        const matches = /([^:]+):\s(.+)/.exec(lines[i].trimEnd());
        if (!matches) {
            continue;
        }
        values.set(matches[1], matches[2]);
    }

    return {
        client: values.get("Client"),
        owner: values.get("Owner"),
        host: values.get("Host"),
        root: values.get("Root"),
    };
}

export const client = asyncOuputHandler(clientCommand, parseClientOutput);
