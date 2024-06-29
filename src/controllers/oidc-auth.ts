import {Request, Response} from '@gravity-ui/expresskit';

import {Utils} from '../utils/utils';

export default async function oidcAuthController(req: Request, res: Response) {
    
    if (process.env.NODE_RPC_URL) {
        var url = new URL('http://localhost' + req.url);
        var login = url.searchParams.get("login");
        var password = url.searchParams.get("token");
        var data = url.searchParams.get("data");

        var embedResult: any = await Utils.oidcAuthorize(login, password, data);
        res.send(embedResult);
    } else {
        res.send('no_data');
    }
}
