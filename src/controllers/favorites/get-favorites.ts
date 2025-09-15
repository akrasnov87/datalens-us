import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import {getFavorites} from '../../services/new/favorites/get-favorites';

import {favoriteEntryModelArray} from './response-models';
import { preparePermissionsResponseAsync } from '../../components/response-presenter';

const requestSchema = {
    query: z.object({
        orderBy: z
            .object({
                field: z.enum(['name', 'createdAt']),
                direction: z.enum(['asc', 'desc']),
            })
            .optional(),
        filters: z
            .object({
                name: z.string().optional(),
            })
            .optional(),
        page: zc.stringNumber({min: 0}).optional(),
        pageSize: zc.stringNumber({min: 1, max: 200}).optional(),
        scope: z
            .nativeEnum(EntryScope)
            .or(z.array(z.nativeEnum(EntryScope)))
            .optional(),
        includePermissionsInfo: zc.stringBoolean().optional(),
        ignoreWorkbookEntries: zc.stringBoolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getFavoritesController: AppRouteHandler = async (req, res) => {
    const {query} = await parseReq(req);
    const {orderBy, filters, page, pageSize, scope, includePermissionsInfo, ignoreWorkbookEntries} =
        query;

    const result = await getFavorites(
        {
            ctx: req.ctx,
        },
        {
            orderBy,
            filters,
            page,
            pageSize,
            scope,
            includePermissionsInfo,
            ignoreWorkbookEntries,
        },
    );
    
    const formattedResponse = await favoriteEntryModelArray.format(result);
    const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);
    res.status(code).send(response);
};

getFavoritesController.api = {
    tags: [ApiTag.Favorites],
    summary: 'Get favorites',
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: `${favoriteEntryModelArray.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: favoriteEntryModelArray.schema,
                },
            },
        },
    },
};

getFavoritesController.manualDecodeId = true;
