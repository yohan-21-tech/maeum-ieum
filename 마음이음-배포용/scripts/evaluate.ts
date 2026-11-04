import assert from 'node:assert/strict';
import fixtures from '../data/evaluation.json';
import {findLawSources} from '../lib/laws';
async function main(){
 let passed=0;
 for(const row of fixtures){const ids=(await findLawSources(row.query,row.date)).map(s=>s.id);if(row.expected.length)for(const expected of row.expected)assert.ok(ids.includes(expected),`${row.query}: missing ${expected}`);else assert.deepEqual(ids,[],row.query);assert.ok(!ids.includes('teacher-status-19-future'),'future revision must be excluded');passed++;}
 console.log(JSON.stringify({passed,total:fixtures.length,kind:'curated retrieval/date regression',notMeasured:['legal accuracy','real-world outcomes','LLM quality']},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
