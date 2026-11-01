(() => {
  function portrait(T,renderer,model,{height=1.05,distance=3.4,size=160}={}) {
    const sc=new T.Scene(),rt=new T.WebGLRenderTarget(size,size);rt.texture.encoding=T.sRGBEncoding;
    sc.add(new T.HemisphereLight(0xfff6ea,0xc9a98f,1.4));const key=new T.DirectionalLight(0xffffff,1.8);key.position.set(2,3,4);sc.add(key,model);
    const cam=new T.PerspectiveCamera(28,1,.1,20);cam.position.set(.4,height+.12,distance);cam.lookAt(0,height,0);
    const target=renderer.getRenderTarget(),clear=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();
    renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(sc,cam);
    const pixels=new Uint8Array(size*size*4);renderer.readRenderTargetPixels(rt,0,0,size,size,pixels);renderer.setRenderTarget(target);renderer.setClearColor(clear,alpha);rt.dispose();
    const cv=document.createElement('canvas');cv.width=cv.height=size;const g=cv.getContext('2d'),data=g.createImageData(size,size);for(let y=0;y<size;y++)data.data.set(pixels.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4);g.putImageData(data,0,0);return cv.toDataURL();
  }
  function create({THREE:T,renderer,read,write,change,start}) {
    let profile=read('yaya-profile')||{};
    const avatars=['boy','girl'],pics=Object.fromEntries(avatars.map(v=>[v,portrait(T,renderer,YayaCharacters.explorer(T,v).scene,{height:.95,distance:3.85})]));
    const box=document.createElement('section');box.className='avatar-picker';box.innerHTML='<h3>你想当谁？</h3><div class="avatar-options">'+avatars.map(v=>`<button type="button" data-avatar="${v}" aria-label="${v==='boy'?'男孩':'女孩'}探险家" aria-pressed="false"><img src="${pics[v]}" alt=""><b>${v==='boy'?'男孩':'女孩'}探险家</b></button>`).join('')+'</div>';
    start.before(box);
    function refresh(){box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.avatar===profile.avatar)));start.disabled=!avatars.includes(profile.avatar)}
    function select(v){if(!avatars.includes(v))return;profile={...profile,avatar:v};write('yaya-profile',profile);change(v);refresh()}
    box.addEventListener('click',e=>{const b=e.target.closest('[data-avatar]');if(b)select(b.dataset.avatar)});refresh();
    return {get avatar(){return profile.avatar||'boy'},get selected(){return avatars.includes(profile.avatar)},pics,select,refresh,portrait};
  }
  window.YayaProfile={create,portrait};
})();
