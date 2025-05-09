import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getCollection} from '../../services/new/collection';
import {preparePermissionsResponseAsync} from '../../components/response-presenter';

import {collectionInstance} from './response-models';

const requestSchema = {
    params: z.object({
        collectionId: zc.encodedId(),
    }),
    query: z.object({
        includePermissionsInfo: zc.stringBoolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getCollectionController: AppRouteHandler = async (req, res) => {
    const {params, query} = await parseReq(req);

    const result = await getCollection(
        {ctx: req.ctx},
        {
            collectionId: params.collectionId,
            includePermissionsInfo: query.includePermissionsInfo,
        },
    );

    const formattedResponse = collectionInstance.format(result);

    const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);

    res.status(code).send(response);
};

getCollectionController.api = {
    summary: 'Get collection',
    tags: [ApiTag.Collections],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: collectionInstance.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionInstance.schema,
                },
            },
        },
    },
};

getCollectionController.manualDecodeId = true;
