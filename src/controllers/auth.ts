import {Request, Response} from '@gravity-ui/expresskit';

import {Utils} from '../utils/utils';

export default async function authController(req: Request, res: Response) {
    
    if (process.env.NODE_RPC_URL) {
        var url = new URL('http://localhost' + req.url);
        var login = url.searchParams.get("login");
        var password = url.searchParams.get("password");

        var embedResult: any = await Utils.authorize(login, password);
        res.send(embedResult);
    } else {
        res.send('no_data');
    }
}
