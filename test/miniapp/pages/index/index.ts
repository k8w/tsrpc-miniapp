import { httpCase } from '../../cases/http.test';
import { wsCase } from '../../cases/ws.test';
Page({
    async onLoad() {
        try {
            await httpCase.runAll();
        }
        catch (e) {
            console.error(e)
        }

        try {
            await wsCase.runAll();
        }
        catch (e) {
            console.error(e)
        }
    }
})