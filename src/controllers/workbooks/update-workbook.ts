import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {WorkbookStatus} from '../../db/models/new/workbook/types';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {updateWorkbook} from '../../services/new/workbook';

import {WorkbookResponseModel, workbookModel} from './response-models';
import { preparePermissionsResponseAsync } from '../../components/response-presenter';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z
        .object({
            title: zc.entityName().optional(),
            description: z.string().optional(),
            project: z.string().optional(),
            status: z.nativeEnum(WorkbookStatus).optional(),
            meta: zc.limitedObject({limit: 3000}).optional(),
        })
        .refine(
            ({title, description, project, status, meta}) => {
                return (
                    typeof title === 'string' ||
                    typeof description === 'string' ||
                    typeof project === 'string' ||
                    status !== undefined ||
                    meta !== undefined
                );
            },
            {
                message: `The request body must contain at least one of the following fields: "title", "description", "project", "status", or "meta".`,
            },
        ),
};

export type UpdateWorkbookReqParams = z.infer<typeof requestSchema.params>;

export type UpdateWorkbookReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const updateWorkbookController: AppRouteHandler = async (
    req,
    res: Response<WorkbookResponseModel>,
) => {
    const {body, params} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await updateWorkbook(
            {
                ctx: req.ctx,
            },
            {
                workbookId: params.workbookId,
                title: body.title?.trim(),
                description: body.description?.trim(),
                project: body.project,
                status: body.status,
                meta: body.meta,
            },
        );

        logEvent({
            type: LogEventType.UpdateWorkbookSuccess,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            workbook: result,
        });

        const formattedResponse = workbookModel.format(result);
        const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);
        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.UpdateWorkbookFail,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            error,
        });

        throw error;
    }
};

updateWorkbookController.api = {
    summary: 'Update workbook',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
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
            description: workbookModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookModel.schema,
                },
            },
        },
    },
};

updateWorkbookController.manualDecodeId = true;
