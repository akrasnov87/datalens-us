import type {AppContext} from '@gravity-ui/nodekit';
import type {WorkbookModel} from '../../../../db/models/new/workbook';
import {AppError} from '@gravity-ui/nodekit';
import {WorkbookConstructor, WorkbookInstance} from './types';
import {Permissions, WorkbookPermission} from '../../../../entities/workbook/types';
import {US_ERRORS} from '../../../../const';
import {ZitadelUserRole} from '../../../../types/zitadel';
import {getMockedOperation} from '../../../../entities/utils';
import Utils from '../../../../utils';

export const Workbook: WorkbookConstructor<WorkbookInstance> = class Workbook
    implements WorkbookInstance
{
    ctx: AppContext;
    model: WorkbookModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: WorkbookModel}) {
        this.ctx = ctx;
        this.model = model;
    }

    private async getRpcAllPermissions() {
        var context: any = this.ctx;
        
        var response:any = null;
        if(context.appParams.rpc && context.appParams.rpc.length > 0) {
            var token = Utils.getTokenFromContext(context);
            if(token) {
                response = await Utils.getPermissions(token, { "id": Utils.encodeId(this.model.workbookId)});
            }
        }
        return Object.assign({
            listAccessBindings: true,
            updateAccessBindings: true,
            limitedView: true,
            view: true,
            update: true,
            copy: true,
            move: true,
            publish: true,
            embed: true,
            delete: true,
        }, (response && response.data) ? response.data[0] : {});
    }

    private isEditorOrAdmin() {
        const {zitadelUserRole: role, superUser} = this.ctx.get('info');
        return role === ZitadelUserRole.Editor || role === ZitadelUserRole.Admin || superUser;
    }

    private getAllPermissions() {
        const isEditorOrAdmin = this.isEditorOrAdmin();

        const permissions = {
            listAccessBindings: true,
            updateAccessBindings: isEditorOrAdmin,
            limitedView: true,
            view: true,
            update: isEditorOrAdmin,
            copy: isEditorOrAdmin,
            move: isEditorOrAdmin,
            publish: isEditorOrAdmin,
            embed: isEditorOrAdmin,
            delete: isEditorOrAdmin,
        };

        return permissions;
    }

    async register() {
        const isEditorOrAdmin = this.isEditorOrAdmin();

        if (!isEditorOrAdmin) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve(getMockedOperation(Utils.encodeId(this.model.workbookId)));
    }

    async checkPermission(args: {
        parentIds: string[];
        permission: WorkbookPermission;
    }): Promise<void> {
        const permissions = process.env.NODE_RPC_URL ? await this.getRpcAllPermissions() : this.getAllPermissions();

        if (permissions[args.permission] === false) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve();
    }

    async fetchAllPermissions(): Promise<void> {
        this.permissions = process.env.NODE_RPC_URL ? await this.getRpcAllPermissions() : this.getAllPermissions();
        return Promise.resolve();
    }

    setPermissions(permissions: Permissions) {
        this.permissions = permissions;
    }

    async deletePermissions(): Promise<void> {
        this.permissions = undefined;
    }

    enableAllPermissions() {
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
        };

        return permissions;
    }
};
