require('dotenv').config();
require('../../../index');
import * as fs from 'fs';
import {db} from '../../index';

const PATH_TO_DATA = `${__dirname}/../../../../../scripts/demo/auth-data.sql`;

(async function () {
    try {
        await db.ready();

        const result = await db.primary.raw(
            `SELECT EXISTS (
                SELECT FROM 
                    pg_tables
                WHERE 
                    schemaname = 'core' AND 
                    tablename  = 'pd_users'
                );;`,
        );

        if (result && result.rows && result.rows[0] && result.rows[0].exists === false) {
            const sqlData = fs.readFileSync(PATH_TO_DATA, 'utf8').toString().trim();
            await db.primary.raw(sqlData);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();