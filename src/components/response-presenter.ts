import * as ST from '../types/services.types';
import Utils from '../utils';

export default ({data}: {data: any}, req?: any): ST.ServiceResponse => {
    const response = Utils.encodeData(data);

    if (response.results) {
        response.results = Utils.encodeData(response.results);
    }
    if (response.entries) {
        response.entries = Utils.encodeData(response.entries);
    }
    if (response.workbooks) {
        response.workbooks = Utils.encodeData(response.workbooks);
    }
    if (response.collections) {
        response.collections = Utils.encodeData(response.collections);
    }
    if (response.embed) {
        response.embed = Utils.encodeData(response.embed);
    }
    if (response.chart) {
        response.chart = Utils.encodeData(response.chart);
    }

    if(req) {
        response.permissions = Object.assign(response.permissions || {}, ((req.rpc && req.rpc.length > 0) ? req.rpc[0].permissions : {}));
    }

    return {
        code: 200,
        response,
    };
};
