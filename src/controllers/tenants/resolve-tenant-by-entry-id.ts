import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {resolveTenantByEntryId} from '../../services/new/tenants';

import {tenantModel} from './response-models';
import { preparePermissionsResponseAsync } from '../../components/response-presenter';

export const requestSchema = {
    query: z.object({
        entryId: zc.encodedId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const resolveTenantByEntryIdController: AppRouteHandler = async (req, res) => {
    const {query} = await parseReq(req);

    const result = await resolveTenantByEntryId({ctx: req.ctx}, {entryId: query.entryId});

    const formattedResponse = tenantModel.format(result);
    const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse}, req);
    res.status(code).send(response);
};

resolveTenantByEntryIdController.api = {
    summary: 'Resolve tenant by entryId',
    deprecated: true,
    tags: [ApiTag.Tenants],
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: `${tenantModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: tenantModel.schema,
                },
            },
        },
    },
};

resolveTenantByEntryIdController.manualDecodeId = true;
