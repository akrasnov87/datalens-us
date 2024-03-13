import type {BulkFetchCollectionsAllPermissions} from './types';
import {Collection} from './collection';

export const bulkFetchCollectionsAllPermissions: BulkFetchCollectionsAllPermissions = async (
    ctx,
    items,
) => {
    return await Promise.all(
        items.map(async ({model}) => {
            const collection = new Collection({ctx, model});
            try {
                await collection.enableAllPermissions();
                return collection;
            } catch (error) {
                return collection;
            }
        }),
    );
};
