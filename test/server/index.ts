import * as path from "path";
import { HttpServer, PrefixLogger, TerminalColorLogger, WsServer } from 'tsrpc';
import { serviceProto } from '../protocols/proto';
let server = new HttpServer(serviceProto, {
    cors: '*',
    port: 3000,
    logger: new PrefixLogger({
        logger: new TerminalColorLogger(),
        prefixs: ['[HTTP]']
    }),
    jsonEnabled: true
})
server.autoImplementApi(path.resolve(__dirname, 'api'));
server.start();

let wsServer = new WsServer(serviceProto, {
    port: 4000,
    logger: new PrefixLogger({
        logger: new TerminalColorLogger(),
        prefixs: ['[WS]']
    })
})
wsServer.autoImplementApi(path.resolve(__dirname, 'api'));
wsServer.listenMsg('Chat', async call => {
    call.conn.sendMsg('Chat', {
        ...call.msg,
        userName: 'System',
        time: 111
    });

    setTimeout(() => {
        call.conn.sendMsg('Chat', {
            ...call.msg,
            userName: 'System',
            time: 222
        });
    }, 200);

    await new Promise<void>(rs => {
        setTimeout(() => {
            rs();
        }, 1000)
    })
})
wsServer.start();