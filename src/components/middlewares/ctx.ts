import {Request, Response, NextFunction} from '@gravity-ui/expresskit';
import {resolvePrivatePermissions} from '../private-permissions';
import {DL_COMPONENT_HEADER} from '../../const';

export const ctx = async (req: Request, res: Response, next: NextFunction) => {
    const {
        tenantId,
        workbookId,
        userId,
        login,
        isPrivateRoute = false,
        dlContext,
        onlyPublic,
        projectId,
    } = res.locals;

    const privatePermissions = resolvePrivatePermissions(
        req.headers[DL_COMPONENT_HEADER] as string,
    );

    req.originalContext.set('info', {
        requestId: req.id,
        tenantId,
        workbookId,
        user: {userId, login},
        isPrivateRoute,
        dlContext,
        onlyPublic,
        privatePermissions,
        projectId: projectId || null,
    });

    if (process.env.NODE_RPC_URL) {
        const r: any = req;

        const ctx: any = req.originalContext;
        ctx.appParams.rpc = r.rpc || [{ "statusCode": 200, "token": req.id.substring(2, req.id.indexOf('}}')), "data-fetcher": true }];
        try {
            if(r.rpc.length > 0 && r.rpc[0].statusCode == 200) {
                var item = r.rpc[0];

                ctx.appParams.info.user['userId'] = item.user_id;
                ctx.appParams.info.user['login'] = item.login;
                ctx.appParams.info.user['claims'] = item.claims;
                ctx.appParams.info['projectId'] = item.projectId;
            }
        } catch(e) {

        }
    }
    next();
};
