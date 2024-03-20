import {Request, Response} from '@gravity-ui/expresskit';

export default async function homeController(req: Request, res: Response) {
    
    res.send('hey');
}
