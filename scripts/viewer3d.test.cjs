const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context={console,AbortController};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../docs/three-engine.js'),'utf8'),context);
const T=context.SkinEngine;
const modelNames=['awp-duality','ak47-neon-rider','m4a1s-decimator','usps-cortex'];
function readModel(name){const bytes=fs.readFileSync(path.join(__dirname,'../docs/models/'+name+'.glb'));const length=bytes.readUInt32LE(12);return {bytes,json:JSON.parse(bytes.subarray(20,20+length)),bin:bytes.subarray(28+length)};}
function sceneFromModel(name){const {json:g,bin}=readModel(name),scene=new T.Group();
 function attribute(id){const a=g.accessors[id],v=g.bufferViews[a.bufferView],count={SCALAR:1,VEC2:2,VEC3:3}[a.type],typed=a.componentType===5126?Float32Array:Uint32Array,data=bin.subarray(v.byteOffset,v.byteOffset+v.byteLength),buffer=Uint8Array.from(data).buffer;return new T.BufferAttribute(new typed(buffer),count);}
 for(const p of g.meshes[0].primitives){const geometry=new T.BufferGeometry();geometry.setAttribute('position',attribute(p.attributes.POSITION));geometry.setAttribute('normal',attribute(p.attributes.NORMAL));geometry.setAttribute('uv',attribute(p.attributes.TEXCOORD_0));geometry.setIndex(attribute(p.indices));scene.add(new T.Mesh(geometry,new T.MeshStandardMaterial()));}return scene;
}
test('four real GLB meshes are self-contained, bounded and contain embedded paint textures',()=>{
 for(const name of modelNames){const {bytes,json:g,bin}=readModel(name);assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(g.buffers[0].byteLength,bin.length);assert.equal(g.meshes.length,1);assert.equal(g.nodes.length,1);assert.ok(bytes.length<1600000);assert.ok(g.images.length);for(const image of g.images){assert.equal(image.uri,undefined);assert.equal(image.mimeType,'image/webp');const view=g.bufferViews[image.bufferView];assert.ok(view.byteOffset+view.byteLength<=bin.length);assert.equal(bin.subarray(view.byteOffset,view.byteOffset+4).toString(),'RIFF');}assert.doesNotMatch(JSON.stringify(g),/[A-Z]:\\|\/Users\//);assert.ok(g.accessors[g.meshes[0].primitives[0].attributes.POSITION].count>10000);}
});
function environment(name,changes={}){
 const handlers={},messages=[],placed=[],renders=[],ready=[];
 const canvas={setAttribute(){},addEventListener(key,fn){handlers[key]=fn;},getBoundingClientRect:()=>({left:0,top:0,width:700,height:400}),remove(){},toBlob(fn){fn({type:'image/png'});}};
 const host={clientWidth:700,clientHeight:400,appendChild(){},classList:{toggle(){}}};
 class Renderer{constructor(){if(changes.webglFailure)throw Error('WebGL missing');this.domElement=canvas;this.capabilities={getMaxAnisotropy:()=>8};}setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);renders.push({scene,camera});}dispose(){}}
 class Controls{constructor(camera){this.camera=camera;this.target=new T.Vector3();}addEventListener(){}update(){this.camera.lookAt(this.target);this.camera.updateMatrixWorld(true);}dispose(){}}
 class Loader{async parseAsync(){return {scene:sceneFromModel(name)};}}
 class TextureLoader{async loadAsync(){if(changes.textureFailure)throw Error('Image unavailable');return new T.Texture();}}
 const root={SkinEngine:{...T,WebGLRenderer:Renderer,OrbitControls:Controls,GLTFLoader:Loader,TextureLoader},requestAnimationFrame:()=>1,cancelAnimationFrame(){},matchMedia:()=>({matches:Boolean(changes.reducedMotion)})};
 const env={window:root,document:{hidden:false},AbortController,ResizeObserver:class{observe(){}disconnect(){}},fetch:async()=>({ok:!changes.modelFailure,arrayBuffer:async()=>new ArrayBuffer(0)})};vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'../docs/viewer3d.js'),'utf8'),env);
 const viewer=root.Viewer3D.create(host,{model:'models/'+name+'.glb',selected:()=>1,onStatus:text=>messages.push(text),onReady:on=>ready.push(on),onPlace:point=>placed.push(point)});
 return {viewer,messages,placed,renders,ready,handlers};
}
async function settle(){for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));}
test('all four models load, accept projected stickers and produce a 3D photo',async()=>{
 for(const name of modelNames){const e=environment(name);await settle();assert.deepEqual(e.ready,[true]);await e.viewer.update([{id:'crown',x:65,y:45,rotation:30,scale:1,image:'assets/crown.png'}]);assert.match(e.messages.at(-1),/1\/1 adesivos/);assert.equal((await e.viewer.capture()).type,'image/png');const decals=e.renders.at(-1).scene.children.filter(n=>n.renderOrder>=10);assert.equal(decals.length,1);assert.ok(decals[0].geometry.getAttribute('position').count>0);assert.ok(new T.Box3().setFromObject(decals[0]).getSize(new T.Vector3()).length()<.5);e.viewer.destroy();}
});
test('existing curated positions in every weapon map to the real surface',async()=>{
 const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/data.js'),'utf8'),c);
 for(let i=0;i<modelNames.length;i++){const e=environment(modelNames[i]);await settle();await e.viewer.update(c.window.CATALOG.skins[i].positions.map(([x,y])=>({id:'crown',x,y,rotation:0,scale:1,image:'assets/crown.png'})));assert.match(e.messages.at(-1),/3\/3 adesivos/,modelNames[i]+': '+e.messages.at(-1));e.viewer.destroy();}
});
test('camera presets, surface click and back stickers use real ray intersections',async()=>{
 const e=environment('ak47-neon-rider');await settle();e.viewer.view('back');e.viewer.placing(true);await e.viewer.capture();const rendered=e.renders.at(-1),camera=rendered.camera;assert.ok(camera.position.z<0);
 const mesh=rendered.scene.children.find(n=>n.children?.some(m=>m.isMesh));const box=new T.Box3().setFromObject(mesh);assert.ok(Math.abs(box.getSize(new T.Vector3()).x-2.6)<.00001);
 // Find a visible lateral surface, project it through the active camera and click it.
 let hit;for(let x=.2;x<.8&&!hit;x+=.02){const ray=new T.Raycaster(new T.Vector3(x,0,-2),new T.Vector3(0,0,1));const candidate=ray.intersectObject(mesh,true)[0];if(candidate&&Math.abs(candidate.face.normal.z)>.2)hit=candidate;}assert.ok(hit);
 const projected=hit.point.clone().project(camera),event={clientX:(projected.x+1)*350,clientY:(1-projected.y)*200};e.handlers.pointerdown(event);e.handlers.pointerup(event);assert.equal(e.placed.length,1);assert.equal(e.placed[0].face,'back');assert.ok(e.placed[0].x>=5&&e.placed[0].x<=95);await e.viewer.update([{...e.placed[0],id:'crown',scale:1,rotation:0,image:'assets/crown.png'}]);assert.match(e.messages.at(-1),/1\/1 adesivos/);e.viewer.destroy();
});
test('WebGL or model failure reports recovery and destroy cancels a pending load',async()=>{
 for(const changes of [{webglFailure:true},{modelFailure:true}]){const e=environment('awp-duality',changes);await settle();assert.deepEqual(e.ready,[false]);assert.match(e.messages.at(-1),/editor 2D continua disponível/);assert.equal(await e.viewer.capture(),null);e.viewer.destroy();}
 const cancelled=environment('awp-duality');cancelled.viewer.destroy();await settle();assert.deepEqual(cancelled.ready,[]);
});
test('missing sticker image is recoverable and reduced motion disables automatic spinning',async()=>{
 const e=environment('usps-cortex',{textureFailure:true,reducedMotion:true});await settle();await e.viewer.update([{id:'crown',x:65,y:45,scale:1,rotation:0,image:'missing.png'}]);assert.match(e.messages.at(-1),/0\/1 adesivos/);assert.equal(e.viewer.spin(true),false);e.viewer.destroy();
});
