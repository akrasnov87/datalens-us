import type {AppContext} from '@gravity-ui/nodekit';
import {AppError} from '@gravity-ui/nodekit';

import {UserRole} from '../../../../components/auth/constants/role';
import {US_ERRORS} from '../../../../const';
import type {CollectionModel} from '../../../../db/models/new/collection';
import {CollectionPermission, Permissions} from '../../../../entities/collection/types';
import {getMockedOperation} from '../../../../entities/utils';
import {ZitadelUserRole} from '../../../../types/zitadel';
import Utils from '../../../../utils';

import {CollectionConstructor, CollectionInstance} from './types';

export const Collection: CollectionConstructor = class Collection implements CollectionInstance {
    ctx: AppContext;
    model: CollectionModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: CollectionModel}) {
        this.ctx = ctx;
        this.model = model;
    }

    private async getRpcAllPermissions() {

        var context: any = this.ctx;
        
        var response:any = null;
        if(context.appParams.rpc && context.appParams.rpc.length > 0) {
            var token = Utils.getTokenFromContext(context);
            if(token) {
                response = await Utils.getPermissions(token, { "id": Utils.encodeId(this.model.collectionId)});
            }
        }

        return Object.assign({
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
    }

    async register() {
        const isEditorOrAdmin = this.isEditorOrAdmin();

        if (!isEditorOrAdmin) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve(getMockedOperation(Utils.encodeId(this.model.collectionId)));
    }

    async checkPermission(args: {
        parentIds: string[];
        permission: CollectionPermission;
    }): Promise<void> {
        const permissions = process.env.NODE_RPC_URL ? await this.getRpcAllPermissions() : this.getAllPermissions();

        if (permissions[args.permission] === false) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve();
    }

    async enableAllPermissions() {
        const permissions = {
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
            hidden: true
        };

        this.permissions = permissions;

        return permissions;
    }

    setPermissions(permissions: Permissions) {
        this.permissions = permissions;
    }

    async deletePermissions(): Promise<void> {
        this.permissions = undefined;
    }

    async fetchAllPermissions() {
        this.permissions = process.env.NODE_RPC_URL ? await this.getRpcAllPermissions() : this.getAllPermissions();
        return Promise.resolve();
    }

    private isEditorOrAdmin() {
        const {isAuthEnabled} = this.ctx.config;
        const user = this.ctx.get('user');
        const {zitadelUserRole} = this.ctx.get('info');
        return isAuthEnabled
            ? (user?.roles || []).some(
                  (role) => role === UserRole.Editor || role === UserRole.Admin,
              )
            : zitadelUserRole === ZitadelUserRole.Editor ||
                  zitadelUserRole === ZitadelUserRole.Admin;
    }

    private getAllPermissions() {
        const isEditorOrAdmin = this.isEditorOrAdmin();

        const permissions = {
            listAccessBindings: true,
            updateAccessBindings: isEditorOrAdmin,
            createCollection: isEditorOrAdmin,
            createWorkbook: isEditorOrAdmin,
            limitedView: true,
            view: true,
            update: isEditorOrAdmin,
            copy: isEditorOrAdmin,
            move: isEditorOrAdmin,
            delete: isEditorOrAdmin,
        };

        return permissions;
    }
};
