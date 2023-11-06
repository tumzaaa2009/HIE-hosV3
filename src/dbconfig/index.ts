const mysql = require('mysql2');
import { MYDB, PORTDB, USERNAMEDB, PASSWORDDB, IP_LOCAL } from '@config';
const pool = mysql.createPool({
  host: IP_LOCAL,
  user: USERNAMEDB,
  database: MYDB,
  password: PASSWORDDB,
  port:3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
});


export default pool;
