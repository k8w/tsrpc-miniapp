import { EncodeOutput } from 'tsbuffer';
import { ApiService, BaseClient, BaseClientOptions, defaultBaseClientOptions, MsgService, PendingApiItem, TransportDataUtil, TransportOptions } from "tsrpc-base-client";
import { ApiReturn, BaseServiceType, ServiceProto, TsrpcError, TsrpcErrorType } from 'tsrpc-proto';
import { MiniappObj } from './MiniappObj';

/**
 * HTTP Client for TSRPC.
 * It uses `miniappObj.request` to send requests.
 * @typeParam ServiceType - `ServiceType` from generated `proto.ts`
 */
export class HttpClient<ServiceType extends BaseServiceType> extends BaseClient<ServiceType> {

    readonly type = 'SHORT';

    /** @internal */
    miniappObj: MiniappObj;
    private _jsonServer: string;

    readonly options!: HttpClientOptions;
    constructor(proto: ServiceProto<ServiceType>, options?: Partial<HttpClientOptions>) {
        super(proto, {
            ...defaultHttpClientOptions,
            ...options
        });
        this._jsonServer = this.options.server + (this.options.server.endsWith('/') ? '' : '/');

        this.miniappObj = this.options.miniappObj;
        if (!this.miniappObj) {
            throw new Error('options.miniappObj is not set');
        }

        this.logger?.log('TSRPC HTTP Client :', this.options.server);
    }

    /** @internal */
    protected _encodeApiReq(service: ApiService, req: any, pendingItem: PendingApiItem): EncodeOutput {
        if (this.options.json) {
            if (this.options.jsonPrune) {
                let opPrune = this.tsbuffer.prune(req, pendingItem.service.reqSchemaId);
                if (!opPrune.isSucc) {
                    return opPrune;
                }
                req = opPrune.pruneOutput;
            }
            return {
                isSucc: true,
                buf: JSON.stringify(req) as any
            }
        }
        else {
            return TransportDataUtil.encodeApiReq(this.tsbuffer, service, req, undefined);
        }
    }

    /** @internal */
    protected _encodeClientMsg(service: MsgService, msg: any): EncodeOutput {
        if (this.options.json) {
            if (this.options.jsonPrune) {
                let opPrune = this.tsbuffer.prune(msg, service.msgSchemaId);
                if (!opPrune.isSucc) {
                    return opPrune;
                }
                msg = opPrune.pruneOutput;
            }
            return {
                isSucc: true,
                buf: JSON.stringify(msg) as any
            }
        }
        else {
            return TransportDataUtil.encodeClientMsg(this.tsbuffer, service, msg);
        }
    }

    protected async _sendBuf(buf: Uint8Array, options: HttpClientTransportOptions, serviceId: number, pendingApiItem?: PendingApiItem): Promise<{ err?: TsrpcError | undefined; }> {
        let sn = pendingApiItem?.sn;
        let promise = new Promise<{ err?: TsrpcError | undefined; }>(async rs => {
            // Pre Flow
            if (!this.options.json) {
                let pre = await this.flows.preSendBufferFlow.exec({ buf: buf, sn: pendingApiItem?.sn }, this.logger);
                if (!pre) {
                    return;
                }
                buf = pre.buf;
            }

            // Do Send
            this.options.debugBuf && this.logger?.debug('[SendBuf]' + (sn ? (' #' + sn) : ''), `length=${buf.length}`, buf);
            let data: ArrayBuffer | string;
            if (this.options.json) {
                data = buf as any as string;
            }
            else {
                if (buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength) {
                    data = buf.buffer;
                }
                else {
                    data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
                }
            }
            let reqTask = this.miniappObj.request({
                url: this.options.json ? this._jsonServer + this.serviceMap.id2Service[serviceId].name : this.options.server,
                data: data,
                method: 'POST',
                header: {
                    'content-type': this.options.json ? 'application/json' : 'application/octet-stream'
                },
                dataType: '其他',
                responseType: this.options.json ? 'text' : 'arraybuffer',
                success: res => {
                    pendingApiItem && this._onApiRes(res.data as ArrayBuffer | string, pendingApiItem);
                },
                fail: res => {
                    pendingApiItem?.onReturn?.({
                        isSucc: false,
                        err: new TsrpcError({
                            message: 'Network Error',
                            type: TsrpcErrorType.NetworkError,
                            innerErr: res
                        })
                    });
                },
                complete: res => {
                    rs({});
                }
            });

            if (pendingApiItem) {
                pendingApiItem.onAbort = () => {
                    reqTask.abort();
                }
            }
        });

        promise.catch().then(() => {
            if (pendingApiItem) {
                pendingApiItem.onAbort = undefined;
            }
        })

        return promise;
    }

    private async _onApiRes(data: ArrayBuffer | string, pendingApiItem: PendingApiItem) {
        // JSON
        if (this.options.json) {
            let ret: ApiReturn<any>;
            try {
                ret = JSON.parse(data as string);
            }
            catch (e) {
                ret = {
                    isSucc: false,
                    err: {
                        message: e.message,
                        type: TsrpcErrorType.ServerError,
                        responseData: data
                    }
                }
            }
            if (ret.isSucc) {
                if (this.options.jsonPrune) {
                    let opPrune = this.tsbuffer.prune(ret.res, pendingApiItem.service.resSchemaId);
                    if (opPrune.isSucc) {
                        ret.res = opPrune.pruneOutput;
                    }
                    else {
                        ret = {
                            isSucc: false,
                            err: new TsrpcError('Invalid Server Output', {
                                type: TsrpcErrorType.ClientError,
                                innerErr: opPrune.errMsg
                            })
                        }
                    }
                }
            }
            else {
                ret.err = new TsrpcError(ret.err);
            }
            pendingApiItem.onReturn?.(ret);
        }
        // ArrayBuffer
        else {
            this._onRecvBuf(new Uint8Array(data as ArrayBuffer), pendingApiItem);
        }
    }

}

const defaultHttpClientOptions: HttpClientOptions = {
    ...defaultBaseClientOptions,
    server: 'http://127.0.0.1:3000',
    miniappObj: typeof wx !== 'undefined' ? wx : undefined as any,
    json: false,
    jsonPrune: true
}

export interface HttpClientTransportOptions extends TransportOptions {
    /**
     * Event when progress of data sent is changed
     * @param ratio - 0~1
     */
    onProgress: (ratio: number) => void;
}

export interface HttpClientOptions extends BaseClientOptions {
    /** Server URL, starts with `http://` or `https://` */
    server: string;

    /**
     * MiniApp API Object
     * @remarks
     * - Wechat: `wx`
     * - QQ MiniApp: `qq`
     * - ByteDance MiniApp: `tt`
     * @defaultValue `wx`
     */
    miniappObj: any

    /** 
     * Use JSON instead of Buffer
     * @defaultValue `false`
     */
    json: boolean;
    /**
     * Whether to automatically delete excess properties that not defined in the protocol.
     * @defaultValue `true`
     * @internal
     */
    jsonPrune: boolean;
}