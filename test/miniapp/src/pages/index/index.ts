import { kunit as httpCase } from '../../cases/http.test';
import { kunit as httpJsonCase } from '../../cases/httpJSON.test';
import { kunit as wsCase } from '../../cases/ws.test';
Page({
    async onLoad() {
        console.warn('================ HTTP START ================')
        await httpCase.runAll();
        console.warn('================ HTTP END ================')

        console.warn('================ HTTP JSON START ================')
        await httpJsonCase.runAll();
        console.warn('================ HTTP JSON END ================')

        console.warn('================ WS START ================')
        await wsCase.runAll();
        console.warn('================ WS END ================')
    }
})