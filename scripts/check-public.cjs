const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const issues=[];
const forbidden=[/(^|\/)\.env($|\.)/i,/(^|\/)(\.openai|\.codex|\.sites-runtime)(\/|$)/,/\.(pem|key|p12|pfx)$/i];
const secrets=[/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{30,}/,/sk-(?:proj-)?[A-Za-z0-9_-]{30,}/,/AKIA[0-9A-Z]{16}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
for(const file of new Set(files)){if(forbidden.some(r=>r.test(file))){issues.push(file+': arquivo privado');continue;}if(file.endsWith('.png'))continue;let body;
if(file.endsWith('.glb')){try{const bytes=fs.readFileSync(path.join(root,file));if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(8)!==bytes.length)throw Error();body=bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8');const model=JSON.parse(body);if(model.images.some(image=>image.uri)||model.buffers.some(buffer=>buffer.uri))issues.push(file+': referência externa no modelo');}catch{issues.push(file+': GLB inválido');continue;}}
else body=fs.readFileSync(path.join(root,file),'utf8');if(secrets.some(r=>r.test(body)))issues.push(file+': possível segredo');if(/[A-Z]:[\\/](?:Users|Documents and Settings)[\\/]/i.test(body)||/\/Users\/[^/]+\//.test(body))issues.push(file+': caminho pessoal absoluto');if(/appg(?:prj|dep|ver)_/.test(body))issues.push(file+': identificador interno');}
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'docs/data.js'),'utf8'),context);
const catalog=context.window.CATALOG;
for(const item of [...catalog.skins,...catalog.stickers]){if(!fs.existsSync(path.join(root,'docs',item.image)))issues.push('Asset ausente: '+item.image);}
for(const item of catalog.skins){if(!item.model||!fs.existsSync(path.join(root,'docs',item.model)))issues.push('Modelo ausente: '+item.weapon);for(const id of [...item.match,...item.contrast])if(!catalog.stickers.some(s=>s.id===id))issues.push('Sugestão inválida: '+id);}
for(const file of ['app.js','data.js','craft.js','viewer3d.js','three-engine.js']){try{new vm.Script(fs.readFileSync(path.join(root,'docs',file),'utf8'));}catch{issues.push('Sintaxe inválida: '+file);}}
if(!fs.existsSync(path.join(root,'docs/index.html'))||!fs.existsSync(path.join(root,'docs/style.css')))issues.push('Entrada ou estilo ausente');
if(issues.length){console.error(issues.join('\n'));process.exit(1);}console.log('Verificado: '+new Set(files).size+' arquivos; sem padrões detectados de segredo/caminho privado; assets, sugestões e sintaxe válidos. Revisão do diff ainda necessária.');
