import { config } from 'dotenv';
config({ path: `.env.production.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN, MYDB, PORTDB, USERNAMEDB, PASSWORDDB, IP_LOCAL,Token_DrugAllgy,END_POINT } = process.env;
console.log(NODE_ENV)