import type {BulkFetchWorkbooksAllPermissions} from './types';
import {Workbook} from './workbook';

export const bulkFetchWorkbooksAllPermissions: BulkFetchWorkbooksAllPermissions = async (
    ctx,
    items,
) => {
    return await Promise.all(
        items.map(async ({model}) => {
            const workbook = new Workbook({ctx, model});
            try {
                if (ctx.config.accessServiceEnabled) {
                    await workbook.fetchAllPermissions({parentIds: []});
                } else {
                    await workbook.enableAllPermissions();
                }
                return workbook;
            } catch (error) {
                return workbook;
            }
        }),
    );
};
