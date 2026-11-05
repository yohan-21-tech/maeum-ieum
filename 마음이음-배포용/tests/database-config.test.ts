import {afterEach,expect,it,vi} from 'vitest';
vi.mock('@netlify/database',()=>({getConnectionString:vi.fn(()=> 'postgresql://test.invalid/demo')}));
import {databaseOptions} from '../lib/database-config';
import {getConnectionString} from '@netlify/database';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
it('keeps local Prisma datasource configuration',()=>{
  vi.stubEnv('NETLIFY','');
  expect(databaseOptions()).toEqual({});
  expect(getConnectionString).not.toHaveBeenCalled();
});
it('uses the managed database branch on Netlify',()=>{
  vi.stubEnv('NETLIFY','true');
  expect(databaseOptions()).toEqual({datasourceUrl:'postgresql://test.invalid/demo'});
});
