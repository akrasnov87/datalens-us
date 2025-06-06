import {AppContext, AppError} from '@gravity-ui/nodekit';

import {OrganizationPermission} from '../../../components/iam';
import {US_ERRORS} from '../../../const';
import {ServiceArgs} from '../types';
import { Utils } from '../../../utils/utils';

export const getRootCollectionPermissions = async ({ctx}: ServiceArgs) => {
    ctx.log('GET_ROOT_COLLECTION_PERMISSIONS_START');

    const {accessServiceEnabled} = ctx.config;

    var result = {
        createCollectionInRoot: true,
        createWorkbookInRoot: true,
    };

    var context: any = ctx;
    if(context.appParams && context.appParams.rpc && context.appParams.rpc.length) {
        try {
            var token = Utils.getTokenFromContext(context);
            if(token) {
                var response: any = await Utils.getPermissions(token, { id: 'rootCollection' });
                result = Object.assign(result, response.data ? response.data[0] : {});
            }
        } catch(e) {
            ctx.logError('GET_PERMISSION_RPC', e);
        }
    }

    if (accessServiceEnabled && !process.env.NODE_RPC_URL) {
        const [createCollectionInRoot, createWorkbookInRoot] = await Promise.all([
            checkCreateCollectionInRoot(ctx),
            checkCreateWorkbookInRoot(ctx),
        ]);

        result.createCollectionInRoot = createCollectionInRoot;
        result.createWorkbookInRoot = createWorkbookInRoot;
    }

    ctx.log('GET_ROOT_COLLECTION_PERMISSIONS_FINISH');

    return result;
};

async function checkCreateCollectionInRoot(ctx: AppContext) {
    const registry = ctx.get('registry');
    const {checkOrganizationPermission} = registry.common.functions.get();
    try {
        await checkOrganizationPermission({
            ctx,
            permission: OrganizationPermission.CreateCollectionInRoot,
        });

        return true;
    } catch (error: unknown) {
        const err = error as AppError;
        if (err.code === US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED) {
            return false;
        } else {
            throw error;
        }
    }
}

async function checkCreateWorkbookInRoot(ctx: AppContext) {
    const registry = ctx.get('registry');
    const {checkOrganizationPermission} = registry.common.functions.get();
    try {
        await checkOrganizationPermission({
            ctx,
            permission: OrganizationPermission.CreateWorkbookInRoot,
        });

        return true;
    } catch (error: unknown) {
        const err = error as AppError;
        if (err.code === US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED) {
            return false;
        } else {
            throw error;
        }
    }
}
