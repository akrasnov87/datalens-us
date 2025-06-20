import {AppRouteHandler} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import EntryService from '../../services/entry.service';
import {isTrueArg} from '../../utils/env-utils';
import Utils from '../../utils';

export const createEntryController: AppRouteHandler = async (req, res) => {
    const {body} = req;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    const logEventReqParams = {
        workbookId: body.workbookId,
        name: body.name,
        scope: body.scope,
        type: body.type,
        key: body.key,
        recursion: body.recursion,
    };

    try {
        const result = await EntryService.create({
            workbookId: body.workbookId,
            name: body.name,
            scope: body.scope,
            type: body.type,
            key: body.key,
            meta: body.meta,
            recursion: body.recursion,
            hidden: body.hidden,
            mirrored: body.mirrored,
            mode: body.mode,
            data: body.data,
            unversionedData: body.unversionedData,
            links: body.links,
            permissionsMode: body.permissionsMode,
            includePermissionsInfo: isTrueArg(body.includePermissionsInfo),
            initialPermissions: body.initialPermissions,
            initialParentId: body.initialParentId,
            checkServicePlan: body.checkServicePlan,
            checkTenantFeatures: body.checkTenantFeatures,
            ctx: req.ctx,
        });

        logEvent({
            type: LogEventType.CreateEntrySuccess,
            ctx: req.ctx,
            data: result,
            reqParams: logEventReqParams,
        });

        const {code, response} = await prepareResponseAsync({data: result}, req);

        if(process.env.NODE_RPC_URL) {
            var token = Utils.getTokenFromContext(req.ctx);
            if(token && response) {
                var r:any = response;
                await Utils.updateAccesses(token, { id: r.entryId, '*': true });
            }
        }

        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.CreateEntryFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
};
