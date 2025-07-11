export enum WorkbookRole {
    LimitedViewer = 'limitedViewer',
    Viewer = 'viewer',
    Editor = 'editor',
    Admin = 'admin',
}

export enum WorkbookPermission {
    ListAccessBindings = 'listAccessBindings',
    UpdateAccessBindings = 'updateAccessBindings',
    LimitedView = 'limitedView',
    CreateCollection = 'createCollection',
    CreateWorkbook = 'createWorkbook',
    View = 'view',
    Update = 'update',
    Copy = 'copy',
    Move = 'move',
    Publish = 'publish',
    Embed = 'embed',
    Delete = 'delete',
    Hidden = 'hidden'
}

export type Permissions = Record<WorkbookPermission, boolean>;
