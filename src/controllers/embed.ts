import {Request, Response} from '@gravity-ui/expresskit';

import {Utils} from '../utils/utils';

export default async function embedController(req: Request, res: Response) {
    
    if (process.env.NODE_RPC_URL) {
        var r: any = req;
        var token = r.rpc[0].token;

        var embedResult: any = await Utils.getEmbedToken(token, {});
        res.send(embedResult);
    } else {
        res.send('hey');
    }
}
