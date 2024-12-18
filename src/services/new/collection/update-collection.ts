import {AppError} from '@gravity-ui/nodekit';
import {getCollection} from './get-collection';
import {checkCollectionByTitle} from './check-collection-by-title';
import {getParentIds} from './utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../const';
import {raw} from 'objection';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import Utils from '../../../utils';
import {CollectionPermission} from '../../../entities/collection';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionId'],
    properties: {
        collectionId: {
            type: 'string',
        },
        title: {
            type: 'string',
        },
        project: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
    },
});

export interface UpdateCollectionArgs {
    collectionId: string;
    title?: string;
    project?: string | null;
    description?: string;
}

export const updateCollection = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: UpdateCollectionArgs,
) => {
    const {collectionId, title: newTitle, project: newProject, description: newDescription} = args;

    const {
        user: {userId},
        projectId,
        superUser
    } = ctx.get('info');

    const {accessServiceEnabled} = ctx.config;

    ctx.log('UPDATE_COLLECTION_START', {
        collectionId: Utils.encodeId(collectionId),
        newTitle,
        newDescription,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getPrimary(trx);

    const collection = await getCollection(
        {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions: true},
        {collectionId},
    );

    if (accessServiceEnabled && !skipCheckPermissions) {
        let parentIds: string[] = [];

        if (collection.model.parentId !== null) {
            parentIds = await getParentIds({
                ctx,
                trx: targetTrx,
                collectionId: collection.model.parentId,
            });
        }

        await collection.checkPermission({
            parentIds,
            permission: CollectionPermission.Update,
        });
    }

    if (newTitle && newTitle.toLowerCase() !== collection.model.titleLower) {
        const checkCollectionByTitleResult = await checkCollectionByTitle(
            {
                ctx,
                trx: targetTrx,
                skipValidation: true,
                skipCheckPermissions,
            },
            {
                title: newTitle,
                parentId: collection.model.parentId,
            },
        );

        if (checkCollectionByTitleResult === true) {
            throw new AppError(US_ERRORS.COLLECTION_ALREADY_EXISTS, {
                code: US_ERRORS.COLLECTION_ALREADY_EXISTS,
            });
        }
    }

    const patchedCollection = await CollectionModel.query(targetTrx)
        .patch({
            [CollectionModelColumn.Title]: newTitle,
            [CollectionModelColumn.TitleLower]: newTitle?.toLowerCase(),
            [CollectionModelColumn.ProjectId]: superUser ? (newProject || projectId) : projectId,
            [CollectionModelColumn.Description]: newDescription,
            [CollectionModelColumn.UpdatedBy]: userId,
            [CollectionModelColumn.UpdatedAt]: raw(CURRENT_TIMESTAMP),
        })
        .where({
            [CollectionModelColumn.CollectionId]: collectionId,
        })
        .returning('*')
        .first()
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    if (!patchedCollection) {
        throw new AppError(US_ERRORS.COLLECTION_NOT_EXISTS, {
            code: US_ERRORS.COLLECTION_NOT_EXISTS,
        });
    }

    ctx.log('UPDATE_COLLECTION_FINISH', {
        collectionId: Utils.encodeId(patchedCollection.collectionId),
    });

    return patchedCollection;
};
