import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
export const textTypes = /\.(?:html|css|js|mjs|json|svg|webmanifest|xml|txt|htaccess)$/;
const assetEnd = /\.(?:html|css|js|mjs|json|svg|webp|png|jpe?g|ico|woff2|webmanifest|xml|txt)(?:[?#].*)?$/i;
export function references(text, file) {
  // Expand the controller's literal prefix concatenations before scanning strings.
  for (const m of text.matchAll(/const\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g)) {
    text = text.replace(new RegExp(m[1]+"\\s*\\+\\s*(['\"])([^'\"]+)\\1", 'g'), (_,q,s)=>q+m[2]+s+q);
  }
  const found = new Map();
  const candidates = [...text.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`\n]*)`/g)].map(m=>m[1]??m[2]??m[3]);
  for(const m of text.matchAll(/(?:src|href|data-src)\s*=\s*["']([^"']+)["']/g))candidates.push(m[1]);
  candidates.push(...[...text.matchAll(/url\(\s*([^\s)'"]+)\s*\)/g)].map(m=>m[1]));
  // srcset entries can contain several URLs in one quoted attribute.
  for (const m of text.matchAll(/srcset\s*=\s*["']([^"']+)["']/g)) candidates.push(...m[1].split(',').map(x=>x.trim().split(/\s+/)[0]));
  for (const original of candidates) {
    let value = original.replaceAll('&amp;', '&');
    if (value.startsWith('{{SITE_URL}}/')) value=value.slice('{{SITE_URL}}'.length);
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value) || !assetEnd.test(value)) continue;
    const bare=value.split(/[?#]/)[0];
    const target=path.posix.normalize(value.startsWith('/')?bare.slice(1):path.posix.join(path.posix.dirname(file),bare));
    if (target==='..'||target.startsWith('../')) throw new Error('Reference escapes source: '+original);
    found.set(original,target);
  }
  return found;
}
export async function scan(root, entries) {
  const files=new Map();
  async function visit(file) {
    if(files.has(file))return;
    const full=path.join(root,file);let bytes;
    try { if(!(await stat(full)).isFile())throw new Error(); bytes=await readFile(full); }
    catch {throw new Error('Missing referenced file: '+file);}
    files.set(file,bytes);
    if(textTypes.test(file)||file==='.htaccess')for(const ref of references(bytes.toString(),file).values())await visit(ref);
  }
  for(const entry of entries)await visit(entry);
  return files;
}
if(process.argv[1]?.endsWith('asset-graph.mjs')) {
  const graph=await scan('landing',['index.html','privacidad.html',...(await stat('landing/404.html').catch(()=>null)?['404.html']:[])]);
  console.log(JSON.stringify({files:[...graph.keys()].sort(),bytes:[...graph.values()].reduce((s,b)=>s+b.length,0)},null,2));
}
