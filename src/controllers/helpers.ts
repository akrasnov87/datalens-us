import {db} from '../db';
import {Utils} from '../utils/utils';
import {Request, Response} from '@gravity-ui/expresskit';

export default {
    encodeId: (req: Request, res: Response) => {
        var result: any = Utils.encodeId(req.query['id']);
        res.send({id: result});
    },
    decodeId: (req: Request, res: Response) => {
        var result: any = Utils.decodeId(req.query['id']?.toString() || '');
        res.send({id: result});
    },

    ping: async (_: Request, res: Response) => {
        res.send({result: 'pong'});
    },

    pingDb: async (req: Request, res: Response) => {
        const {ctx} = req;

        try {
            await db.replica.raw('select 1 + 1');

            res.send({result: 'pong-db'});
        } catch (error) {
            ctx.logError('PING_FAILED', error);

            res.status(502).send({result: false});
        }
    },

    pingDbPrimary: async (req: Request, res: Response) => {
        const {ctx} = req;

        try {
            await db.primary.raw('select 1 + 1');

            res.send({result: 'db primary is ok'});
        } catch (error) {
            ctx.logError('PING_FAILED', error);

            res.status(502).send({result: 'db primary is not available'});
        }
    },

    pool: async (req: Request, res: Response) => {
        const {ctx} = req;

        try {
            const primaryPool = db.primary.client.pool;
            const replicaPool = db.replica.client.pool;

            const result = {
                primary: {
                    used: primaryPool.numUsed(),
                    free: primaryPool.numFree(),
                    numPendingAcquires: primaryPool.numPendingAcquires(),
                    numPendingCreates: primaryPool.numPendingCreates(),
                },
                replica: {
                    used: replicaPool.numUsed(),
                    free: replicaPool.numFree(),
                    numPendingAcquires: replicaPool.numPendingAcquires(),
                    numPendingCreates: replicaPool.numPendingCreates(),
                },
            };

            res.send({result});
        } catch (error) {
            ctx.logError('GET_POOL_FAILED', error);

            res.status(502).send({result: false});
        }
    },

    /**
     * Универсальный сервис запросов RPC
     * @param req 
     * @param res 
     */
    universal_service: async (req: Request, res: Response) => {
        if (process.env.NODE_RPC_URL) {
            var r: any = req;
            if(r.rpc[0].statusCode == 200) {
                var token = r.rpc[0].token;
                var body = r.body;
        
                var result: any = await Utils.postData(body.action, body.method, token, body.data || [{}], body.tid || 0);

                res.send(result);
            } else {
                res.status(r.rpc[0].statusCode).send(r.rpc[0]);
            }
        } else {
            res.send('hey');
        }
    }
};
