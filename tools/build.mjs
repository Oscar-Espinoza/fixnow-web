import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { build, transform } from 'esbuild';
import { scan, references, textTypes } from './asset-graph.mjs';
const args=process.argv.slice(2), arg=k=>args[args.indexOf(k)+1];
if(!args.includes('--site'))throw new Error('Required: --site https://hostname');
const site=new URL(arg('--site'));
if(site.protocol!=='https:'||site.pathname!=='/'||site.search||site.hash||site.username||site.password||site.hostname==='example.invalid')throw new Error('Site must be an HTTPS origin');
const SITE_URL=site.origin,staging=args.includes('--staging');
const out=arg('--out')===undefined||!args.includes('--out')?(staging?'dist-staging':'dist'):arg('--out');
if(!['dist','dist-staging'].includes(out))throw new Error('Output must be dist or dist-staging');
const entries=['index.html','privacidad.html','404.html','robots.txt','sitemap.xml','.htaccess','THREE-LICENSE.txt','FONT-LICENSE.txt'];
const graph=await scan('landing',entries);
const bundle=await build({entryPoints:['landing/assets/phone3d.js'],bundle:true,minify:true,format:'esm',target:'es2022',write:false,legalComments:'inline'});
graph.set('assets/phone3d.js',Buffer.from(bundle.outputFiles[0].text));
for(const file of ['styles.css','script.js'])graph.set(file,Buffer.from((await transform(graph.get(file).toString(),{loader:file.endsWith('.css')?'css':'js',minify:true,target:'es2022',legalComments:'inline'})).code));
// Vendor is included by esbuild and is not a separate runtime request.
for(const file of [...graph.keys()])if(file.startsWith('assets/vendor/'))graph.delete(file);
const outputs=new Map(),names=new Map(),active=new Set();
const substitute=s=>s.replaceAll('{{SITE_URL}}',SITE_URL).replaceAll('{{SITE_HOST}}',site.host);
async function emit(file) {
  if(names.has(file))return names.get(file);
  if(active.has(file))throw new Error('Circular asset references: '+file);
  if(!graph.has(file))throw new Error('Missing graph file: '+file);
  active.add(file);let bytes=graph.get(file);
  if(textTypes.test(file)||file==='.htaccess') {
    let content=bytes.toString();
    for(const [original,target] of references(content,file)) {
      // HTML navigation remains stable; root discovery files are never fingerprinted.
      const mapped=entries.includes(target)?target:await emit(target);
      let replacement;
      if(original.startsWith('{{SITE_URL}}/'))replacement='{{SITE_URL}}/'+mapped;
      else if(original.startsWith('/'))replacement='/'+mapped;
      else {replacement=path.posix.relative(path.posix.dirname(file),mapped);if(original.startsWith('./')&&!replacement.startsWith('.'))replacement='./'+replacement;}
      const fragment=original.includes('#')?'#'+original.split('#')[1]:'';
      content=content.split(original).join(replacement+fragment);
    }
    content=substitute(content).replace(/\?v=\d+/g,'');
    if(staging&&file.endsWith('.html'))content=content.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi,'').replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');
    if(staging&&file==='robots.txt')content='User-agent: *\nDisallow: /\n';
    if(staging&&file==='.htaccess')content+='\n<IfModule mod_headers.c>\n  Header always set X-Robots-Tag "noindex, nofollow"\n</IfModule>\n';
    if(content.includes('{{')||content.includes('example.invalid'))throw new Error('Unresolved template: '+file);
    bytes=Buffer.from(content);
  }
  const fingerprint=!entries.includes(file);
  const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const ext=path.posix.extname(file), name=fingerprint?file.slice(0,-ext.length)+'.'+hash+ext:file;
  names.set(file,name);outputs.set(name,bytes);active.delete(file);return name;
}
for(const file of entries)await emit(file);
const runtimeCount=outputs.size;
outputs.set('ASSET-MANIFEST.json',Buffer.from(JSON.stringify(Object.fromEntries([...names].sort()),null,2)+'\n'));
// Only replace generated build directories after the complete graph has validated.
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const [name,bytes]of outputs){await mkdir(path.join(out,path.dirname(name)),{recursive:true});await writeFile(path.join(out,name),bytes);}
let raw=0,gzip=0,br=0;
const rows=[`Site: ${SITE_URL}`,`Staging: ${staging}`,`Node: ${process.version}; esbuild 0.28.2; Three 0.170.0`,'File\tRaw bytes\tGzip bytes\tBrotli bytes'];
for(const [name,bytes]of [...outputs].sort(([a],[b])=>a.localeCompare(b))){const gz=gzipSync(bytes,{level:9}).length,b=brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:11}}).length;raw+=bytes.length;gzip+=gz;br+=b;rows.push(`${name}\t${bytes.length}\t${gz}\t${b}`);}
rows.push(`TOTAL (${outputs.size} listed files)\t${raw}\t${gzip}\t${br}`,'BUILD-REPORT.txt itself is excluded from the table to avoid self-referential sizes.','Compression sizes are modeled; server negotiation requires hosting verification.');
const report=Buffer.from(rows.join('\n')+'\n');
await writeFile(path.join(out,'BUILD-REPORT.txt'),report);
console.log(`${out}: ${outputs.size+1} package files, ${raw+report.length} actual bytes (${runtimeCount} content files); listed content ${gzip} modeled gzip / ${br} modeled Brotli`);
