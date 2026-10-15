import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import {references,scan,textTypes} from './asset-graph.mjs';
for(const [dir,site,staging]of [['dist','https://fixnow.com.ar',false],['dist-staging','https://mediumpurple-pig-827825.hostingersite.com',true]]){
 const manifest=JSON.parse(await readFile(dir+'/ASSET-MANIFEST.json','utf8'));
 for(const [source,name] of Object.entries(manifest)){
  const bytes=await readFile(dir+'/'+name),hex=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  if(/\.[a-f0-9]{12}\./.test(name))assert.ok(name.includes('.'+hex+'.'),name+' incorrect hash');
  if(textTypes.test(name)||name==='.htaccess'){
   const text=bytes.toString();assert.ok(!text.includes('{{')&&!text.includes('example.invalid'),name+' has template');assert.ok(!/\?v=\d/.test(text),name+' has legacy token');
   const local=text.replaceAll(site,'{{SITE_URL}}');
   for(const target of references(local,name).values())await stat(path.join(dir,target));
  }
 }
 const index=await readFile(dir+'/index.html','utf8'),privacy=await readFile(dir+'/privacidad.html','utf8'),htaccess=await readFile(dir+'/.htaccess','utf8'),robots=await readFile(dir+'/robots.txt','utf8');
 assert.match(index,/<title>Servicio técnico iPhone en CABA \| FixNow<\/title>/);
 const graph=JSON.parse(index.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);assert.equal(graph['@graph'].length,5);assert.equal(graph['@graph'].filter(x=>x['@type']==='LocalBusiness').length,4);assert.ok(!index.includes('aggregateRating'));
 assert.equal((index.match(/data-service-panel=/g)||[]).length,6);
 for(const node of graph['@graph'])assert.match(node.telephone,/^\+5411\d{8}$/);
 const organization=graph['@graph'].find(x=>x['@type']==='Organization');
 assert.equal(organization.email,'fixnow.ar@gmail.com');
 assert.equal(organization.telephone,'+541156327284');
 const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday'];
 const spec=(dayOfWeek,opens,closes)=>({'@type':'OpeningHoursSpecification',dayOfWeek,opens,closes});
 const branchSchedules={
  'FixNow Belgrano':[spec(weekdays,'10:00','19:00')],
  'FixNow Villa Urquiza':[spec(weekdays.slice(0,4),'11:30','19:00'),spec(['Friday'],'12:00','19:00'),spec(['Saturday'],'12:00','15:00')],
  'FixNow Villa Crespo':[spec(weekdays,'10:00','19:00'),spec(['Saturday'],'11:00','16:00')],
  'FixNow Recoleta':[spec(weekdays,'10:00','18:00'),spec(['Saturday'],'10:00','16:00')]
 };
 for(const [name,schedule] of Object.entries(branchSchedules)){
  const branch=graph['@graph'].find(x=>x.name===name);
  assert.deepEqual(branch.openingHoursSpecification,schedule,name+' schedule');
  assert.ok(!branch.address.postalCode);
 }
 assert.equal((index.match(/class="branch-photo"/g)||[]).length,8);
 for(const slug of ['belgrano','villa-urquiza','villa-crespo','recoleta'])assert.ok(manifest['assets/branch-'+slug+'.webp']);
 assert.equal((index.match(/mailto:fixnow\.ar@gmail\.com/g)||[]).length,2);
 assert.equal((index.match(/https:\/\/maps\.app\.goo\.gl\/UuMmBuNvhXpXYEUr6/g)||[]).length,3);
 assert.equal((index.match(/WhatsApp 11 2842-0033/g)||[]).length,2);
 assert.ok(!index.includes('tel:+541128420033'));
 assert.match(index,/data-service-panel="2"[^]*?data-detail="time">Entre 1 y 3 h según el modelo</);
 for(const file of ['index.html','privacidad.html','404.html']){
  const html=await readFile(dir+'/'+file,'utf8');if(staging)assert.match(html,/<meta name="robots" content="noindex,nofollow">/);assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com/.test(html));
 }
 if(staging){assert.match(robots,/Disallow: \//);assert.match(htaccess,/X-Robots-Tag "noindex, nofollow"/)}else{assert.ok(!htaccess.includes('X-Robots-Tag'));assert.match(robots,/Allow: \//);assert.match(privacy,/noindex,follow/);assert.ok(!index.includes('noindex'));}
 assert.equal(Object.keys(manifest).some(x=>x.startsWith('assets/vendor')),false);assert.equal(Object.keys(manifest).some(x=>x.endsWith('.png')&&x.startsWith('assets/phone-')),false);
 console.log('PASS',dir,Object.keys(manifest).length,'content hashes and complete references, SEO/staging/allowlist');
}
// This should fail on a missing reference without modifying source/build directories.
const {mkdtemp,writeFile,rm}=await import('node:fs/promises');const tmp=await mkdtemp('/tmp/fixnow-build-negative-');await writeFile(tmp+'/index.html','<img src="missing.webp">');await assert.rejects(()=>scan(tmp,['index.html']),/Missing referenced file/);await rm(tmp,{recursive:true});console.log('PASS missing-reference negative check');
