import type {Knex} from 'knex';
import {Modifier, TransactionOrKnex, raw} from 'objection';

import {Entry} from '../../models/new/entry';
import {Favorite} from '../../models/new/favorite';
import {RevisionModel} from '../../models/new/revision';
import {
    JoinRevisionArgs,
    JoinedEntryRevision,
    JoinedEntryRevisionColumns,
    joinRevision,
    selectedColumns as joinedEntryRevisionColumns,
} from '../joined-entry-revision';
import {leftJoinFavorite} from '../utils';

export const selectedJoinedEntryRevisionFavoriteColumns = [
    ...joinedEntryRevisionColumns,
    raw(`CASE WHEN ${Favorite.tableName}.entry_id IS NULL THEN FALSE ELSE TRUE END AS is_favorite`),
];

export type JoinedEntryRevisionFavoriteColumns = JoinedEntryRevisionColumns & {
    isFavorite: boolean;
};

export class JoinedEntryRevisionFavorite extends JoinedEntryRevision {
    static find({
        where,
        joinRevisionArgs,
        userLogin,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs: JoinRevisionArgs;
        userLogin: string;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryRevisionFavorite.query(trx)
            .select(selectedJoinedEntryRevisionFavoriteColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .where(where)
            .timeout(JoinedEntryRevisionFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryRevisionFavoriteColumns[]
        >;
    }

    static findOne({
        where,
        joinRevisionArgs,
        userLogin,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs: JoinRevisionArgs;
        userLogin: string;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryRevisionFavorite.query(trx)
            .select(selectedJoinedEntryRevisionFavoriteColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .where(where)
            .first()
            .timeout(JoinedEntryRevisionFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryRevisionFavoriteColumns | undefined
        >;
    }

    static findPage({
        where,
        modify,
        joinRevisionArgs = {},
        userLogin,
        page,
        pageSize,
        trx,
        superUser
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        modify: Modifier;
        joinRevisionArgs?: JoinRevisionArgs;
        userLogin: string;
        page: number;
        pageSize: number;
        trx: TransactionOrKnex;
        superUser?: boolean;
    }) {
        var queryBuilder = JoinedEntryRevisionFavorite.query(trx);

        if(superUser != undefined && !superUser) {
            queryBuilder = queryBuilder.join('dl_access', 'dl_id', 'entry_id')
            .where({'c_login': userLogin});
        }

        return queryBuilder.select(selectedJoinedEntryRevisionFavoriteColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .where(where)
            .modify(modify)
            .limit(pageSize)
            .offset(pageSize * page)
            .timeout(JoinedEntryRevisionFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            (Entry & JoinedEntryRevisionFavoriteColumns)[]
        >;
    }
}
