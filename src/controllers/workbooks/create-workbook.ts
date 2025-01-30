import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {createWorkbook} from '../../services/new/workbook';
import {prepareResponseAsync} from '../../components/response-presenter';
import Utils from '../../utils';

import {
    WorkbookInstanceWithOperationResponseModel,
    workbookInstanceWithOperation,
} from './response-models';

const requestSchema = {
    body: z.object({
        collectionId: zc.encodedId().optional().nullable(),
        title: z.string(),
        description: z.string().optional(),
        project: z.string().optional()
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (
    req,
    res: Response<WorkbookInstanceWithOperationResponseModel>,
) => {
    const {body} = await parseReq(req);

    const result = await createWorkbook(
        {
            ctx: req.ctx,
        },
        {
            collectionId: body.collectionId ?? null,
            title: body.title,
            project: body.project,
            description: body.description,
        },
    );

    const formattedResponse = workbookInstanceWithOperation.format(result.workbook, result.operation);

    const {code, response} = await prepareResponseAsync({data: formattedResponse}, req);
        if(process.env.NODE_RPC_URL) {
            var token = Utils.getTokenFromContext(req.ctx);
            if(token) {
                await Utils.updateAccesses(token, { id: response.workbookId, '*': true });
            }
        }

        res.status(code).send(response);
};

controller.api = {
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
            project: workbookInstanceWithOperation.schema.projectId ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookInstanceWithOperation.schema.omit({permissions: true}),
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as createWorkbook};
