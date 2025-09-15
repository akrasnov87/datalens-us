import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {CONTENT_TYPE_JSON} from '../../const';
import {getRootCollectionPermissions} from '../../services/new/collection';

import {rootPermissions} from './response-models';
import { preparePermissionsResponseAsync } from '../../components/response-presenter';

export const getRootPermissionsController: AppRouteHandler = async (req, res) => {
    const result = await getRootCollectionPermissions({ctx: req.ctx});

    const formattedResponse = rootPermissions.format(result);

    const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);

    res.status(code).send(response);
};

getRootPermissionsController.api = {
    summary: 'Get root permissions',
    tags: [ApiTag.Collections],
    responses: {
        200: {
            description: rootPermissions.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: rootPermissions.schema,
                },
            },
        },
    },
};
