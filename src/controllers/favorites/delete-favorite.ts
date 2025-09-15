import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {deleteFavorite} from '../../services/new/favorites/delete-favorite';

import {favoriteModelArray} from './response-models';
import { preparePermissionsResponseAsync } from '../../components/response-presenter';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const deleteFavoriteController: AppRouteHandler = async (req, res) => {
    const {params} = await parseReq(req);
    const {entryId} = params;

    const result = await deleteFavorite({ctx: req.ctx}, {entryId});

    const formattedResponse = await favoriteModelArray.format(result);
    const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);
    res.status(code).send(response);
};

deleteFavoriteController.api = {
    tags: [ApiTag.Favorites],
    summary: 'Delete entry from favorites',
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: `${favoriteModelArray.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: favoriteModelArray.schema,
                },
            },
        },
    },
};

deleteFavoriteController.manualDecodeId = true;
