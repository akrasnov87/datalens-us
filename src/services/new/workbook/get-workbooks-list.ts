import {AppError} from '@gravity-ui/nodekit';

import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, US_ERRORS} from '../../../const';
import {CollectionModel} from '../../../db/models/new/collection';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {CollectionPermission} from '../../../entities/collection';
import {WorkbookPermission} from '../../../entities/workbook';
import Utils from '../../../utils';
import {getParents} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

export type OrderField = 'title' | 'createdAt' | 'updatedAt';

export type OrderDirection = 'asc' | 'desc';

export interface GetWorkbookListArgs {
    collectionId: Nullable<string>;
    includePermissionsInfo?: boolean;
    filterString?: string;
    page?: number;
    pageSize?: number;
    orderField?: OrderField;
    orderDirection?: OrderDirection;
    onlyMy?: boolean;
}

export const getWorkbooksList = async (
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbookListArgs,
) => {
    const {
        collectionId,
        includePermissionsInfo = false,
        filterString,
        page = DEFAULT_PAGE,
        pageSize = DEFAULT_PAGE_SIZE,
        orderField = 'title',
        orderDirection = 'asc',
        onlyMy = false,
    } = args;

    ctx.log('GET_WORKBOOKS_LIST_START', {
        collectionId: collectionId ? Utils.encodeId(collectionId) : null,
        filterString,
        page,
        pageSize,
        orderField,
        orderDirection,
    });

    const {accessServiceEnabled} = ctx.config;
    const registry = ctx.get('registry');
    const {Workbook, Collection} = registry.common.classes.get();
    const {bulkFetchWorkbooksAllPermissions} = registry.common.functions.get();

    const {
        tenantId,
        projectId,
        user: {userId, login},
        superUser
    } = ctx.get('info');

    const targetTrx = getReplica(trx);

    let parents: CollectionModel[] = [];

    if (collectionId !== null) {
        parents = await getParents({
            ctx,
            trx: targetTrx,
            collectionIds: [collectionId],
        });

        if (parents.length === 0) {
            throw new AppError(US_ERRORS.COLLECTION_NOT_EXISTS, {
                code: US_ERRORS.COLLECTION_NOT_EXISTS,
            });
        }

        if (accessServiceEnabled && !skipCheckPermissions) {
            const collection = new Collection({
                ctx,
                model: parents[0],
            });

            await collection.checkPermission({
                parentIds: parents.slice(1).map((model) => model.collectionId),
                permission: CollectionPermission.LimitedView,
            });
        }
    }

    var queryBuilder = WorkbookModel.query(targetTrx);
    if(superUser != undefined && !superUser) {
        queryBuilder = queryBuilder.join('dl_access', 'dl_id', 'workbookId')
        .where({'c_login': login})
    }
    
    const workbooksPage = await queryBuilder.select()
        .where({
            [WorkbookModelColumn.TenantId]: tenantId,
            [WorkbookModelColumn.CollectionId]: collectionId,
            [WorkbookModelColumn.DeletedAt]: null,
            ...(superUser ? {} : { [WorkbookModelColumn.ProjectId]: projectId})
        })
        .where((qb) => {
            if (filterString) {
                const preparedFilterString = Utils.escapeStringForLike(filterString.toLowerCase());
                qb.where(WorkbookModelColumn.TitleLower, 'LIKE', `%${preparedFilterString}%`);
            }
            if (onlyMy) {
                qb.where({
                    [WorkbookModelColumn.CreatedBy]: userId,
                });
            }
        })
        .orderBy(
            orderField === 'title' ? WorkbookModelColumn.SortTitle : orderField,
            orderDirection,
        )
        .limit(pageSize)
        .offset(pageSize * page)
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    const nextPageToken = Utils.getOptimisticNextPageToken({
        page,
        pageSize,
        curPage: workbooksPage,
    });

    let workbooks: InstanceType<typeof Workbook>[] = [];

    if (workbooksPage.length > 0) {
        if (accessServiceEnabled && !skipCheckPermissions) {
            const parentIds = parents.map((model) => model.collectionId);

            workbooks = workbooksPage.map((model) => {
                return new Workbook({ctx, model});
            });

            const checkedWorkbooks = await Promise.all(
                workbooks.map(async (workbook) => {
                    try {
                        await workbook.checkPermission({
                            parentIds,
                            permission: WorkbookPermission.LimitedView,
                        });

                        return workbook;
                    } catch (error) {
                        const err = error as AppError;

                        if (err.code === US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED) {
                            return null;
                        }

                        throw error;
                    }
                }),
            );

            workbooks = checkedWorkbooks.filter((workbook) => workbook !== null) as InstanceType<
                typeof Workbook
            >[];

            if (includePermissionsInfo) {
                workbooks = await bulkFetchWorkbooksAllPermissions(
                    ctx,
                    workbooks.map((workbook) => ({
                        model: workbook.model,
                        parentIds,
                    })),
                );
            }
        } else {
            await Promise.all(
                workbooksPage.map(async (model) => {
                    const workbook = new Workbook({ctx, model});
                    try {
                        if (includePermissionsInfo) {
                            await workbook.enableAllPermissions();
                        }

                        if(workbook.permissions?.hidden === true) {
                            return null;
                        }

                        workbooks.push(workbook);
                        return workbook;
                    } catch (error) {
                        workbooks.push(workbook);
                        return workbook;
                    }
                }),
            );
        }
    }

    ctx.log('GET_WORKBOOKS_LIST_FINISH', {
        workbooksCount: workbooks.length,
        nextPageToken,
    });

    return {
        workbooks,
        nextPageToken,
    };
};
