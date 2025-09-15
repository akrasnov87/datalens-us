import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {WorkbookStatus} from '../../db/models/new/workbook/types';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {createWorkbook} from '../../services/new/workbook';
import {preparePermissionsResponseAsync} from '../../components/response-presenter';
import Utils from '../../utils';

import {
    WorkbookInstanceWithOperationResponseModel,
    workbookInstanceWithOperation,
} from './response-models';

const requestSchema = {
    body: z.object({
        collectionId: zc.encodedId().optional().nullable(),
        title: zc.entityName(),
        description: z.string().optional(),
        project: z.string().optional(),
        meta: zc.limitedObject({limit: 3000}).optional(),
        status: z.nativeEnum(WorkbookStatus).optional(),
    }),
};

export type CreateWorkbookReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const createWorkbookController: AppRouteHandler = async (
    req,
    res: Response<WorkbookInstanceWithOperationResponseModel>,
) => {
    const {body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await createWorkbook(
            {
                ctx: req.ctx,
            },
            {
                collectionId: body.collectionId ?? null,
                title: body.title.trim(),
                project: body.project,
                description: body.description?.trim(),
                meta: body.meta,
                status: body.status,
            },
        );

        logEvent({
            type: LogEventType.CreateWorkbookSuccess,
            ctx: req.ctx,
            reqBody: body,
            workbook: result.workbook.model,
        });

        const formattedResponse = workbookInstanceWithOperation.format(result.workbook, result.operation);

        const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);
        if(process.env.NODE_RPC_URL) {
            var token = Utils.getTokenFromContext(req.ctx);
            if(token) {
                await Utils.updateAccesses(token, { id: response.workbookId, '*': true });
            }
        }

        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.CreateWorkbookFail,
            ctx: req.ctx,
            reqBody: body,
            error,
        });

        throw error;
    }
};

createWorkbookController.api = {
    summary: 'Create workbook',
    tags: [ApiTag.Workbooks],
    request: {
        body: {
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: requestSchema.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: workbookInstanceWithOperation.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookInstanceWithOperation.schema.omit({permissions: true}),
                },
            },
        },
    },
};

createWorkbookController.manualDecodeId = true;
