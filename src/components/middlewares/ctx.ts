import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {DL_COMPONENT_HEADER} from '../../const';
import {resolvePrivatePermissions} from '../private-permissions';

export const ctx = async (req: Request, res: Response, next: NextFunction) => {
    const {
        tenantId,
        workbookId,
        datasetId,
        userToken,
        userId,
        login,
        isPrivateRoute = false,
        dlContext,
        onlyPublic,
        projectId,
        serviceUser,
        zitadelUserRole,
    } = res.locals;

    const privatePermissions = resolvePrivatePermissions(
        req.headers[DL_COMPONENT_HEADER] as string,
    );

    const user = {userId, login};

    req.originalContext.set('info', {
        requestId: req.id,
        tenantId,
        workbookId,
        datasetId,
        userToken,
        user,
        isPrivateRoute,
        dlContext,
        onlyPublic,
        privatePermissions,
        projectId: projectId || null,
        serviceUser,
        zitadelUserRole,
    });

    if (process.env.NODE_RPC_URL) {
        const r: any = req;

        const ctx: any = req.originalContext;
        ctx.appParams.rpc = r.rpc; // || [{ "statusCode": 200, "token": req.id.substring(2, req.id.indexOf('}}')), "data-fetcher": true }];
        try {
            if(r.rpc.length > 0 && r.rpc[0].statusCode == 200) {
                var item = r.rpc[0];

                ctx.appParams.info.user['userId'] = item.user_id;
                ctx.appParams.info.user['login'] = item.login;
                ctx.appParams.info.user['claims'] = item.claims;
                ctx.appParams.info['projectId'] = item.projectId;
                ctx.appParams.info['superUser'] = item.root;
            }
        } catch(e) {

        }
    }
    req.ctx.log('REQUEST_INFO', {
        ctxTenantId: tenantId,
        ctxProjectId: projectId,
        requestedBy: user,
        dlContext,
    });

    next();
};
