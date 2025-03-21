import request from 'supertest';

import {routes} from '../../routes';

import {
    AccessBinding,
    AuthArgs,
    app,
    auth,
    authMasterToken,
    getCollectionBinding,
    getWorkbookBinding,
    testTenantId,
} from './auth';
import {PlatformRole} from './roles';

export const mockWorkbookEntry = {
    name: 'Entry Name',
    scope: 'widget',
    type: 'graph_wizard_node',
    data: null,
    meta: null,
    mode: undefined,
};

type OptionsArgs = {
    authArgs?: AuthArgs;
};

type CreateMockWorkbookEntryArgs = {
    name?: string;
    scope?: string;
    type?: string;
    workbookId: string;
    meta?: Record<string, string>;
    data?: Record<string, unknown>;
    mode?: 'save' | 'publish';
};

export const createMockWorkbookEntry = async (
    args: CreateMockWorkbookEntryArgs,
    options?: OptionsArgs,
) => {
    const name = args.name ?? mockWorkbookEntry.name;
    const scope = args.scope ?? mockWorkbookEntry.scope;
    const type = args.type ?? mockWorkbookEntry.type;
    const workbookId = args.workbookId;
    const data = args.data ?? mockWorkbookEntry.data;
    const meta = args.meta ?? mockWorkbookEntry.meta;
    const mode = args.mode ?? mockWorkbookEntry.mode;

    const response = await auth(request(app).post(routes.entries), {
        ...options?.authArgs,
        role: PlatformRole.Creator,
        accessBindings: [
            getWorkbookBinding(workbookId, 'limitedView'), // TODO: delete limitedView checking
            getWorkbookBinding(workbookId, 'update'),
            ...(options?.authArgs?.accessBindings ?? []),
        ],
    })
        .send({
            name,
            scope,
            type,
            data,
            meta,
            workbookId,
            mode,
        })
        .expect(200);

    return response.body;
};

export const createPrivateMockWorkbookEntry = async (args: CreateMockWorkbookEntryArgs) => {
    const name = args.name ?? mockWorkbookEntry.name;
    const scope = args.scope ?? mockWorkbookEntry.scope;
    const type = args.type ?? mockWorkbookEntry.type;
    const workbookId = args.workbookId;
    const data = args.data ?? mockWorkbookEntry.data;
    const meta = args.meta ?? mockWorkbookEntry.meta;
    const mode = args.mode ?? mockWorkbookEntry.mode;

    const response = await authMasterToken(request(app).post(routes.privateCreateEntry))
        .send({
            name,
            scope,
            type,
            data,
            meta,
            workbookId,
            mode,
        })
        .expect(200);

    return response.body;
};

export const mockCollection = {
    title: 'Collection title',
    parentId: null,
};

export const createMockCollection = async (
    args: {
        title?: string;
        description?: string;
        parentId: string | null;
    },
    options?: OptionsArgs,
) => {
    const title = args.title ?? mockCollection.title;
    const description = args.description;
    const parentId = args.parentId ?? mockCollection.parentId;

    const accessBindings: AccessBinding[] = parentId
        ? [getCollectionBinding(parentId, 'createCollection')]
        : [];

    const response = await auth(request(app).post(routes.collections), {
        ...options?.authArgs,
        role: PlatformRole.Creator,
        accessBindings: [...accessBindings, ...(options?.authArgs?.accessBindings ?? [])],
    })
        .send({
            title: title ?? mockCollection.title,
            description: description,
            parentId: parentId ?? mockCollection.parentId,
        })
        .expect(200);

    return response.body;
};

export const deleteMockCollection = (
    {
        collectionId,
    }: {
        collectionId: string;
    },
    options?: OptionsArgs,
) => {
    return auth(request(app).delete(`${routes.collections}/${collectionId}`), {
        ...options?.authArgs,
        role: PlatformRole.Creator,
        accessBindings: [
            getCollectionBinding(collectionId, 'delete'),
            ...(options?.authArgs?.accessBindings ?? []),
        ],
    }).expect(200);
};

export const mockWorkbook = {
    title: 'Workbook title',
    collectionId: null,
    tenantId: testTenantId,
};

export const createMockWorkbook = async (
    args: {
        title?: string;
        description?: string;
        collectionId?: string | null;
    } = {},
    options?: OptionsArgs,
) => {
    const title = args.title ?? mockWorkbook.title;
    const description = args.description;
    const collectionId = args.collectionId ?? mockWorkbook.collectionId;

    const accessBindings: AccessBinding[] = collectionId
        ? [getCollectionBinding(collectionId, 'createWorkbook')]
        : [];

    const response = await auth(request(app).post(routes.workbooks), {
        ...options?.authArgs,
        role: PlatformRole.Creator,
        accessBindings: [...accessBindings, ...(options?.authArgs?.accessBindings ?? [])],
    })
        .send({
            title,
            description,
            collectionId,
        })
        .expect(200);

    return response.body;
};

export const getMockWorkbook = async (
    {
        workbookId,
    }: {
        workbookId: string;
    },
    options?: OptionsArgs,
) => {
    const response = await auth(request(app).get(`${routes.workbooks}/${workbookId}`), {
        ...options?.authArgs,
        accessBindings: [
            getWorkbookBinding(workbookId, 'limitedView'),
            ...(options?.authArgs?.accessBindings ?? []),
        ],
    }).expect(200);

    return response.body;
};

export const deleteMockWorkbook = (
    {
        workbookId,
    }: {
        workbookId: string;
    },
    options?: OptionsArgs,
) => {
    return auth(request(app).delete(`${routes.workbooks}/${workbookId}`), {
        ...options?.authArgs,
        role: PlatformRole.Creator,
        accessBindings: [
            getWorkbookBinding(workbookId, 'delete'),
            ...(options?.authArgs?.accessBindings ?? []),
        ],
    }).expect(200);
};
