import * as ST from '../types/services.types';
import Utils from '../utils';

/** @deprecated use prepareResponseAsync */
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

export async function prepareResponseAsync<T extends any = any>({
    data,
}: {
    data: T;
}, req?: any, entryId?: any): Promise<ST.ServiceResponse<T>> {
    const response = await Utils.macrotasksEncodeData(data);

    if (response.results) {
        response.results = await Utils.macrotasksEncodeData(response.results);
    }
    if (response.entries) {
        response.entries = await Utils.macrotasksEncodeData(response.entries);
    }
    if (response.workbooks) {
        response.workbooks = await Utils.macrotasksEncodeData(response.workbooks);
    }
    if (response.collections) {
        response.collections = await Utils.macrotasksEncodeData(response.collections);
    }
    if (response.items) {
        response.items = await Utils.macrotasksEncodeData(response.items);
    }
    if (response.embed) {
        response.embed = await Utils.macrotasksEncodeData(response.embed);
    }
    if (response.chart) {
        response.chart = await Utils.macrotasksEncodeData(response.chart);
    }
    if (response.entry) {
        response.entry = await Utils.macrotasksEncodeData(response.entry);
    }

    if(req) {
        try {
            response.permissions = Object.assign(response.permissions || {}, ((req.rpc && req.rpc.length > 0 && req.rpc[0].permissions) ? req.rpc[0].permissions : await enableAllPermissions(req.ctx, entryId)));
        }catch(exc) {
            console.log(exc);
        }
    }
    
    if (response.relations) {
        response.relations = await Utils.macrotasksEncodeData(response.relations);
    }

    return {
        code: 200,
        response,
    };
}

export async function preparePermissionsResponseAsync<T extends any = any>({
    data,
}: {
    data: T;
}, req?: any): Promise<ST.ServiceResponse<T>> {
    // const response = await Utils.macrotasksEncodeData(data);

    // if (response.results) {
    //     response.results = await Utils.macrotasksEncodeData(response.results);
    // }
    // if (response.entries) {
    //     response.entries = await Utils.macrotasksEncodeData(response.entries);
    // }
    // if (response.workbooks) {
    //     response.workbooks = await Utils.macrotasksEncodeData(response.workbooks);
    // }
    // if (response.collections) {
    //     response.collections = await Utils.macrotasksEncodeData(response.collections);
    // }
    // if (response.items) {
    //     response.items = await Utils.macrotasksEncodeData(response.items);
    // }
    // if (response.embed) {
    //     response.embed = await Utils.macrotasksEncodeData(response.embed);
    // }
    // if (response.chart) {
    //     response.chart = await Utils.macrotasksEncodeData(response.chart);
    // }
    // if (response.entry) {
    //     response.entry = await Utils.macrotasksEncodeData(response.entry);
    // }

    var response: any = data;
    if(req) {
        response.permissions = Object.assign(response.permissions || {}, ((req.rpc && req.rpc.length > 0) ? req.rpc[0].permissions : {}));
    }
    
    // if (response.relations) {
    //     response.relations = await Utils.macrotasksEncodeData(response.relations);
    // }

    return {
        code: 200,
        response,
    };
}

async function enableAllPermissions(context:any, entryId?: any) {
    if(!entryId) {
        return {};
    }

    var response:any = null;
    if(context.appParams.rpc && context.appParams.rpc.length > 0) {
        var token = Utils.getTokenFromContext(context);
        if(token) {
            response = await Utils.getPermissions(context.appParams.rpc[0].token, { id: entryId });
        }
    }

    var permissions = Object.assign({
        listAccessBindings: true,
        updateAccessBindings: true,
        createCollection: true,
        createWorkbook: true,
        limitedView: true,
        view: true,
        update: true,
        copy: true,
        move: true,
        delete: true,
    }, (response && response.data) ? response.data[0] : {});

    const mappedPermission = {
        execute: permissions.view,
        read: permissions.view,
        edit: permissions.update,
        admin: permissions.updateAccessBindings,
    };

    return mappedPermission;
}