import {Request, Response, NextFunction} from '@gravity-ui/expresskit';
import {isAuthFeature} from '../features';

export const rpcAuthorization = (req: Request, res: Response, next: NextFunction) => {
    //console.log(`WATCH_URL ${req.method} ${req.url} ${JSON.stringify(req.headers)}`);
    req.ctx.log(`WATCH_URL ${req.method} ${req.url} ${JSON.stringify(req.headers)}`);

    isAuthFeature(req, res, (status: number, responseData: any) => {
        if (status == 200 || req.url.indexOf('/auth') >= 0) {
            const r: any = req;
            r.rpc = responseData;

            next();
        } else {
            req.ctx.logError('NOT_RPC_AUTHORIZATION');
            res.status(401).send({code: 'NOT_RPC_AUTHORIZATION'});
        }
    });
};
