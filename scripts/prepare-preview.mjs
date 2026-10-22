import fs from 'node:fs/promises';
await fs.mkdir('dist',{recursive:true});
for(const name of await fs.readdir('.'))if(/\.(html|css|js|svg|txt|xml)$/.test(name))await fs.copyFile(name,'dist/'+name);
await fs.cp('assets','dist/assets',{recursive:true});
console.log('Preview files ready.');
