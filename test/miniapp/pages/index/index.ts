import { httpCase } from '../../cases/http.test';
Page({
    onLoad() {
        httpCase.runAll();
    }
})