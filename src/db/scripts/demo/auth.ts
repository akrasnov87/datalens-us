require('dotenv').config();

import '../../../index';
import * as fs from 'fs';
import {registry} from '../../../registry';

const PATH_TO_DATA = `${__dirname}/../../../../../scripts/demo/auth-data.sql`;

if (require.main === module) {
    const {db} = registry.getDbInstance();

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
                let rawData = sqlData;
                if(`${process.env.POSTGRES_USER}`) {
                    rawData = sqlData.replace(/OWNER TO "pg-user"/g, `OWNER TO "${process.env.POSTGRES_USER}"`);
                    console.debug(`change owner to ${process.env.POSTGRES_USER}`);
                }

                await db.primary.raw(rawData);
            }

            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })();
}
