import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {createCollection} from '../../services/new/collection';
import Utils from '../../utils';
import {preparePermissionsResponseAsync} from '../../components/response-presenter';

import {collectionInstanceWithOperation} from './response-models';

const requestSchema = {
    body: z.object({
        title: z.string(),
        description: z.string().optional(),
        parentId: zc.encodedId().nullable(),
        project: z.string().optional()
    }),
};

export type CreateCollectionReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res) => {
    const {body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await createCollection(
            {ctx: req.ctx},
            {
                title: body.title,
                description: body.description,
                parentId: body.parentId,
                project: body.project
            },
        );

        logEvent({
            type: LogEventType.CreateCollectionSuccess,
            ctx: req.ctx,
            reqBody: body,
            collection: result.collection.model,
        });

        const formattedResponse = collectionInstanceWithOperation.format(
            result.collection,
            result.operation,
        );

        const {code, response} = await preparePermissionsResponseAsync({data: formattedResponse});

        if(process.env.NODE_RPC_URL) {
            var token = Utils.getTokenFromContext(req.ctx);
            if(token) {
                await Utils.updateAccesses(token, { id: response.collectionId, '*': true });
            }
        }

        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.CreateCollectionFail,
            ctx: req.ctx,
            reqBody: body,
            error,
        });

        throw error;
    }
};

controller.api = {
    summary: 'Create collection',
    tags: [ApiTag.Collections],
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
            description: collectionInstanceWithOperation.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionInstanceWithOperation.schema.omit({permissions: true}),
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as createCollection};
