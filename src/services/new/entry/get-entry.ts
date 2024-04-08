import {AppError} from '@gravity-ui/nodekit';
import {EntryPermissions} from './types';
import {checkFetchedEntry, checkWorkbookIsolation} from './utils';
import {getReplica, checkEntryIdInEmbed} from '../utils';
import {ServiceArgs} from '../types';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {JoinedEntryRevisionFavorite} from '../../../db/presentations/joined-entry-revision-favorite';
import {DlsActions} from '../../../types/models';
import Utils, {logInfo} from '../../../utils';
import {US_ERRORS} from '../../../const';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import OldEntry from '../../../db/models/entry';
import {getWorkbook} from '../workbook';
import {getEntryPermissionsByWorkbook} from '../workbook/utils';
import {registry} from '../../../registry';
import {Feature, isEnabledFeature} from '../../../components/features';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'includePermissionsInfo', 'includeLinks'],
    properties: {
        entryId: {
            type: 'string',
        },
        revId: {
            type: 'string',
        },
        branch: {
            type: 'string',
            enum: ['saved', 'published'],
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        includeLinks: {
            type: 'boolean',
        },
    },
});

export interface GetEntryArgs {
    entryId: string;
    revId?: string;
    branch?: 'saved' | 'published';
    includePermissionsInfo: boolean;
    includeLinks: boolean;
}

// eslint-disable-next-line complexity
export const getEntry = async (
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: GetEntryArgs,
) => {
    const {entryId, revId, branch = 'saved', includePermissionsInfo, includeLinks} = args;

    logInfo(ctx, 'GET_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        revId,
        branch,
        includePermissionsInfo,
        includeLinks,
    });

    const {DLS} = registry.common.classes.get();

    const {isPrivateRoute, user, onlyPublic, onlyMirrored, embeddingInfo} = ctx.get('info');

    if (!skipValidation) {
        validateArgs(args);
    }

    if (embeddingInfo) {
        if (!checkEntryIdInEmbed({embed: embeddingInfo.embed, entryId})) {
            throw new AppError(US_ERRORS.INCORRECT_ENTRY_ID_FOR_EMBED, {
                code: US_ERRORS.INCORRECT_ENTRY_ID_FOR_EMBED,
            });
        }
    }

    const isEmbedding = Boolean(embeddingInfo);

    const joinedEntryRevisionFavorite = await JoinedEntryRevisionFavorite.findOne({
        where: (builder) => {
            builder.where({
                [`${Entry.tableName}.entryId`]: entryId,
                [`${Entry.tableName}.isDeleted`]: false,
            });

            if (revId) {
                builder.andWhere({revId});
            }

            if (onlyPublic) {
                builder.andWhere({public: true});
            }

            if (onlyMirrored) {
                builder.andWhere({mirrored: true});
            }
        },
        joinRevisionArgs: {
            revId,
            branch,
        },
        userLogin: user.login,
        trx: getReplica(trx),
    });

    if (joinedEntryRevisionFavorite) {
        const {isNeedBypassEntryByKey} = registry.common.functions.get();

        const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(
            ctx,
            joinedEntryRevisionFavorite.key as string,
        );

        let dlsPermissions: any; // TODO: Update the type after refactoring DLS.checkPermission(...)
        let iamPermissions: Optional<EntryPermissions>;

        if (joinedEntryRevisionFavorite.workbookId) {
            const checkWorkbookEnabled =
                !isPrivateRoute && !onlyPublic && !onlyMirrored && !isEmbedding;

            if (checkWorkbookEnabled) {
                if (isEnabledFeature(ctx, Feature.WorkbookIsolationEnabled)) {
                    checkWorkbookIsolation({
                        ctx,
                        workbookId: joinedEntryRevisionFavorite.workbookId,
                    });
                }

                const workbook = await getWorkbook(
                    {ctx, trx},
                    {
                        workbookId: joinedEntryRevisionFavorite.workbookId,
                        includePermissionsInfo,
                    },
                );

                if (includePermissionsInfo) {
                    iamPermissions = getEntryPermissionsByWorkbook({
                        ctx,
                        workbook,
                        scope: joinedEntryRevisionFavorite[EntryColumn.Scope],
                    });
                }
            }
        } else {
            const checkPermissionEnabled =
                !dlsBypassByKeyEnabled &&
                !isPrivateRoute &&
                ctx.config.dlsEnabled &&
                !onlyPublic &&
                !onlyMirrored;

            const checkEntryEnabled =
                !isPrivateRoute && !onlyPublic && !onlyMirrored && !isEmbedding;

            if (checkPermissionEnabled) {
                dlsPermissions = await DLS.checkPermission(
                    {ctx, trx},
                    {
                        entryId,
                        action: DlsActions.Execute,
                        includePermissionsInfo,
                    },
                );
            }

            if (checkEntryEnabled) {
                if (isEnabledFeature(ctx, Feature.WorkbookIsolationEnabled)) {
                    checkWorkbookIsolation({
                        ctx,
                        workbookId: null,
                    });
                }

                await checkFetchedEntry(ctx, joinedEntryRevisionFavorite, getReplica(trx));
            }
        }

        let permissions: EntryPermissions = {};
        if (includePermissionsInfo) {
            var context: any = ctx;
            try {
                if(!dlsPermissions && context.appParams.rpc && context.appParams.rpc.length > 0 && context.appParams.rpc[0].token) {
                    dlsPermissions = await enableAllPermissions(ctx, joinedEntryRevisionFavorite)
                }

                permissions = OldEntry.originatePermissions({
                    isPrivateRoute,
                    shared: onlyPublic || isEmbedding,
                    permissions: dlsPermissions,
                    iamPermissions,
                    ctx,
                });
            } catch(e) {
                ctx.logError('GET_ENTRY_ERROR', e);
            }

            if(process.env.NODE_RPC_URL && !dlsPermissions) {
                permissions = {
                    execute: false,
                    read: false,
                    edit: false,
                    admin: false
                }
            }
        }

        ctx.log('GET_ENTRY_SUCCESS');

        return {
            joinedEntryRevisionFavorite,
            permissions,
            includePermissionsInfo,
            includeLinks,
        };
    } else {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }
};

async function enableAllPermissions(context:any, model:any) {

    var response:any = null;
    if(context.appParams.rpc && context.appParams.rpc.length > 0) {
        response = await Utils.getPermissions(context.appParams.rpc[0].token, model);
    }

    var permissions = Object.assign({
        listAccessBindings: true,
        updateAccessBindings: true,
        createCollection: true,
        createWorkbook: true,
        limitedView: true,
        view: true,
        update: true,
        copy: true,
        move: true,
        delete: true,
    }, (response && response.data) ? response.data[0] : {});

    const mappedPermission = {
        execute: permissions.view,
        read: permissions.view,
        edit: permissions.update,
        admin: permissions.updateAccessBindings,
    };

    return mappedPermission;
}
