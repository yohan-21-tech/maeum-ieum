import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(!existsSync('.env')){
 const template=readFileSync('.env.example','utf8');
 writeFileSync('.env',template+'\nDATA_ENCRYPTION_KEY="'+randomBytes(32).toString('base64')+'"\n',{flag:'wx'});
 console.log('Created local .env with a new encryption key. Keep it private and backed up.');
}else console.log('Existing .env preserved. No database records or encryption keys replaced.');
