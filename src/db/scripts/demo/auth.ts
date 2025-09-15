require('dotenv').config();
require('../../../index');
import * as fs from 'fs';
import {Model} from '../../index';

const PATH_TO_DATA = `${__dirname}/../../../../../scripts/demo/auth-data.sql`;

(async function () {
    try {
        await Model.db.ready();

        const result = await Model.db.primary.raw(
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
            let rawData = sqlData;
            if(`${process.env.POSTGRES_USER}`) {
                rawData = sqlData.replace(/OWNER TO "pg-user"/g, `OWNER TO "${process.env.POSTGRES_USER}"`);
                console.debug(`change owner to ${process.env.POSTGRES_USER}`);
            }

            await Model.db.primary.raw(rawData);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
