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
                await workbook.enableAllPermissions();
                return workbook;
            } catch (error) {
                return workbook;
            }
        }),
    );
};
