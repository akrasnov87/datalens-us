import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getCollectionBreadcrumbs} from '../../services/new/collection';

import {collectionInstanceArray} from './response-models';
import { preparePermissionsResponseAsync } from '../../components/response-presenter';

const requestSchema = {
    params: z.object({
        collectionId: zc.encodedId(),
    }),
    query: z.object({
        includePermissionsInfo: zc.stringBoolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getCollectionBreadcrumbsController: AppRouteHandler = async (req, res) => {
    const {params, query} = await parseReq(req);

    const result = await getCollectionBreadcrumbs(
        {ctx: req.ctx},
        {
            collectionId: params.collectionId,
            includePermissionsInfo: query.includePermissionsInfo,
        },
    );

    const formattedResponse = await collectionInstanceArray.format(result);

    const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);

    res.status(code).send(response);
};

getCollectionBreadcrumbsController.api = {
    summary: 'Get collection breadcrumbs',
    tags: [ApiTag.Collections],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: collectionInstanceArray.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionInstanceArray.schema,
                },
            },
        },
    },
};

getCollectionBreadcrumbsController.manualDecodeId = true;
