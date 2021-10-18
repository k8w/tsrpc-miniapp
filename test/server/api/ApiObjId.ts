import { ApiCall } from "tsrpc";
import { ReqObjId, ResObjId } from "../../protocols/PtlObjId";

export async function ApiObjId(call: ApiCall<ReqObjId, ResObjId>) {
    call.succ({
        id2: call.req.id1
    })
}