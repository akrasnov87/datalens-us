import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getWorkbook} from '../../services/new/workbook';

import {WorkbookInstanceResponseModel, workbookInstance} from './response-models';
import { preparePermissionsResponseAsync } from '../../components/response-presenter';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    query: z.object({
        includePermissionsInfo: zc.stringBoolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getWorkbookController: AppRouteHandler = async (
    req,
    res: Response<WorkbookInstanceResponseModel>,
) => {
    const {params, query} = await parseReq(req);

    const result = await getWorkbook(
        {
            ctx: req.ctx,
        },
        {
            workbookId: params.workbookId,
            includePermissionsInfo: query.includePermissionsInfo,
        },
    );

    const formattedResponse = workbookInstance.format(result);

    const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);
    
    res.status(code).send(response);
};

getWorkbookController.api = {
    summary: 'Get workbook',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: `${workbookInstance.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookInstance.schema,
                },
            },
        },
    },
};

getWorkbookController.manualDecodeId = true;
