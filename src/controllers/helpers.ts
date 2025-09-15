import {Request, Response} from '@gravity-ui/expresskit';
import {Utils} from '../utils/utils';

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
        const {db} = ctx.get('registry').getDbInstance();

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
        const {db} = ctx.get('registry').getDbInstance();

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
        const {db} = ctx.get('registry').getDbInstance();

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
                if(body.data.length > 0 && Array.isArray(body.data[0])) {
                    // значит передаётся массив объектов
                    body.data = body.data[0];
                }
                
                for (var i = 0; i < body.data.length; i++) {
                    var item = body.data[i];
                    for (var name in item) {
                        try {
                            // специально прокидываю идентификаторы decode, нужно для фидльтрации безопасности
                            item[`__${name}`] = Utils.decodeId(item[name]);
                        } catch(e) {}
                    }
                }
        
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
