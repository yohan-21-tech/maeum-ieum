if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
if(!process.env.DATA_ENCRYPTION_KEY||Buffer.from(process.env.DATA_ENCRYPTION_KEY,'base64').length!==32)throw new Error('A 32-byte DATA_ENCRYPTION_KEY is required for production.');
if(process.env.VERCEL&&process.env.DATABASE_URL.startsWith('file:'))throw new Error('Vercel requires hosted PostgreSQL, not local SQLite.');
if(process.env.VERCEL&&!process.env.APP_ORIGIN?.startsWith('https://'))throw new Error('Set APP_ORIGIN to the deployed HTTPS origin.');
console.log('Required production configuration is present.');
