// Photo-textured, limited-angle 3D assembly from the user's edited references.
import * as THREE from './vendor/three.module.min.js';
const PARTS=['display','battery','back','port','camera','board'];
const DISPLAY_CLOSED_SCALE=1.035,DISPLAY_CLOSED_X=.035;
// Cache both download and image decode by resolved URL across both renderer scenes.
const resourcePromises=new Map();
function resource(url,texture){
  const key=String(url);
  if(!resourcePromises.has(key))resourcePromises.set(key,(async()=>{
    const response=await fetch(key);if(!response.ok)throw new Error('Asset unavailable: '+key);
    const blob=await response.blob();
    if(!texture)return JSON.parse(await blob.text());
    const href=URL.createObjectURL(blob);
    try{return await new THREE.TextureLoader().loadAsync(href);}finally{URL.revokeObjectURL(href);}
  })().catch(error=>{resourcePromises.delete(key);throw error;}));
  return resourcePromises.get(key);
}
// Completed-file progress is monotonic and independent of compressed Content-Length.
async function loadSet(urls,indices,onProgress=()=>{}){
  const assets=[];let complete=0;onProgress(0);
  await Promise.all(indices.map(async i=>{assets[i]=await resource(urls[i],/\.webp(?:\?|$)/.test(String(urls[i])));onProgress(++complete/indices.length*.99);}));
  return assets;
}
const diagnosticURLs=[
new URL('./phone-photo-atlas.webp',import.meta.url),
  new URL('./phone-photo-shapes.json',import.meta.url),
  new URL('./phone-repair-atlas.webp',import.meta.url),
  new URL('./phone-repair-shapes.json',import.meta.url),
  new URL('./phone-opening-atlas-v3.webp',import.meta.url),
  new URL('./phone-opening-shapes-v3.json',import.meta.url),
  new URL('./phone-internals-atlas-v2.webp',import.meta.url),
  new URL('./phone-internals-shapes-v2.json',import.meta.url),
  new URL('./phone-diagnostic-front-v2.webp',import.meta.url),
  new URL('./phone-diagnostic-front-shapes-v2.json',import.meta.url),
  new URL('./phone-back-glass-removable-broken-v1.webp',import.meta.url),
  new URL('./phone-back-glass-removable-broken-v1.json',import.meta.url),
  new URL('./phone-back-frame-v1.webp',import.meta.url),
  new URL('./phone-back-frame-v1.json',import.meta.url),
  new URL('./phone-back-glass-removable-new-v1.webp',import.meta.url),
  new URL('./phone-back-glass-removable-new-v1.json',import.meta.url),
  new URL('./phone-diagnostic-front-norearcam-v1.webp',import.meta.url),
  new URL('./phone-diagnostic-front-norearcam-v1.json',import.meta.url),
  new URL('./phone-rear-camera-detached-v1.webp',import.meta.url),
  new URL('./phone-rear-camera-detached-v1.json',import.meta.url),
  new URL('./phone-rear-camera-bracket-v1.webp',import.meta.url),
  new URL('./phone-rear-camera-bracket-v1.json',import.meta.url),
  new URL('./phone-diagnostic-front-nofrontcam-v1.webp',import.meta.url),
  new URL('./phone-diagnostic-front-nofrontcam-v1.json',import.meta.url),
  new URL('./phone-front-camera-inside-v1.webp',import.meta.url),
  new URL('./phone-front-camera-inside-v1.json',import.meta.url),
  new URL('./phone-battery-unit-v2.webp',import.meta.url),
  new URL('./phone-battery-unit-v2.json',import.meta.url),
  new URL('./phone-back-camera-broken-v1.webp',import.meta.url),
  new URL('./phone-back-camera-broken-v1.json',import.meta.url),
  new URL('./phone-back-glass-new-v1.webp',import.meta.url),
  new URL('./phone-back-glass-new-v1.json',import.meta.url)
];
const commonIndices=[0,1,4,5,6,7,8,9,26,27];
const issueIndices={0:[],1:[2,3],2:[10,11,12,13,14,15],3:[2,3],5:[]};
function loadAssets(index=0,side='rear',onProgress){
  const specific=index===4?(side==='front'?[22,23,24,25]:[16,17,18,19,20,21,28,29,30,31]):issueIndices[index]||[];
  return loadSet(diagnosticURLs,[...commonIndices,...specific],onProgress);
}
const heroURLs=[
new URL('./phone-photo-atlas.webp',import.meta.url),
  new URL('./phone-photo-shapes.json',import.meta.url),
  new URL('./phone-hero-backglass-v10.webp',import.meta.url),
  new URL('./phone-hero-backglass-shapes-v10.json',import.meta.url),
  new URL('./phone-hero-components-v3.webp',import.meta.url),
  new URL('./phone-hero-components-shapes-v3.json',import.meta.url),
  new URL('./phone-display-frameless-v1.webp',import.meta.url),
  new URL('./phone-display-frameless-v1.json',import.meta.url),
  new URL('./phone-hero-front-v6.webp',import.meta.url),
  new URL('./phone-hero-front-shapes-v6.json',import.meta.url)
];
function loadHeroAssets(onProgress){return loadSet(heroURLs,heroURLs.map((_,i)=>i),onProgress);}
function studioTexture(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
  const g=ctx.createLinearGradient(0,0,0,256);g.addColorStop(0,'#59616d');g.addColorStop(.5,'#c5bdc1');g.addColorStop(1,'#24252d');ctx.fillStyle=g;ctx.fillRect(0,0,512,256);
  for(const x of [75,305]){const g=ctx.createRadialGradient(x,90,10,x,90,100);g.addColorStop(0,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,512,256);}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.mapping=THREE.EquirectangularReflectionMapping;return t;
}
export async function mountPhone3D(visual,{onProgress,probe}={}){
  const isHero=visual.dataset.phoneScene==='hero';
  const canvas=probe?.canvas||document.createElement('canvas');canvas.setAttribute('aria-hidden','true');let gl=probe?.gl;
  try{gl ||= canvas.getContext('webgl2');}catch{return null;}if(!gl)return null;
  let requestedIndex=Number(visual.dataset.selectedIssue??0),requestedSide=visual.dataset.cameraSide??'rear';
  let assets=await (isHero?loadHeroAssets(onProgress):loadAssets(requestedIndex,requestedSide,onProgress));
  // Selection may change while the initial graph downloads; mount only its current set.
  while(!isHero&&(requestedIndex!==Number(visual.dataset.selectedIssue??0)||requestedSide!==(visual.dataset.cameraSide??'rear'))){
    requestedIndex=Number(visual.dataset.selectedIssue??0);requestedSide=visual.dataset.cameraSide??'rear';
    assets=await loadAssets(requestedIndex,requestedSide,onProgress);
  }
  onProgress?.(1);
  const [atlas,atlasData]=assets;
  let [,,repairAtlas,repairData,openingAtlas,openingData,internalAtlas,internalData,bodyAtlas,bodyData,paneBrokenAtlas,paneBrokenData,backFrameAtlas,backFrameData,paneNewAtlas,paneNewData,noRearAtlas,noRearData,rearCamAtlas,rearCamData,bracketAtlas,bracketData,noFrontAtlas,noFrontData,frontCamAtlas,frontCamData,silverAtlas,silverData,camBrokenAtlas,camBrokenData,rearOuterAtlas,rearOuterData]=isHero?[]:assets;
  const [,,heroGlassAtlas,heroGlassData,heroComponentsAtlas,heroComponentsData,heroDisplayAtlas,heroDisplayData,heroFrontAtlas,heroFrontData]=isHero?assets:[];
  for(const texture of (isHero?[atlas,heroGlassAtlas,heroComponentsAtlas,heroDisplayAtlas,heroFrontAtlas]:[atlas,repairAtlas,openingAtlas,internalAtlas,bodyAtlas,paneBrokenAtlas,backFrameAtlas,paneNewAtlas,noRearAtlas,rearCamAtlas,bracketAtlas,noFrontAtlas,frontCamAtlas,silverAtlas,camBrokenAtlas,rearOuterAtlas]).filter(Boolean)){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;}
  const renderer=new THREE.WebGLRenderer({canvas,context:gl,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,(navigator.hardwareConcurrency||4)<=4||(navigator.deviceMemory||8)<=4?1.5:2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
  const stage=document.createElement('div');stage.className='phone3d-stage'+(isHero?' phone3d-stage--hero':'');stage.dataset.scene=isHero?'hero':'diagnostic';stage.append(canvas);visual.prepend(stage);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-3.45,3.45,3.8,-3.8,.1,80);camera.position.z=18;
  const env=studioTexture(),pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(env);scene.environment=target.texture;env.dispose();pmrem.dispose();
  const key=new THREE.DirectionalLight(0xffe7ee,2);key.position.set(-5,5,8);scene.add(key);
  const rim=new THREE.DirectionalLight(0xd4dbff,1.2);rim.position.set(5,1,-4);scene.add(rim);
  const phone=new THREE.Group();scene.add(phone);
  const layers={},groups={},rimMaterials={},photoMaterials={};
  // Actual silhouettes from atlas alpha, including apertures in the board/chassis.
  function photoPart(name,index,w,h,depth,y=0,texture=atlas,data=atlasData){
    if(layers[name]?.userData.shape)return layers[name];
    if(!texture||!data){
      if(!layers[name]){const empty=new THREE.Group();empty.name=name;empty.userData.depth=depth;phone.add(empty);layers[name]=empty;}
      return layers[name];
    }
    if(layers[name])phone.remove(layers[name]);
    const source=data.parts[index],rect=source.rect;
    function position(p){return new THREE.Vector2(((p[0]-rect[0])/rect[2]-.5)*w,(.5-(p[1]-rect[1])/rect[3])*h);}
    const shape=(source.components??[source]).map(component=>{
      const outline=new THREE.Shape(component.outline.map(position));
      for(const points of component.holes)outline.holes.push(new THREE.Path(points.map(position)));
      return outline;
    });
    const group=new THREE.Group();group.name=name;group.position.y=y;phone.add(group);layers[name]=group;groups[name]=group;
    const roseBody=isHero&&['chassis','backGlass'].includes(name);
    const thinGlass=isHero&&name==='backGlass';
    const edgeColor=roseBody?0x764958:isHero&&name==='display'?0x0b0b0d:({tray:0x55565a,battery:0x34373d,camera:0x90908b,cameraFront:0x848786,port:0x323338,board:0x63615d,floor:0x303036}[name]??0x4d303d);
    const edgeMaterial=new THREE.MeshStandardMaterial({color:edgeColor,metalness:roseBody?.65:name==='battery'?.15:.82,roughness:roseBody?.34:name==='battery'?.6:.3,emissive:0x000000});
    rimMaterials[name]=edgeMaterial;
    const capMaterial=edgeMaterial.clone();if(name==='tray')capMaterial.color.set(0x252529);
    // Cap surfaces stay neutral when a texture aperture exposes them; only edges glow.
    const bevelThickness=thinGlass?.0015:roseBody?.024:.008;
    const volume=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:thinGlass?.003:roseBody?.032:.012,bevelThickness,bevelSegments:roseBody?4:2}),[capMaterial,edgeMaterial]);volume.position.z=-depth/2;group.add(volume);
    const faceGeometry=new THREE.ShapeGeometry(shape);
    const p=faceGeometry.attributes.position,uv=faceGeometry.attributes.uv;
    for(let i=0;i<p.count;i++)uv.setXY(i,(rect[0]+(p.getX(i)/w+.5)*rect[2])/data.width,1-(rect[1]+(.5-p.getY(i)/h)*rect[3])/data.height);
    // Photographic lighting is baked into these textures; keep photo faces unlit.
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.12,side:THREE.DoubleSide,toneMapped:false});
    photoMaterials[name]=material;const front=new THREE.Mesh(faceGeometry,material);front.position.z=depth/2+.012;group.add(front);
    if(name==='display'){front.rotation.y=Math.PI;front.position.z=-depth/2-.012;}
    group.userData.depth=depth;group.userData.faceLift=thinGlass?.003:roseBody?bevelThickness+.005:.012;group.userData.volume=volume;group.userData.photo=front;group.userData.shape=shape;group.userData.baseY=y;
    return group;
  }
  function reverseFace(name,texture,data,index,w,h,{ownShape=false,rect=data.parts[index].rect,mirror=false}={}){
    const group=layers[name],source=data.parts[index];
    const shape=ownShape?(source.components??[source]).map(component=>{
      const position=p=>{const u=(p[0]-rect[0])/rect[2];return new THREE.Vector2((mirror?.5-u:u-.5)*w,(.5-(p[1]-rect[1])/rect[3])*h);};
      const outline=new THREE.Shape(component.outline.map(position));
      for(const points of component.holes)outline.holes.push(new THREE.Path(points.map(position)));
      return outline;
    }):group.userData.shape;
    const geometry=new THREE.ShapeGeometry(shape),p=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<p.count;i++){
      const u=p.getX(i)/w+.5;
      uv.setXY(i,(rect[0]+(mirror?1-u:u)*rect[2])/data.width,1-(rect[1]+(.5-p.getY(i)/h)*rect[3])/data.height);
    }
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.12,side:THREE.DoubleSide,toneMapped:false}));group.add(mesh);group.userData.reverse=mesh;return mesh;
  }
  // Hero: a removed display is all screen (thin black edge, no rose frame). Diagnostic keeps the full-phone front.
  if(isHero){const r=heroDisplayData.parts[0].rect;photoPart('display',0,3*r[2]/371,6.48*r[3]/767,.016,0,heroDisplayAtlas,heroDisplayData);layers.display.userData.volume.visible=false;}
  else photoPart('display',0,3,6.48,.085);
  if(isHero){
    // One shell, a lower rear panel, detached plate/board and a seated camera.
    photoPart('chassis',0,3,6.48,.23,0,heroFrontAtlas,heroFrontData);
    photoPart('floor',1,2.307,3.198,.02,-.770,heroFrontAtlas,heroFrontData);
    // Closed hero body: a smooth rose shell (true rounded corners, slim real buttons) replaces the
    // traced frame outline, whose sparse points read as faceted blocks at this angle. It also closes
    // the gap between screen and frame. Swapped out as soon as the phone starts opening.
    {
      const W=2.94,H=6.44,R=.46,x0=-W/2,y0=-H/2,s=new THREE.Shape();
      s.moveTo(x0+R,y0);s.lineTo(x0+W-R,y0);s.absarc(x0+W-R,y0+R,R,-Math.PI/2,0);s.lineTo(x0+W,y0+H-R);s.absarc(x0+W-R,y0+H-R,R,0,Math.PI/2);
      s.lineTo(x0+R,y0+H);s.absarc(x0+R,y0+H-R,R,Math.PI/2,Math.PI);s.lineTo(x0,y0+R);s.absarc(x0+R,y0+R,R,Math.PI,Math.PI*1.5);
      const metal=new THREE.MeshStandardMaterial({color:0x764958,metalness:.65,roughness:.32});
      const front=-.205,back=.12,bevel=.035;
      const body=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:back-front-2*bevel,steps:1,curveSegments:48,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:8}),metal);
      body.position.z=front+bevel;
      const shell=new THREE.Group();shell.name='closedShell';shell.add(body);
      const mid=(front+back)/2;
      // Action button and volume keys on one side, side button on the other.
      for(const [x,y,len] of [[-W/2,2.42,.2],[-W/2,1.78,.4],[-W/2,1.18,.4],[W/2,1.55,.62]]){
        const key=new THREE.Mesh(new THREE.CapsuleGeometry(.03,len,6,12),metal);
        key.position.set(x+(x<0?-1:1)*(bevel+.012),y,mid);key.scale.z=1.6;shell.add(key);
      }
      layers.chassis.add(shell);layers.chassis.userData.closedShell=shell;
      // Opened frame: the same smooth outline as a band (inner opening keeps the floor visible),
      // replacing the traced side wall. The internals photo still sits on top of it.
      const chassis=layers.chassis.userData,oldVolume=chassis.volume,inset=.13,ri=R-inset;
      const ring=s.clone();const hole=new THREE.Path(),hx=x0+inset,hy=y0+inset,hw=W-2*inset,hh=H-2*inset;
      hole.moveTo(hx+ri,hy);hole.lineTo(hx+hw-ri,hy);hole.absarc(hx+hw-ri,hy+ri,ri,-Math.PI/2,0);hole.lineTo(hx+hw,hy+hh-ri);hole.absarc(hx+hw-ri,hy+hh-ri,ri,0,Math.PI/2);
      hole.lineTo(hx+ri,hy+hh);hole.absarc(hx+ri,hy+hh-ri,ri,Math.PI/2,Math.PI);hole.lineTo(hx,hy+ri);hole.absarc(hx+ri,hy+ri,ri,Math.PI,Math.PI*1.5);
      ring.holes=[hole];
      const band=new THREE.Mesh(new THREE.ExtrudeGeometry(ring,{depth:chassis.depth,steps:1,curveSegments:48,bevelEnabled:true,bevelSize:.032,bevelThickness:.024,bevelSegments:6}),oldVolume.material);
      band.position.copy(oldVolume.position);
      for(const [x,y,len] of [[-W/2,2.42,.2],[-W/2,1.78,.4],[-W/2,1.18,.4],[W/2,1.55,.62]]){
        const key=new THREE.Mesh(new THREE.CapsuleGeometry(.03,len,6,12),metal);
        key.position.set(x+(x<0?-1:1)*(.032+.012),y,chassis.depth/2);key.scale.z=1.6;band.add(key);
      }
      layers.chassis.remove(oldVolume);layers.chassis.add(band);chassis.volume=band;
    }
    // Inner film faces the open body; the opposite face is the rose exterior.
    // Register both photographs to the existing lower-cover footprint.
    const glassHeight=4.58;
    photoPart('backGlass',0,2.95,glassHeight,.008,-.85,heroGlassAtlas,heroGlassData);
    reverseFace('backGlass',heroGlassAtlas,heroGlassData,1,2.95,glassHeight,{mirror:true}).material.color.set(0xe7c9d4);
    photoPart('tray',0,2.6,2.6*heroComponentsData.parts[0].rect[3]/heroComponentsData.parts[0].rect[2],.08,-.38,heroComponentsAtlas,heroComponentsData);
    photoPart('board',1,2.35,2.35*heroComponentsData.parts[1].rect[3]/heroComponentsData.parts[1].rect[2],.09,.7,heroComponentsAtlas,heroComponentsData);
    photoPart('camera',2,2.6,2.6*heroFrontData.parts[2].rect[3]/heroFrontData.parts[2].rect[2],.14,2.0,heroFrontAtlas,heroFrontData);
  }else{
  photoPart('back',1,3,6.48,.085);
  photoPart('brokenScreen',0,3,6.48,.085,0,openingAtlas,openingData);
  const screenRect=openingData.parts[1].rect;
  reverseFace('brokenScreen',openingAtlas,openingData,1,3,6.48,{ownShape:true,mirror:true,rect:[screenRect[0],screenRect[1],openingData.parts[0].rect[2],screenRect[3]]});
  reverseFace('display',openingAtlas,openingData,1,3,6.48,{ownShape:true,mirror:true,rect:[screenRect[0],screenRect[1],openingData.parts[0].rect[2],screenRect[3]]});
  photoPart('board',2,2.65,2.55,.09,1.65,internalAtlas,internalData);
  photoPart('chassis',5,3,6.48,.23,0,internalAtlas,internalData);
  photoPart('innerFront',0,3,6.48,.20,0,bodyAtlas,bodyData);
  photoPart('backBody',4,3,6.48,.20,0,internalAtlas,internalData);
  // The battery plate is independent of the rear camera in the new references.
  photoPart('tray',2,2.64,5.96,.08,-.06,openingAtlas,openingData);
  // Plate reverse: the battery on its bracket, drawn on the plate's own silhouette so it turns over at the same size.
  reverseFace('tray',silverAtlas,silverData,0,2.64,5.96);
  const cover=photoPart('backGlass',0,3,6.48,.075,0,internalAtlas,internalData);
  // Rear-glass repair: the frame keeps its cameras; only the lower pane is replaced.
  // Seated flush with the frame face; the extruded edge would read as a border, so only the photo face draws.
  // Camera repairs from the front. Each body + its removed parts reconstructs the v2 body pixel for pixel.
  // The phone's back seen from outside: before (cracked camera) and after (new camera).
  const inside=cover.userData.photo,outside=reverseFace('backGlass',atlas,atlasData,1,3,6.48);
  cover.userData.photo=outside;cover.userData.reverse=inside;
  photoPart('camera',3,2.38,2.45,.14,2.04,internalAtlas,internalData);
  // A solid shell under the seated tray keeps deeper photographic circuitry hidden.
  const housing=new THREE.Group();housing.name='housing';phone.add(housing);layers.housing=housing;
  const housingMaterial=new THREE.MeshStandardMaterial({color:0x271b22,metalness:.65,roughness:.4,emissive:0});rimMaterials.housing=housingMaterial;
  const housingMesh=new THREE.Mesh(new THREE.ExtrudeGeometry(layers.display.userData.shape,{depth:.24,steps:1,bevelEnabled:true,bevelSize:.014,bevelThickness:.01,bevelSegments:2}),housingMaterial);housingMesh.position.z=-.12;housing.add(housingMesh);
  // Retained hidden diagnostic geometry; the hero has no extra front glass sheet.
  const glassGroup=new THREE.Group();glassGroup.name='glass';phone.add(glassGroup);layers.glass=glassGroup;
  const glassMaterial=new THREE.MeshPhysicalMaterial({color:0xd4c6cd,roughness:.08,metalness:.04,transparent:true,opacity:.17,clearcoat:1});
  const glassMesh=new THREE.Mesh(new THREE.ExtrudeGeometry(layers.display.userData.shape,{depth:.012,steps:1,bevelEnabled:true,bevelSize:.009,bevelThickness:.006,bevelSegments:2}),glassMaterial);glassGroup.add(glassMesh);
  }
  function addRepairParts(){
  photoPart('battery',3,2.3,3.85,.16,-.85,repairAtlas??null,repairData??null);
  photoPart('backFrame',0,3,6.48,.23,0,backFrameAtlas??null,backFrameData??null);
  photoPart('backBroken',0,3,6.48,.04,0,paneBrokenAtlas??null,paneBrokenData??null);
  photoPart('backNew',0,3,6.48,.04,0,paneNewAtlas??null,paneNewData??null);
  photoPart('bodyNoRearCam',0,3,6.48,.20,0,noRearAtlas??null,noRearData??null);
  photoPart('bodyNoFrontCam',0,3,6.48,.20,0,noFrontAtlas??null,noFrontData??null);
  photoPart('rearCamModule',0,3,6.48,.02,0,rearCamAtlas??null,rearCamData??null);
  photoPart('rearCamBracket',0,3,6.48,.02,0,bracketAtlas??null,bracketData??null);
  photoPart('frontCamModule',0,3,6.48,.02,0,frontCamAtlas??null,frontCamData??null);
  photoPart('rearCamBefore',0,3,6.48,.075,0,camBrokenAtlas??null,camBrokenData??null);
  photoPart('rearCamAfter',0,3,6.48,.075,0,rearOuterAtlas??null,rearOuterData??null);
  photoPart('cameraFront',4,2.15,1.94,.07,2.48,repairAtlas??null,repairData??null);
  photoPart('port',2,2.64,5.76,.055,-.16,repairAtlas??null,repairData??null);
    for(const name of ['backBroken','backNew','rearCamModule','rearCamBracket','frontCamModule'])if(layers[name].userData.volume)layers[name].userData.volume.visible=false;
  }
  if(!isHero)addRepairParts();
  phone.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.userData.restOpacity=m.opacity;m.userData.restTransparent=m.transparent;}});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const names=Object.keys(layers);
  let selected=Number(visual.dataset.selectedIssue??0),cameraSide=visual.dataset.cameraSide??'rear';
  let visible=false,frame=0,last=0,elapsed=0,clipTime=0,heroSpread=reduced.matches?1:0,dragging=false,dragX=0,dragY=0,dragYaw=0,dragPitch=0;
  let viewYaw=isHero?Math.PI+.16:selected===2?.16:Math.PI;
  let viewRoll=0,viewScale=1,viewField=3.8;
  const clamp=THREE.MathUtils.clamp;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const ramp=(t,start,duration)=>smooth((t-start)/duration);
  // Lower pane: side edge in model units (canvas x 780 of the 853x1843 rect) and resting depth above the frame face.
  const PANE_SIDE=1.337,PANE_Z=.106,CAM_Z=-.094;
  function emptyPose(){
    const out={};
    for(const name of names)out[name]={x:0,y:0,z:0,rx:0,ry:0,rz:0,alpha:0,thickness:1,scale:1};
    if(isHero)return out;
    out.display.z=-.22;out.brokenScreen.z=-.22;out.rearCamBefore.z=.24;out.rearCamAfter.z=.24;out.back.z=.24;out.backGlass.z=.24;out.housing.z=.15;out.backBroken.z=PANE_Z;out.backNew.z=PANE_Z;out.backFrame.z=0;
    Object.assign(out.tray,{y:-.06,z:-.16});
    Object.assign(out.battery,{x:-.08,y:-.9,z:-.05});Object.assign(out.board,{y:1.65,z:-.18});
    Object.assign(out.camera,{x:-.28,y:2.04,z:.34});Object.assign(out.cameraFront,{y:2.18,z:-.48,scale:.8});
    Object.assign(out.port,{y:-.16,z:-.24});
    out.rearCamModule.z=CAM_Z;out.frontCamModule.z=CAM_Z;out.rearCamBracket.z=CAM_Z-.006;
    return out;
  }
  function closedPose(index){
    const out=emptyPose();
    if(index===2){out.backFrame.alpha=1;paneLift(out.backBroken,0,0);return out;}
    if(index===4&&cameraSide==='rear'){out.display.alpha=1;out.display.thickness=3;out.rearCamBefore.alpha=1;return out;}
    const body=index===0?'brokenScreen':'display';out[body].alpha=1;out[body].thickness=3;return out;
  }
  let currentPose=isHero?heroPose(heroSpread):closedPose(selected),startPose=isHero?currentPose:closedPose(selected);
  function blend(a,b,t){
    const out={};for(const name of names){out[name]={};for(const key of Object.keys(b[name]))out[name][key]=THREE.MathUtils.lerp(a[name][key],b[name][key],t);}return out;
  }
  // The cover pivots around its edge, exposing its real photographic underside.
  function swingScreen(p,open,detach=0){
    const angle=-2.22*open;
    Object.assign(p,{x:1.5-1.5*Math.cos(angle)+detach*.35,y:open*.025,z:-.22+1.5*Math.sin(angle)-detach*.35,ry:angle,rz:-open*.02,alpha:1-detach,thickness:3-2*open});
  }
  function firstOpened(out,open){
    // The flat tray front (opening index 2) is seated and opaque from the first frame.
    // The attached pouch is the reverse face (index 3), shown only when the plate turns.
    // The body photo sits behind the plate throughout; no grey housing and no baked camera bar overlay.
    out.tray.alpha=1;out.innerFront.alpha=1;out.housing.alpha=0;out.cameraFront.alpha=0;
  }
  // The camera stays mounted in the body; only the plate and pouch move as a unit.
  function moveTray(out,lift,turn=0){
    const translation=new THREE.Vector3(-1.08*lift,.04*lift,-1.05*lift);
    const rotation=new THREE.Euler(-.025*lift,.12*lift+turn*Math.PI*.86,-.025*lift);
    const anchor=new THREE.Vector3(0,-.06,-.16);
    for(const name of ['tray','battery']){
      const p=out[name];
      const v=new THREE.Vector3(p.x,p.y,p.z).sub(anchor).applyEuler(rotation).add(anchor).add(translation);
      Object.assign(p,{x:v.x,y:v.y,z:v.z,rx:rotation.x,ry:rotation.y,rz:rotation.z});
    }
  }
  // Back-glass replacement, seen from the rear. The cracked lower pane swings open on its side edge,
  // then slides away; the frame keeps its cameras and the empty coil recess shows.
  // The new pane arrives along the same path and seats flush. Rear view: local +z faces the viewer.
  function paneLift(p,lift,away){
    // Hinges on its side edge (like a page turning), then slides away to that side.
    const angle=1.05*lift;
    Object.assign(p,{x:PANE_SIDE*(1-Math.cos(angle))+away*2.6,y:away*.35,z:PANE_Z+PANE_SIDE*Math.sin(angle)+away*.5,rx:0,ry:angle,rz:0,alpha:away<.98?1:0,thickness:1});
  }
  function backGlassReplacement(t){
    const out=emptyPose();
    const pry=ramp(t,.6,.6),away=ramp(t,1.2,.65),arrive=ramp(t,2.3,.65),seat=ramp(t,2.95,.5);
    out.backFrame.alpha=1;
    paneLift(out.backBroken,pry,away);
    paneLift(out.backNew,1-seat,1-arrive);out.backNew.alpha=t>=2.3&&arrive>.002?1:0;
    const phase=seat>.98?'repaired':t>=2.95?'fitting-glass':arrive>.02?'new-glass':away>.98?'glass-off':pry>.02?'lifting-glass':'broken-glass';
    return {pose:out,open:pry,tray:0,part:seat,fit:seat,phase};
  }
  // A removed part rises toward the viewer, then slides out to the right; arrival runs the same path backwards.
  // The view is orthographic, so "toward the viewer" reads as a small grow and rise; the part then drifts aside and fades.
  // Scales around the part's own centre (front-side layers are mirrored in x), so it grows in place instead of drifting off the phone.
  function partCentre(name){
    const g=layers[name].userData.photo.geometry;g.computeBoundingBox();const b=g.boundingBox;
    return {x:(b.min.x+b.max.x)/2,y:(b.min.y+b.max.y)/2};
  }
  function liftOut(p,lift,away,dir=1,drift=1,name){
    const scale=1+.08*lift*drift,c=name?partCentre(name):{x:0,y:0};
    Object.assign(p,{z:CAM_Z-.3*lift,scale,x:c.x*(scale-1)+dir*.6*away*drift,y:p.y+c.y*(1-scale)-.05*lift*drift-.15*away*drift,rz:dir*-.04*away*drift,alpha:1-away});
  }
  function openFront(out,t){
    const open=ramp(t,.3,.6);
    swingScreen(out.display,open,ramp(t,1.0,.55));
    out.housing.alpha=0;out.cameraFront.alpha=0;out.camera.alpha=0;out.innerFront.alpha=0;
    return open;
  }
  // Rear camera from the front: screen off, battery plate out, bracket screw out, camera module out, new one in.
  function rearCameraRepair(t){
    const out=emptyPose(),open=openFront(out,t);
    out.bodyNoRearCam.alpha=1;out.rearCamModule.alpha=1;out.rearCamBracket.alpha=1;
    out.tray.alpha=1;
    const plate=ramp(t,1.3,.6);moveTray(out,plate);out.tray.alpha=1-ramp(plate,.55,.45);
    const screw=ramp(t,2.0,.4),bracketAway=ramp(t,2.4,.45);
    liftOut(out.rearCamBracket,screw,bracketAway,1,0,'rearCamBracket');
    const camUp=ramp(t,2.9,.45),camAway=ramp(t,3.35,.5),camIn=ramp(t,3.95,.5),camSeat=ramp(t,4.45,.45);
    if(t<3.9)liftOut(out.rearCamModule,camUp,camAway,1,1,'rearCamModule');
    else liftOut(out.rearCamModule,1-camSeat,1-camIn,-1,1,'rearCamModule');
    const bracketBack=ramp(t,4.95,.4);
    if(t>=4.9)liftOut(out.rearCamBracket,1-bracketBack,1-bracketBack,1,0,'rearCamBracket');
    const phase=bracketBack>.98?'highlighted':camIn>.02?'new-camera':camAway>.02?'removing-camera':screw>.02?'removing-bracket':plate>.02?'removing-plate':open>.02?'opening':'closed';
    return {pose:out,open,tray:plate,part:bracketBack,fit:camSeat,phase};
  }
  // Whole rear-camera story. Seen from the back first (cracked lenses), turned to the front for the repair,
  // reassembled, then turned back to show the new camera. yaw drives the view so the turns are part of the clip.
  const YAW_FRONT=Math.PI+.12,YAW_REAR=.16,CAM_START=1.7,CAM_REASSEMBLE=7.05;
  function rearCameraStory(t){
    const turnIn=ramp(t,.8,.75),turnOut=ramp(t,CAM_REASSEMBLE+1.45,.8);
    const inner=rearCameraRepair(Math.max(0,t-CAM_START));const out=inner.pose;
    if(t<CAM_START){for(const name of names)out[name].alpha=0;out.display.alpha=1;out.display.thickness=3;Object.assign(out.display,{x:0,y:0,z:-.22,ry:0,rz:0});}
    // Reassembly: plate back in, original screen back on.
    const tt=t-CAM_REASSEMBLE,plateBack=ramp(tt,0,.55),screenBack=ramp(tt,.5,.45),screenClose=ramp(tt,.9,.5);
    if(tt>0){
      out.tray.alpha=1;Object.assign(out.tray,emptyPose().tray);moveTray(out,1-plateBack);out.tray.alpha=plateBack;
      swingScreen(out.display,1-screenClose,1-screenBack);
      if(screenClose>.98)out.display.thickness=3;
    }
    const repaired=t>4.5+CAM_START;
    out.rearCamBefore.alpha=repaired?0:1;out.rearCamAfter.alpha=repaired?1:0;
    const yaw=t<CAM_START?THREE.MathUtils.lerp(YAW_REAR,YAW_FRONT,turnIn):THREE.MathUtils.lerp(YAW_FRONT,YAW_REAR,turnOut);
    const phase=turnOut>.98?'repaired':tt>1.45?'turning-back':tt>0?'reassembling':t<.8?'broken-camera':t<CAM_START?'turning':inner.phase;
    return {...inner,pose:out,phase,yaw};
  }
  // Front camera from the front: screen off, then the TrueDepth strip comes out and the new one goes in. Plate stays.
  function frontCameraRepair(t){
    const out=emptyPose(),open=openFront(out,t);
    out.bodyNoFrontCam.alpha=1;out.frontCamModule.alpha=1;out.tray.alpha=1;
    const up=ramp(t,1.7,.45),away=ramp(t,2.15,.5),come=ramp(t,2.8,.5),seat=ramp(t,3.3,.45);
    if(t<2.75)liftOut(out.frontCamModule,up,away,1,1,'frontCamModule');
    else liftOut(out.frontCamModule,1-seat,1-come,-1,1,'frontCamModule');
    const phase=seat>.98?'highlighted':come>.02?'new-camera':away>.02?'removing-camera':up>.02?'lifting-camera':open>.02?'opening':'closed';
    return {pose:out,open,tray:0,part:seat,fit:seat,phase};
  }
  function rearOpening(index,t){
    const out=emptyPose(),open=ramp(t,index===2?.65:.3,.85);
    out.back.alpha=1-ramp(open,0,.22);out.back.thickness=3;
    const angle=-2.22*open;
    Object.assign(out.backGlass,{x:-1.5+1.5*Math.cos(angle),z:.24-1.5*Math.sin(angle),ry:angle,rz:open*.02,alpha:open>.001?1:0});
    out.backBody.alpha=open;out.camera.alpha=open;
    if(index===2)return {pose:out,open,tray:0,part:open,fit:0,phase:open<.02?'closed-back':open<.98?'opening-back':'removed-back'};
    const part=ramp(t,1.45,.7);
    out.camera.x*=1-part;out.camera.y-=part*1.8;out.camera.z+=part*.95;out.camera.scale=1+part*.55;
    out.backBody.alpha*=1-part*.65;out.backGlass.alpha*=1-ramp(part,.05,.65);
    return {pose:out,open,tray:0,part,fit:0,phase:part>.98?'highlighted':open<.98?'opening-back':'lifting'};
  }
  function screenReplacement(t){
    const out=emptyPose(),open=ramp(t,.8,.65),detach=ramp(t,1.9,.5),fit=ramp(t,3,.7);
    swingScreen(out.brokenScreen,open,detach);
    // Screen replacement keeps the battery plate seated and opaque from the first frame; the display occludes it.
    // The full-body interior sits behind the plate. No separate grey housing and no duplicated camera bar.
    out.tray.alpha=1;out.innerFront.alpha=1;out.housing.alpha=0;out.cameraFront.alpha=0;
    // As the new display fits, push the interior behind it so the display occludes the interior rather than the reverse.
    out.innerFront.z=0;
    Object.assign(out.display,{x:-1.15*(1-fit),y:.08*(1-fit),z:-1.1+fit*.88,ry:.18*(1-fit),alpha:ramp(t,2.5,.3),thickness:1+2*fit});
    const phase=fit>.98?'repaired':t>=3?'fitting-screen':t>=2.5?'new-screen':detach>.98?'screen-off':open>.98?'disconnecting-screen':open>.02?'opening-screen':'broken-screen';
    return {pose:out,open,tray:0,part:fit,fit,phase};
  }
  function repairPose(index,t){
    if(index===0)return screenReplacement(t);
    if(index===2)return backGlassReplacement(t);
    if(index===4)return cameraSide==='front'?frontCameraRepair(t):rearCameraStory(t);
    const out=closedPose(index),open=ramp(t,.3,.65);
    const removesTray=[1,3,5].includes(index),trayLift=removesTray?ramp(t,1.35,.65):0;
    const part=index===1?trayLift:ramp(t,removesTray?2.05:1.25,.7);
    swingScreen(out.display,open,ramp(t,1.1,.65));firstOpened(out,open);
    if(removesTray){
      moveTray(out,trayLift,index===1?ramp(t,2.05,.7):0);
      // The body never fades. Battery keeps its plate in view (it turns to show the battery);
      // charge and board repairs set the plate aside, so it leaves the frame and never covers the part.
      out.innerFront.alpha=1;out.cameraFront.alpha=0;
      if(index!==1)out.tray.alpha=1-ramp(trayLift,.55,.45);
    }
    if(index===5){
      out.innerFront.alpha=1;
      out.board.alpha=part;out.board.z-=part*.75;out.board.scale=1+part*.08;
    }else if(index===3){
      out.port.alpha=trayLift;out.port.z-=part*.95;out.port.scale=1+part*.14;
      out.innerFront.alpha=1;
    }else if(index===4){
      const module=out.cameraFront;
      module.y-=part*1.98;module.z-=part*.95;module.scale=.8+part*1.2;
      out.tray.alpha=open;out.battery.alpha=open;out.cameraFront.alpha=open;
    }
    const turning=index===1&&t>=2.05&&t<2.75;
    // Battery-plate highlight waits until the plate has turned (t >= 2.75), so the final frame is highlighted and reverse.
    const turned=index!==1||t>=2.75;
    const phase=turning?'turning-plate':part>.98&&turned?'highlighted':open<.98?'opening':trayLift>.02&&trayLift<.98?'removing-plate':part>.02?'lifting':'battery-plate';
    return {pose:out,open,tray:trayLift,part,fit:0,phase};
  }
  const HERO_YAW=.5,HERO_TILT=-1.05,HERO_HOLD=.9,HERO_OPEN=1.8;let heroTime=0;
  function heroPose(amount){
    const out=emptyPose();
    const depth={display:-1.62,tray:-.65,board:.2,chassis:.95,backGlass:1.55};
    // Closed phone: the same parts stacked tightly in order, screen nearest the viewer.
    const closed={display:-.2,tray:-.07,board:-.03,chassis:0,backGlass:.13};
    for(const name of Object.keys(depth)){
      out[name].alpha=1;out[name].z=THREE.MathUtils.lerp(closed[name],depth[name],amount);
    }
    out.display.thickness=.3; // a removed display is a thin sheet
    // Closed, the panel fills the frame to its inner rim; it settles to its true size as it lifts.
    out.display.scale=THREE.MathUtils.lerp(DISPLAY_CLOSED_SCALE,1,amount);
    out.display.x=THREE.MathUtils.lerp(DISPLAY_CLOSED_X,0,amount);
    // Floor sits deeper than the frame face and moves with the chassis.
    out.floor.alpha=1;out.floor.z=out.chassis.z+.05;Object.assign(out.floor,{x:-.007,y:-.770});
    // Camera stays seated against the chassis face throughout the opening.
    out.camera.alpha=1;out.camera.z=out.chassis.z-amount*(layers.chassis.userData.depth+layers.camera.userData.depth)/2; // sits inside the closed body, rises onto the chassis face as it opens
    // The horizontal board floats separately below the upper camera hardware.
    Object.assign(out.tray,{y:-.38});
    // Board sits inside the body when assembled and slides to its exploded spot as the phone opens.
    Object.assign(out.board,{x:THREE.MathUtils.lerp(0,.8,amount),y:THREE.MathUtils.lerp(.7,-1.2,amount)});
    Object.assign(out.backGlass,{y:-.85});
    // Align optical centers, accounting for the carrier's off-center flex tails.
    Object.assign(out.camera,{x:0,y:2.0});
    return out;
  }
  function orientLayer(name,frontSide,thickness){
    const group=layers[name],data=group.userData;
    if(!data.photo)return;
    group.scale.x=(frontSide?-1:1)*group.scale.y;data.photo.rotation.y=0;data.photo.position.z=(frontSide?-1:1)*(data.depth/2+(data.faceLift??.012));
    data.volume.scale.z=thickness;
    data.volume.position.z=frontSide?-data.depth/2+.008*(thickness-1):data.depth/2+.008-thickness*(data.depth+.008);
    if(data.reverse)data.reverse.position.z=(frontSide?1:-1)*(data.depth/2+(isHero&&name==='backGlass'?data.faceLift:.012));
    if(data.reverse&&(name==='display'||name==='brokenScreen'))data.reverse.visible=Math.abs(group.rotation.y)>.15;
    // Once the plate has turned past edge-on, only the silver battery unit on its reverse is drawn.
    if(name==='tray'&&!isHero){const turned=Math.abs(group.rotation.y)>Math.PI/2;data.volume.visible=!turned;data.photo.visible=!turned;if(data.reverse)data.reverse.visible=turned;}
  }
  function applyPose(pose){
    for(const name of names){
      const g=layers[name],p=pose[name];g.visible=p.alpha>.002;g.position.set(p.x,p.y,p.z);g.rotation.set(p.rx,p.ry,p.rz);g.scale.setScalar(p.scale);
      const rearView=selected===2;
      const frontSide=isHero||(!['back','backGlass','backBody','backBroken','backNew','backFrame','rearCamBefore','rearCamAfter'].includes(name)&&!(name==='camera'&&rearView));
      orientLayer(name,frontSide,p.thickness);
      g.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){const transparent=p.alpha<.999||m.userData.restTransparent;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=m.userData.restOpacity*p.alpha;m.depthWrite=p.alpha>.98;}});
    }
  }
  let selectionToken=0;
  async function select(index,side='rear'){
    if(visual.classList.contains('phone3d-failed'))return;
    const token=++selectionToken;
    stage.dataset.loading='true';visual.classList.add('phone3d-loading-next');
    try {
      const next=await loadAssets(index,side,p=>{if(token===selectionToken)onProgress?.(p);});
      if(token!==selectionToken||visual.classList.contains('phone3d-failed'))return;
      for(let i=0;i<next.length;i++)if(next[i])assets[i]=next[i];
      [,,repairAtlas,repairData,openingAtlas,openingData,internalAtlas,internalData,bodyAtlas,bodyData,paneBrokenAtlas,paneBrokenData,backFrameAtlas,backFrameData,paneNewAtlas,paneNewData,noRearAtlas,noRearData,rearCamAtlas,rearCamData,bracketAtlas,bracketData,noFrontAtlas,noFrontData,frontCamAtlas,frontCamData,silverAtlas,silverData,camBrokenAtlas,camBrokenData,rearOuterAtlas,rearOuterData]=assets;
      for(let i=0;i<assets.length;i+=2)if(assets[i]){assets[i].colorSpace=THREE.SRGBColorSpace;assets[i].anisotropy=4;}
      addRepairParts();
      phone.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.restOpacity===undefined){m.userData.restOpacity=m.opacity;m.userData.restTransparent=m.transparent;}});

    // Screen/glass repairs restart at their before view so the sequence can replay.
    selected=index;cameraSide=side;
    startPose=[0,2,4].includes(index)?closedPose(index):currentPose;clipTime=0;dragYaw=0;dragPitch=0;
    stage.dataset.selectedPart=index===4&&cameraSide==='front'?'cameraFront':PARTS[index];requestDraw();
  
      stage.dataset.loading='false';visual.classList.remove('phone3d-loading-next');onProgress?.(1);
    }catch{
      if(token!==selectionToken)return;
      stage.dataset.loading='false';visual.classList.remove('phone3d-loading-next','phone3d-ready');visual.classList.add('phone3d-failed');stage.hidden=true;
      // If the next repair cannot load, keep its decoded selected poster visible.
      visual.dispatchEvent(new CustomEvent('phone-selection-error'));
    }
  }
  function draw(now=0){
    frame=0;if(!visible||document.hidden)return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed+=dt;clipTime+=dt;
    let open=0,trayProgress=0,part=0,fitProgress=0,phase='closed';
    if(isHero){
      // Assembled for a beat, then it comes apart smoothly.
      heroTime+=dt;heroSpread=reduced.matches?1:ramp(heroTime,HERO_HOLD,HERO_OPEN);
      currentPose=heroPose(heroSpread);phase=heroSpread>.98?'exploded':'opening';
      // Smooth closed body until the layers start to separate.
      const closedBody=heroSpread<.012;layers.chassis.userData.closedShell.visible=closedBody;layers.chassis.userData.volume.visible=!closedBody;
      phone.scale.setScalar(1);phone.position.y=-.06;
      phone.rotation.set(HERO_TILT,Math.PI+.16+HERO_YAW,-.5);
    }else{
      const repair=repairPose(selected,reduced.matches?10:clipTime);
      currentPose=reduced.matches?repair.pose:blend(startPose,repair.pose,smooth(clipTime/.32));
      open=repair.open;trayProgress=repair.tray;part=repair.part;fitProgress=repair.fit;phase=repair.phase;
      if(reduced.matches&&selected===0){
        Object.assign(currentPose.brokenScreen,{x:1.0,y:0,z:-.22,ry:0,rz:0,alpha:1,scale:.62,thickness:3});
        Object.assign(currentPose.display,{x:-1.0,y:0,z:-.22,ry:0,rz:0,alpha:1,scale:.62,thickness:3});phase='comparison';
        // Comparison shows only the damaged and clean screens; hide interior-only parts that the screen replacement keeps seated.
        for(const name of Object.keys(currentPose))if(!['brokenScreen','display'].includes(name))currentPose[name].alpha=0;
      }
      if(reduced.matches&&selected===2){
        for(const name of Object.keys(currentPose))currentPose[name].alpha=0;
        Object.assign(currentPose.backBroken,{x:-1.3,y:.5,z:PANE_Z,rx:0,ry:0,rz:0,alpha:1,scale:.8,thickness:1});
        Object.assign(currentPose.backNew,{x:1.3,y:.5,z:PANE_Z,rx:0,ry:0,rz:0,alpha:1,scale:.8,thickness:1});phase='comparison';
      }
      const rearView=selected===2;
      const targetYaw=rearView?.16:Math.PI+([1,3,4,5].includes(selected)?.12:0);
      const targetRoll=selected===3?-Math.PI/2:rearView?.012:-.012;
      const targetScale=[0,2].includes(selected)?1:selected===3?.82:.9;
      const targetField=selected===3?3.45:selected===4?3.4:3.8;
      if(!dragging)viewYaw=repair.yaw!==undefined?repair.yaw:reduced.matches?targetYaw:THREE.MathUtils.damp(viewYaw,targetYaw,7,dt);
      viewRoll=reduced.matches?targetRoll:THREE.MathUtils.damp(viewRoll,targetRoll,6,dt);
      viewScale=reduced.matches?targetScale:THREE.MathUtils.damp(viewScale,targetScale,6,dt);
      viewField=reduced.matches?targetField:THREE.MathUtils.damp(viewField,targetField,6,dt);
      phone.scale.setScalar(viewScale);phone.position.y=0;
      phone.rotation.set((selected===3?-.16:-.065)+dragPitch,viewYaw+dragYaw+(reduced.matches||dragging?0:Math.sin(elapsed*.7)*.035),viewRoll);
      setView(viewField);
    }
    applyPose(currentPose);
    for(const material of Object.values(rimMaterials))material.emissive.set(0);
    if(false){const focus=selected===1?'tray':selected===2?null:selected===4&&cameraSide==='front'?'cameraFront':PARTS[selected];const m=rimMaterials[focus];m.emissive.set(0x0066ff);m.emissiveIntensity=.15+part*.15;}
    stage.dataset.presentation=isHero?'exploded':selected===0?'screen-replacement':selected===2?'rear-glass-removal':'repair';
    stage.dataset.repairPhase=phase;stage.dataset.coverProgress=open.toFixed(3);stage.dataset.partProgress=part.toFixed(3);stage.dataset.plateProgress=trayProgress.toFixed(3);
    stage.dataset.cameraSide=cameraSide;stage.dataset.orientation=selected===3&&!isHero?'horizontal':'portrait';
    stage.dataset.boardVisible=String(currentPose.board.alpha>.05||(!isHero&&currentPose.innerFront.alpha>.05));stage.dataset.screenFitProgress=fitProgress.toFixed(3);
    stage.dataset.plateSide=Math.abs(currentPose.tray.ry)>Math.PI/2?'reverse':'front';
    stage.dataset.exploded=String(isHero&&heroSpread>.95);
    if(isHero){
      stage.dataset.visibleParts=names.filter(name=>currentPose[name].alpha>.002).join(',');
      stage.dataset.componentCount=String(names.length);stage.dataset.assemblyProgress=heroSpread.toFixed(3);
      stage.dataset.cameraAttached='true';stage.dataset.detachedParts='display,tray,board,backGlass';
    }
    renderer.render(scene,camera);stage.dataset.renderCount=String(Number(stage.dataset.renderCount||0)+1);
    if(!reduced.matches&&(!isHero||heroSpread<1))frame=requestAnimationFrame(draw);
  }
  function requestDraw(){if(visible&&!frame)frame=requestAnimationFrame(draw);}
  function setView(v){
    const w=stage.clientWidth,h=isHero?visual.clientHeight:w*1.1;if(!w||!h)return;
    const aspect=w/h;
    camera.top=v;camera.bottom=-v;camera.left=-v*aspect;camera.right=v*aspect;camera.updateProjectionMatrix();
  }
  function resize(){
    const w=stage.clientWidth,h=isHero?visual.clientHeight:w*1.1;if(!w||!h)return;
    setView(isHero?4.75:viewField);renderer.setSize(w,h);requestDraw();
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;requestDraw();}else{cancelAnimationFrame(frame);frame=0;}},{threshold:.05}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=0;requestDraw();}});
  reduced.addEventListener('change',()=>{requestDraw();});
  if(!isHero)visual.addEventListener('phone-selection',e=>select(e.detail.index,e.detail.cameraSide));
  // The hero is a fixed illustration: no drag-to-rotate.
  if(isHero){canvas.style.touchAction='auto';canvas.style.cursor='default';}
  if(!isHero)canvas.addEventListener('pointerdown',e=>{dragging=true;dragX=e.clientX;dragY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;const lim=isHero?[.8,.5]:[.35,.18];dragYaw=clamp(dragYaw+(e.clientX-dragX)*.005,-lim[0],lim[0]);dragPitch=clamp(dragPitch+(e.clientY-dragY)*.003,-lim[1],lim[1]);dragX=e.clientX;dragY=e.clientY;requestDraw();});
  for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,()=>{dragging=false;requestDraw();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();visible=false;cancelAnimationFrame(frame);visual.classList.remove('phone3d-ready','phone3d-loading-next');visual.classList.add('phone3d-failed');stage.hidden=true;visual.closest('#diagnostico')?.querySelector('[data-repair-replay]')?.setAttribute('hidden','');});
  resize();applyPose(currentPose);if(isHero){phone.scale.setScalar(1);phone.position.y=-.06;}if(isHero)phone.rotation.set(HERO_TILT,Math.PI+.16+HERO_YAW,-.5);else phone.rotation.set(-.065,viewYaw,0);renderer.render(scene,camera);
  stage.dataset.ready='true';stage.dataset.selectedPart=isHero?'all':selected===4&&cameraSide==='front'?'cameraFront':PARTS[selected];visual.classList.add('phone3d-ready');return{stage};
}
