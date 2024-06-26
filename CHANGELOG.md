# CHANGELOG

## [3.4.16] - 2024-05-05
### Fixed
- Update dependencies `tsbuffer`

## [3.4.13] - 2023-05-23
### Changed
- Update deps (Fixed cocos supporting bug)

## [3.4.12] - 2023-03-21

### Fixed

- Fixed error when reconnect in iOS, metioned [here](https://developers.weixin.qq.com/community/develop/doc/000400144bc200c468984764851c00)

## [3.4.11] - 2022-11-26

### Changed

- Update deps

## [3.4.8] - 2022-10-19

### Fixed

- Update to `tsrpc-base-client@2.1.10`

## [3.4.7] - 2022-10-15

### Fixed

- Issue that `ws.onClose` is not called when `wsClient.disconnect()` manually at CocosCreator Android platform.
- Issue that the name of Api cannot be the same with it of Msg when using `WsClient` in JSON mode.

## [3.4.6] - 2022-09-28

### Fixed

- Fixed issue that `logLevel` not works

## [3.4.5] - 2022-08-10

### Fixed

- Ignore incoming data after heartbeat timeout

## [3.4.2] - 2022-08-05

### Added

- Protect `WebSocketProxy.onClose` executed duplicately.

### Fixed

- Bug: `WebSocketProxy.onClose` is not executed when heartbeat timeout when WIFI is broken

## [3.4.1] - 2022-06-25

### Added

- New client flow: `preRecvMsgFlow` and `postRecvMsgFlow`

## [3.4.0] - 2022-06-14

### Changed

- Update `ws.onError`
- Update deps

## [3.3.0] - 2022-04-15

### Added

- Builtin heartbeat support
- New options `logApi` and `logMsg`
- New options `logLevel`

## [3.2.3] - 2022-04-11

### Fixed

- `new HttpClient()` in non-miniapp envioronment will not throw an error any more, the error would be delayed until `callApi()`

## [3.2.2] - 2022-03-21

### Fixed

- `postDisconnectFlow` not executed when `disconnect()` manually

## [3.2.0] - 2022-02-26

### Added

- Support using `keyof`
- Support type alias and `keyof` in `Pick` and `Omit`
- Support `Pick<Intersection>` and `Omit<Intersection>`
- Support `interface` extends Mapped Type, like `Pick` `Omit`
- Support `Pick<XXX, keyof XXX>`
- Support `Pick<XXX, TypeReference>`
- Support `Pick<UnionType>` and `Pick<IntersectionType>`, the same to `Omit`
- Support reference enum value as literal type,like:
  ```ts
  export enum Types {
    Type1,
    Type2,
  }
  export interface Obj {
    type: Types.Type1;
    value: string;
  }
  ```

### Changed

- `SchemaType` switched to class

## [3.1.4] - 2021-12-19

### Added

- `WsServer` now support client use `buffer` as transfering format when server set `json: true`

## [3.1.3] - 2021-12-03

### Added

- log `[SendMsgErr]`

## [3.1.2] - 2021-11-17

## Changed

- Update dependencies

## [3.1.0] - 2021-11-08

### Added

- JSON 模式支持增强类型的传输，如 `ArrayBuffer`、`Date`、`ObjectId`
- WebSocket 支持 JSON 格式传输

## [3.0.11] - 2021-10-18

### Added

- 增加对 `mongodb/ObjectId` 的编解码支持

## [3.0.10] - 2021-10-13

### Changed

- `HttpClient` and `WsClient` no longer have default type param

## [3.0.6] - 2021-09-01

### Fixed

- `HttpProxy` 检查返回码是否为 200
- 修复 Cocos 3.2 新版本无法 import 的问题
- 更新 `tsrpc-base-client` 修复一些问题

## [3.0.5] - 2021-08-14

### Changed

- `callApi` 返回错误非业务错误时，通过 `logger.error` 打印日志而不是 `logger.log`。
- handler of `client.listenMsg` changed to `(msg, msgName, client)=>void`
