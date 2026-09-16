'use strict';
// Real mesh rendering. Paint lighting and decal coordinates remain illustrative.
(function(root){
  let enginePromise;
  function engine(){
    if(root.SkinEngine)return Promise.resolve(root.SkinEngine);
    if(!enginePromise)enginePromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='three-engine.js';
      script.onload=()=>root.SkinEngine?resolve(root.SkinEngine):reject(Error('Engine unavailable'));
      script.onerror=()=>{script.remove();enginePromise=null;reject(Error('Engine unavailable'));};
      document.head.appendChild(script);
    });
    return enginePromise;
  }
  function create(host,options){
    let alive=true,scene,renderer,camera,controls,model,T,observer,raf=0,dirty=true;
    let decals=[],textures=new Map(),meshes=[],placements=[],keyLight,rimLight;
    let spinning=false,placing=false,ready=false,revision=0,lastFrame=0,pointerStart;
    const abort=new AbortController(),frontWidth=3.45,frontHeight=frontWidth/1.75;
    const status=text=>{if(alive)options.onStatus(text);};
    const canonical=()=>{const c=new T.OrthographicCamera(-frontWidth/2,frontWidth/2,frontHeight/2,-frontHeight/2,.01,20);c.position.set(0,0,5);c.lookAt(0,0,0);c.updateMatrixWorld();return c;};
    function disposeObject(object){object.traverse(node=>{node.geometry?.dispose();const materials=Array.isArray(node.material)?node.material:[node.material];for(const material of materials){if(!material)continue;for(const value of Object.values(material))if(value?.isTexture)value.dispose();material.dispose();}});}
    function clearDecals(){for(const mesh of decals){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}decals=[];}
    function cast(p,adapt=false){
      const sign=p.face==='back'?-1:1;
      const x=(p.x/100-.5)*frontWidth,y=(.5-p.y/100)*frontHeight;
      const ray=new T.Raycaster(new T.Vector3(x,y,sign*2),new T.Vector3(0,0,-sign));
      let hit=ray.intersectObjects(meshes,false)[0];
      // Existing 2D crafts may have a center just outside the silhouette.
      if(!hit&&adapt){for(const radius of [.035,.07,.12,.18]){for(let i=0;i<16&&!hit;i++){const angle=i*Math.PI/8;ray.ray.origin.set(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,sign*2);hit=ray.intersectObjects(meshes,false)[0];}if(hit)break;}}
      return hit;
    }
    async function texture(url){if(!textures.has(url))textures.set(url,new T.TextureLoader().loadAsync(url).then(map=>{if(!alive){map.dispose();throw Error('Disposed');}map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return map;}));return textures.get(url);}
    async function update(next){
      placements=next.map(p=>({...p}));if(!ready)return;
      const ticket=++revision;clearDecals();let visible=0,adapted=0;
      const prepared=await Promise.all(placements.map(async p=>{try{return {p,map:await texture(p.image)};}catch{return {p};}}));
      if(!alive||ticket!==revision)return;
      for(const {p,map} of prepared){if(!map)continue;const exact=cast(p),hit=exact||cast(p,true);if(!hit)continue;if(!exact)adapted++;
        const normal=hit.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
        const matrix=new T.Matrix4().lookAt(hit.point.clone().add(normal),hit.point,new T.Vector3(0,1,0));
        const rotation=new T.Euler().setFromRotationMatrix(matrix);const q=new T.Quaternion().setFromEuler(rotation).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-p.rotation*Math.PI/180));rotation.setFromQuaternion(q);
        const size=.21*p.scale,geometry=new T.DecalGeometry(hit.object,hit.point,rotation,new T.Vector3(size,size,.045));
        if(!geometry.getAttribute('position').count){geometry.dispose();continue;}
        const material=new T.MeshStandardMaterial({map,transparent:true,alphaTest:.08,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4- visible,roughness:.5,metalness:.05});
        const decal=new T.Mesh(geometry,material);decal.renderOrder=10+visible;scene.add(decal);decals.push(decal);visible++;
      }
      dirty=true;
      status(placements.length?`${visible}/${placements.length} adesivos na superfície${adapted?' · posições 2D adaptadas':''}. Selecione um adesivo abaixo e use “Posicionar” para ajustar.`:'Arraste para girar. Use a roda ou dois dedos para aproximar.');
    }
    function resize(){if(!alive||!renderer)return;const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;}
    function frame(now){if(!alive)return;raf=root.requestAnimationFrame(frame);if(document.hidden){lastFrame=0;return;}const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):0;lastFrame=now;controls.autoRotate=spinning;controls.update(dt);if(dirty||spinning){renderer.render(scene,camera);dirty=false;}}
    function view(side='front'){if(!ready)return;controls.target.set(0,0,0);camera.position.set(side==='detail'?.5:0,side==='detail'?.2:0,side==='back'?-4.3:side==='detail'?2.7:4.3);camera.lookAt(0,0,0);controls.update();dirty=true;}
    function lighting(mode){if(!ready)return;const neon=mode==='neon',soft=mode==='soft';keyLight.color.set(neon?0xff83da:0xffffff);keyLight.intensity=soft?2.2:3.5;rimLight.color.set(neon?0x73e9ff:0xc9faad);rimLight.intensity=neon?4:1.8;dirty=true;}
    function place(event){
      if(!ready||!placing||!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7)return;
      const selected=options.selected();if(!selected){status('Selecione um adesivo na lista antes de posicionar.');return;}
      const rect=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
      const hit=ray.intersectObjects(meshes,false)[0];if(!hit){status('Clique sobre a superfície da arma.');return;}
      const normal=hit.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld));
      if(Math.abs(normal.z)<.2){status('Gire para uma das laterais para posicionar o adesivo.');return;}
      const projected=hit.point.clone().project(canonical()),x=(projected.x+1)*50,y=(1-projected.y)*50;
      if(x<5||x>95||y<7||y>93){status('Escolha uma posição mais próxima ao centro da arma.');return;}
      options.onPlace({x:Math.round(x*100)/100,y:Math.round(y*100)/100,...normal.z<0?{face:'back'}:{face:undefined}});
    }
    (async()=>{
      try{
        T=await engine();if(!alive)return;
        scene=new T.Scene();scene.background=new T.Color(0x14191e);
        renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
        renderer.domElement.setAttribute('aria-label','Modelo 3D da arma. Arraste para girar e use a roda ou pinça para zoom.');renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;host.appendChild(renderer.domElement);
        renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;options.onReady(false);status('O 3D foi interrompido pelo dispositivo. Volte ao 2D ou reabra o 3D.');});
        camera=new T.PerspectiveCamera(35,1,.01,30);camera.position.set(0,0,4.3);
        controls=new T.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.minDistance=1.7;controls.maxDistance=7;controls.autoRotateSpeed=.8;controls.addEventListener('change',()=>{dirty=true;});
        scene.add(new T.HemisphereLight(0xffffff,0x444b59,2));keyLight=new T.DirectionalLight(0xffffff,3.5);keyLight.position.set(-2,4,5);scene.add(keyLight);rimLight=new T.DirectionalLight(0xc9faad,1.8);rimLight.position.set(2,1,-3);scene.add(rimLight);
        const grid=new T.GridHelper(7,28,0x374333,0x252d33);grid.position.y=-.62;scene.add(grid);
        const response=await fetch(options.model,{signal:abort.signal});if(!response.ok)throw Error('Model unavailable');
        const buffer=await response.arrayBuffer();if(!alive)return;
        const gltf=await new T.GLTFLoader().parseAsync(buffer,'');if(!alive){disposeObject(gltf.scene);return;}
        model=gltf.scene;model.rotation.y=-Math.PI/2;model.updateMatrixWorld(true);
        const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3()),scale=2.6/box.getSize(new T.Vector3()).x;
        model.traverse(node=>{if(node.isMesh){node.geometry.applyMatrix4(node.matrixWorld);node.geometry.translate(-center.x,-center.y,-center.z);node.geometry.scale(scale,scale,scale);node.position.set(0,0,0);node.rotation.set(0,0,0);node.scale.set(1,1,1);meshes.push(node);}});
        // Exported assets are a single mesh node, without nested transforms.
        model.rotation.set(0,0,0);scene.add(model);model.updateMatrixWorld(true);ready=true;
        observer=new ResizeObserver(resize);observer.observe(host);resize();view();
        renderer.domElement.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});renderer.domElement.addEventListener('pointerup',place);
        renderer.domElement.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(event.key))return;event.preventDefault();if(event.key==='Home'){view();return;}const spherical=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));if(event.key==='ArrowLeft')spherical.theta-=.12;if(event.key==='ArrowRight')spherical.theta+=.12;if(event.key==='ArrowUp')spherical.phi=Math.max(.15,spherical.phi-.12);if(event.key==='ArrowDown')spherical.phi=Math.min(Math.PI-.15,spherical.phi+.12);if(event.key==='+')spherical.radius=Math.max(1.7,spherical.radius*.9);if(event.key==='-')spherical.radius=Math.min(7,spherical.radius*1.1);camera.position.copy(new T.Vector3().setFromSpherical(spherical).add(controls.target));controls.update();dirty=true;});
        options.onReady(true);await update(placements);raf=root.requestAnimationFrame(frame);
      }catch(error){if(alive){ready=false;options.onReady(false);status('Não foi possível abrir o 3D neste dispositivo. O editor 2D continua disponível. Reabra o 3D para tentar novamente.');}}
    })();
    return {
      update,view,lighting,
      spin(on){spinning=Boolean(on)&&!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;dirty=true;return spinning;},
      placing(on){placing=Boolean(on);host.classList.toggle('is-placing',placing);status(placing?'Clique na lateral da arma para mover o adesivo selecionado. Arraste para girar.':'Arraste para girar. Use a roda ou pinça para zoom.');},
      capture(){if(!ready)return Promise.resolve(null);renderer.render(scene,camera);return new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));},
      destroy(){alive=false;revision++;abort.abort();root.cancelAnimationFrame(raf);observer?.disconnect();controls?.dispose();if(scene){clearDecals();scene.traverse(node=>{if(node.isGridHelper){node.geometry.dispose();node.material.dispose();}});}if(model)disposeObject(model);for(const promise of textures.values())promise.then(map=>map.dispose()).catch(()=>{});renderer?.dispose();renderer?.domElement.remove();}
    };
  }
  root.Viewer3D={create};
})(window);
