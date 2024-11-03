import * as vscode from "vscode";
import { Utils } from "./Utils";
import { Display } from "./Display";
import * as p4 from "./api/PerforceApi";
import * as os from "os";

function startsWithInsensitive(a: string, b: string) {
    a = a.toUpperCase();
    b = b.toUpperCase();
    return a === b || a.startsWith(b + "/");
}

export class ClientManager {
    private static rootClientMap = new Map<string, p4.ClientSpec>();

    public static async updateClientMap(uri: vscode.Uri) {
        if (this.getClient(uri) !== "none") {
            return;
        }

        const hostname = os.hostname().toUpperCase();
        Display.channel.appendLine(
            "> " + uri + ": update client map with host:" + hostname
        );
        try {
            const wksRootN = Utils.normalize(uri.fsPath);
            const clients = await p4.clients(uri, { me: true });
            for (let i = 0; i < clients.length; ++i) {
                const client = clients[i];
                const clientRoot = Utils.normalize(client.root);
                if (
                    !startsWithInsensitive(wksRootN, clientRoot) &&
                    !startsWithInsensitive(clientRoot, wksRootN)
                ) {
                    continue;
                }
                const clientSpec = await p4.client(uri, {
                    name: client.client,
                    output: true,
                });
                if (clientSpec.host?.toUpperCase() !== hostname) {
                    continue;
                }
                this.rootClientMap.set(clientRoot, clientSpec);
            }
        } catch (err) {}
    }

    public static getClient(uri: vscode.Uri): string {
        const fsPath = Utils.normalize(uri.fsPath);

        let inClient: string | undefined;
        let inClientRoot = "";
        this.rootClientMap.forEach((client, clientRoot) => {
            if (!startsWithInsensitive(fsPath, clientRoot)) {
                return;
            }
            if (!inClient || startsWithInsensitive(clientRoot, inClientRoot)) {
                inClient = client.client;
                inClientRoot = clientRoot;
            }
        });

        return inClient ? inClient : "none";
    }
}
