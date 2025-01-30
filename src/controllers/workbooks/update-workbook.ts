import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {updateWorkbook} from '../../services/new/workbook';

import {WorkbookResponseModel, workbookModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z
        .object({
            title: z.string().optional(),
            description: z.string().optional(),
            project: z.string().optional(),
        })
        .refine(
            ({title, description, project}) => {
                return typeof title === 'string' || typeof description === 'string' || typeof project === 'string';
            },
            {
                message: `The request body must contain either "title" or "description" or "project".`,
            },
        ),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res: Response<WorkbookResponseModel>) => {
    const {body, params} = await parseReq(req);

    const result = await updateWorkbook(
        {
            ctx: req.ctx,
        },
        {
            workbookId: params.workbookId,
            title: body.title,
            description: body.description,
            project: body.project
        },
    );

    res.status(200).send(workbookModel.format(result));
};

controller.api = {
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

controller.manualDecodeId = true;

export {controller as updateWorkbook};
