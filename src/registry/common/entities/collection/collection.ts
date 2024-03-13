import type {AppContext} from '@gravity-ui/nodekit';
import type {CollectionModel} from '../../../../db/models/new/collection';
import {CollectionConstructor, CollectionInstance} from './types';
import {Permissions} from '../../../../entities/collection/types';
import {Utils} from '../../../../utils/utils';

export const Collection: CollectionConstructor = class Collection implements CollectionInstance {
    ctx: AppContext;
    model: CollectionModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: CollectionModel}) {
        this.ctx = ctx;
        this.model = model;
    }

    async register() {}

    async checkPermission() {}

    async fetchAllPermissions() {}

    setPermissions(permissions: Permissions) {
        this.permissions = permissions;
    }

    async enableAllPermissions() {
        var context: any = this.ctx;
        
        var response:any = null;
        if(context.appParams.rpc && context.appParams.rpc.length > 0) {
            response = await Utils.getPermissions(context.appParams.rpc[0].token, this.model);
        }

        this.permissions = Object.assign({
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
        }, response.data ? response.data[0] : {});
    }
};
