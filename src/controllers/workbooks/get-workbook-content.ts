import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import {getWorkbookContent} from '../../services/new/workbook';

import {WorkbookContentModel, workbookContentModel} from './response-models';
import { preparePermissionsResponseAsync } from '../../components/response-presenter';
import Utils from '../../utils';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    query: z.object({
        includePermissionsInfo: zc.stringBoolean().optional(),
        createdBy: z.string().optional(),
        scope: z
            .nativeEnum(EntryScope)
            .or(z.array(z.nativeEnum(EntryScope)))
            .optional(),
        filters: z
            .object({
                name: z.string().optional(),
            })
            .optional(),
        orderBy: z
            .object({
                field: z.enum(['name', 'createdAt']),
                direction: z.enum(['asc', 'desc']),
            })
            .optional(),
        page: zc.stringNumber({min: 0}).optional(),
        pageSize: zc.stringNumber({min: 1, max: 200}).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getWorkbookContentController: AppRouteHandler = async (
    req,
    res: Response<WorkbookContentModel>,
) => {
    const {params, query} = await parseReq(req);

    const result = await getWorkbookContent(
        {ctx: req.ctx},
        {
            workbookId: params.workbookId,
            includePermissionsInfo: query.includePermissionsInfo,
            page: query.page,
            pageSize: query.pageSize,
            createdBy: query.createdBy,
            orderBy: query.orderBy,
            filters: query.filters,
            scope: query.scope,
        },
    );

    const formattedResponse = await workbookContentModel.format(result);

    const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);

    var context: any = req.ctx;
            
    var entries = await Promise.all(
        response.entries.map(async (entry: any) => {
            var responsePermissions:any = null;
            if(context.appParams.rpc && context.appParams.rpc.length > 0) {
                var token = Utils.getTokenFromContext(context);
                if(token) {
                    responsePermissions = await Utils.getPermissions(token, {id: entry.entryId });
                    if(responsePermissions && responsePermissions.data && responsePermissions.data[0].hidden == false) {
                        return entry;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            } else {
                return entry;
            }
        })
    );

    response.entries = [];
    for(var i in entries) {
        if(entries[i]) {
            response.entries.push(entries[i]);
        }
    }

    res.status(200).send(response);
};

getWorkbookContentController.api = {
    summary: 'Get workbook content',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: `${workbookContentModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookContentModel.schema,
                },
            },
        },
    },
};

getWorkbookContentController.manualDecodeId = true;
