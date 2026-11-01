/* Original rounded-block vocabulary toys. +Z front, bottom-centre origin, shared geometry/material. */
(() => {
  'use strict';
  const list = Object.freeze(['sun','sock','six','soup','sit','apple','ant','cat','hat','ten','top','tent','turtle','tiger','igloo','ink','insect','iguana','inchworm','pig','pen','pup','panda','pumpkin','pizza','tap','pan']);
  const stores = new WeakMap();
  function store(T) {
    if (!stores.has(T)) stores.set(T, { geometry: new Map(), material: new T.MeshStandardMaterial({vertexColors:true,roughness:.75}), block: window.YayaRound3.roundedBox(T,.15) });
    return stores.get(T);
  }
  function build(T, word, low, bank) {
    const P=[],N=[],C=[],g=bank.block,pp=g.attributes.position,nn=g.attributes.normal;
    const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),p=new T.Vector3(),s=new T.Vector3(),nm=new T.Matrix3(),v=new T.Vector3(),n=new T.Vector3(),color=new T.Color();
    const B=(x,y,z,sx,sy,sz,c,rx=0,ry=0,rz=0,geo=g)=>{
      const pp=geo.attributes.position,nn=geo.attributes.normal;
      q.setFromEuler(e.set(rx,ry,rz));m.compose(p.set(x,y,z),q,s.set(sx,sy,sz));nm.getNormalMatrix(m);color.set(c).convertSRGBToLinear();
      for(let i=0;i<pp.count;i++){v.fromBufferAttribute(pp,i).applyMatrix4(m);n.fromBufferAttribute(nn,i).applyMatrix3(nm).normalize();const shade=.88+.10*Math.max(0,n.y)+.04*Math.max(0,n.z)-.08*Math.max(0,-n.z);P.push(v.x,v.y,v.z);N.push(n.x,n.y,n.z);C.push(color.r*shade,color.g*shade,color.b*shade);}
    };
    const cream='#fff2cf', ink='#303745', pink='#f19ca4', teal='#36b6aa', gold='#ffd04e';
    function eyes(y,z,spread=.24,size=.12){for(const k of [-1,1]){B(k*spread,y,z,size,size*1.22,.08,ink);if(!low)B(k*spread-.022,y+.025,z+.046,size*.30,size*.30,.025,'#ffffff');}}
    function cheeks(y,z,spread=.34){if(!low)for(const k of [-1,1])B(k*spread,y,z,.15,.075,.055,pink);}
    function pet(tiger){
      const fur=tiger?'#f7a13d':'#edb46d',dark=tiger?ink:'#b97745';
      B(0,.53,-.04,.65,.65,.89,fur);B(0,.93,.36,.83,.68,.68,fur);
      for(const x of [-.29,.29]){if(tiger){B(x,1.30,.33,.27,.23,.23,fur,0,0,x<0?-.14:.14);B(x,1.31,.46,.12,.12,.05,pink);}else{B(x,1.29,.33,.29,.18,.26,fur);B(x,1.43,.31,.13,.17,.18,fur);B(x,1.30,.47,.13,.09,.045,pink);}}
      for(const x of [-.24,.24])for(const z of [-.32,.31])B(x,.17,z,.22,.33,.25,cream);
      B(0,.78,.72,.44,.24,.13,cream);eyes(1.00,.712,.22,.105);cheeks(.86,.724,.31);B(0,.84,.8,.10,.075,.07,tiger?ink:pink);
      if(!tiger)for(const k of [-1,1])for(const y of [.78,.86])B(k*.34,y,.74,.21,.028,.035,dark,0,0,k*(y<.8?-.15:.15));
      B(.35,.66,-.57,.20,.72,.20,fur,0,0,-.3);B(.44,1,-.57,.22,.20,.21,dark);
      if(tiger){for(const x of [-.43,.43])for(const y of [.9,1.13])B(x,y,.55,.07,.09,.25,ink,0,0,x<0?.2:-.2);for(const z of [-.30,.02,.27])B(0,.88,z,.44,.08,.10,ink);B(0,1.29,.46,.13,.08,.31,ink);if(!low)for(const x of [-.33,.33])for(const z of [-.24,.1])B(x,.57,z,.06,.32,.09,ink);}
    }
    switch(word){
      // ---- P 泡泡星球：shared one-mesh toys, +Z front ----
      case 'pig': {
        const rose='#f2a4b5',light='#ffd0d3',hoof='#af708c';
        B(0,.55,-.10,.88,.72,1.00,rose);B(0,1.00,.37,.84,.70,.69,rose);
        for(const k of [-1,1]){
          B(k*.30,1.39,.33,.28,.34,.20,rose,0,0,k*-.25);
          B(k*.30,1.40,.44,.15,.21,.03,light,0,0,k*-.25);
          for(const z of [-.39,.29]){B(k*.28,.20,z,.25,.37,.28,rose);B(k*.28,.055,z+.02,.26,.11,.29,hoof);}
        }
        B(0,.91,.77,.48,.30,.21,light);for(const k of [-1,1])B(k*.12,.92,.889,.067,.095,.035,hoof);
        eyes(1.12,.72,.23,.10);cheeks(.99,.72,.34);
        // A curled tail reads from the side of the body as well as from behind.
        for(let j=0;j<8;j++){const a=j*Math.PI/3.7;B(.48+Math.cos(a)*.115,.64+Math.sin(a)*.115,-.55,.10,.10,.11,light,0,0,a);}
        break;
      }
      case 'pen': {
        // Broad mint barrel, contrasting purple cap and a visible pocket clip.
        B(0,.66,0,.26,1.05,.26,'#48bcb9');B(0,.23,0,.27,.21,.27,'#f6d184');
        B(0,.10,0,.16,.17,.16,'#e9bb72');B(0,.01,0,.065,.09,.065,ink);
        B(0,1.38,0,.34,.48,.34,'#9377ce');B(0,1.63,0,.27,.07,.27,'#c5aff0');
        B(.205,1.35,.03,.065,.39,.08,'#f8dc74');B(.16,1.55,.03,.13,.07,.08,'#f8dc74');
        if(!low){B(-.08,.7,.14,.04,.65,.025,'#95e2d8');B(-.07,1.38,.18,.045,.29,.02,'#d2b9ef');}
        break;
      }
      case 'pup': {
        const fur='#f0c78a',ear='#a46e4e';
        B(0,.49,-.10,.72,.64,.95,fur);B(0,.99,.35,.87,.73,.66,fur);
        for(const k of [-1,1]){
          B(k*.46,.96,.30,.26,.75,.33,ear,.05,0,k*.14);
          for(const z of [-.37,.26])B(k*.24,.17,z,.26,.31,.32,cream);
        }
        B(0,.80,.72,.48,.26,.22,cream);B(0,.90,.85,.19,.12,.08,ink);
        eyes(1.11,.707,.22,.12);B(0,.67,.83,.13,.17,.07,pink);
        B(0,.67,.13,.77,.13,.51,'#69babb');B(0,.61,.42,.14,.17,.045,gold);
        B(.25,.74,-.64,.20,.60,.20,fur,.40,0,-.45);B(.37,.98,-.73,.22,.19,.21,cream);
        break;
      }
      case 'panda': {
        const white='#fff7e6',black='#343845';
        B(0,.60,-.10,.92,.95,.72,white);B(0,1.20,.19,1.04,.85,.79,white);
        for(const k of [-1,1]){
          B(k*.40,1.66,.17,.34,.34,.30,black);
          B(k*.53,.67,.00,.30,.66,.39,black,0,0,k*.13);
          B(k*.29,.15,.18,.37,.29,.48,black);
          B(k*.25,1.27,.605,.25,.30,.06,black,0,0,k*-.22);
          B(k*.23,1.29,.648,.085,.10,.025,'#fff8ef');B(k*.22,1.28,.67,.044,.065,.02,ink);
        }
        B(0,1.06,.65,.38,.23,.16,white);B(0,1.13,.75,.13,.10,.055,black);B(0,1.00,.745,.16,.035,.035,black);
        if(!low)B(.66,.47,.26,.08,.80,.08,'#78b965',0,0,-.22);
        break;
      }
      case 'pumpkin': {
        const orange=['#f39b37','#ed872b','#ffc05a','#e67a2d'];
        // Squat, terraced lobes form a pumpkin silhouette without a separate mesh.
        const lobes=8;
        for(let j=0;j<lobes;j++){const a=j*Math.PI*2/lobes,x=Math.sin(a),z=Math.cos(a),col=orange[j%4];
          B(x*.37,.54,z*.37,.42,.78,.42,col,0,a,0);
          B(x*.29,.94,z*.29,.38,.19,.38,col,0,a,0);B(x*.27,.13,z*.27,.40,.19,.40,col,0,a,0);
        }
        B(0,.56,0,.74,.91,.74,orange[0]);B(.03,1.12,0,.16,.32,.17,'#6c8e46',0,0,-.20);
        B(.23,1.10,.04,.40,.08,.23,'#84b95f',0,.35,-.18);
        for(let j=0;j<6;j++){const a=j*.65;B(-.08-j*.065,1.12+Math.sin(a)*.09,.06+Math.cos(a)*.09,.07,.07,.08,'#71994c');}
        break;
      }
      case 'pizza': {
        // An upright slice, point down on a little plate: stepped cheese rows widening up to a golden crust, pepperoni, a basil leaf.
        B(0,.05,0,.62,.1,.44,'#f6eee3');
        for(let i=0;i<6;i++)B(0,.19+i*.17,0,.2+i*.19,.19,.16,i%2?'#ffd966':'#ffcf4f');
        B(0,1.2,-.01,1.27,.23,.27,'#e39a45');B(0,1.31,-.01,1.15,.06,.22,'#f2b866');
        for(const [x,y,r] of [[-.24,.98,.21],[.26,1.0,.19],[.02,.66,.2],[-.01,.38,.14]])B(x,y,.095,r,r,.05,'#e0503e');
        if(!low){for(const [x,y] of [[-.3,.62],[.2,.8],[.33,.52]])B(x,y,.075,.07,.15,.05,'#ffe27a');B(.14,.84,.11,.13,.05,.04,'#5fae54',0,0,.5);B(-.12,.52,.11,.11,.045,.04,'#5fae54',0,0,-.6);}
        break;
      }
      case 'tap': {
        const metal='#e0a759',shine='#ffdb90',edge='#bd7c40';
        B(0,.07,0,.68,.14,.54,edge);B(0,.13,0,.56,.12,.45,shine);
        B(0,.58,0,.27,.86,.27,metal);B(0,.96,.21,.28,.28,.62,metal);
        B(0,.81,.52,.29,.38,.28,metal);B(0,.63,.52,.33,.13,.31,shine);B(0,.56,.52,.23,.035,.22,'#6c716d');
        B(0,1.11,0,.16,.21,.16,edge);B(0,1.25,0,.72,.12,.14,shine);B(0,1.25,0,.14,.12,.55,shine);
        for(const k of [-1,1])B(k*.34,1.25,0,.16,.16,.19,metal);
        if(!low)B(-.10,.55,.145,.035,.55,.025,shine);
        break;
      }
      case 'pan': {
        const iron='#4c6070',rim='#8899a4';
        B(0,.11,.14,.90,.17,.90,iron);B(0,.14,.14,1.18,.14,.59,iron);B(0,.14,.14,.59,.14,1.18,iron);
        for(let j=0;j<12;j++){const a=j*Math.PI/6;B(Math.sin(a)*.55,.22,.14+Math.cos(a)*.55,.30,.20,.13,rim,0,a,0);}
        // One long insulated handle and a warm pancake make it instantly readable.
        B(0,.19,-.67,.24,.15,.66,iron);B(0,.20,-1.10,.31,.21,.56,'#b67851');B(0,.20,-1.34,.25,.16,.10,'#e5b67a');
        B(0,.23,.14,.60,.09,.60,'#e8ae57');B(0,.23,.14,.77,.09,.38,'#e8ae57');B(0,.23,.14,.38,.09,.77,'#e8ae57');
        B(.01,.30,.15,.21,.07,.21,'#ffe29a');if(!low)B(.13,.28,.12,.11,.025,.24,'#bb783f');
        break;
      }
      // ---- I 雪花玻璃球星球 ----
      case 'igloo': {
        // 圆顶冰屋：一圈圈冰砖往上收，前面一个拱形门洞
        const snow=['#f6faff','#e7f2fc','#dcecf9'],seam='#b9d4ec';
        const rows=low?4:5;
        for(let i=0;i<rows;i++){
          const t=i/rows,R=Math.sqrt(1-t*t)*.92,y=.13+i*.24,n=Math.max(6,Math.round(2*Math.PI*R/(low?.48:.4)));
          for(let k=0;k<n;k++){
            const a=(k+(i%2)*.5)/n*Math.PI*2; if(i<2&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.42)continue;   // 门洞朝 +z（a=0）
            B(Math.sin(a)*R,y,Math.cos(a)*R,2*Math.PI*R/n*.94,.22,.26,snow[(k+i)%3],0,a,0);
          }
        }
        B(0,.13+rows*.24-.02,0,.42,.16,.42,snow[0]);
        // 门洞隧道
        for(const x of [-.3,.3])B(x,.22,.98,.2,.44,.34,snow[1]);
        B(0,.5,.98,.8,.16,.34,snow[0]);
        B(0,.22,.96,.4,.4,.3,'#5f86b3');
        if(!low)for(let i=1;i<rows;i++)B(0,.02+i*.24,.0,.04,.01,.04,seam);
        break;
      }
      case 'ink': {
        // 墨水瓶：深蓝玻璃瓶、软木塞、奶油色标签，旁边一滴墨水
        B(0,.42,0,.78,.78,.78,'#2e5db5');B(0,.42,.0,.84,.12,.84,'#244a92');
        B(0,.92,0,.38,.24,.38,'#3a6ccc');B(0,1.12,0,.3,.22,.3,'#c08a55');B(0,1.25,0,.34,.06,.34,'#a8743f');
        B(0,.45,.4,.56,.34,.04,'#fff2cf');B(0,.47,.425,.16,.2,.02,'#2e5db5');B(0,.36,.425,.08,.06,.02,'#2e5db5');
        if(!low){B(-.18,.72,.4,.08,.2,.03,'#7ea5ec');}
        // 一滴墨水
        B(.68,.12,.25,.26,.24,.24,'#2e5db5');B(.68,.3,.25,.14,.16,.14,'#2e5db5');B(.68,.42,.25,.07,.1,.07,'#2e5db5');
        break;
      }
      case 'insect': {
        // 圆滚滚的小甲虫：红色背壳、黑点、黑脑袋、六条腿、两根触角
        B(0,.4,-.05,.9,.48,1.05,'#e8483f');B(0,.62,-.05,.74,.16,.9,'#f05b4f');
        B(0,.68,-.05,.05,.04,.92,'#3a2b2b');
        for(const [x,z] of [[-.22,.18],[.22,.18],[-.28,-.2],[.28,-.2],[0,-.42]])B(x,.7,z,.16,.05,.16,'#2b2430');
        B(0,.4,.56,.56,.36,.32,'#2b2430');eyes(.48,.73,.15,.09);cheeks(.34,.73,.22);
        for(const x of [-.12,.12]){B(x,.66,.68,.04,.24,.04,'#2b2430',-.5,0,x<0?.3:-.3);B(x*1.8,.8,.78,.08,.08,.08,'#2b2430');}
        for(const side of [-1,1])for(const z of [-.32,0,.3])B(side*.52,.16,z,.28,.06,.07,'#2b2430',0,0,side*.35);
        break;
      }
      case 'iguana': {
        // 小蜥蜴：绿色身体、浅色肚皮、背上一排小刺、长长的卷尾巴，要可爱
        const g1='#5fbf5a',g2='#4aa64a',belly='#cdeb8f',spike='#f3d35a';
        B(0,.38,0,.7,.46,1.0,g1);B(0,.2,0,.58,.14,.9,belly);
        B(0,.52,.7,.66,.52,.56,g1);B(0,.36,.92,.56,.2,.32,belly);eyes(.64,.99,.18,.11);cheeks(.46,.99,.25);
        for(let i=0;i<(low?4:6);i++)B(0,.66+(i===0?.1:0),.6-i*.22,.1,.18,.12,spike);
        for(const side of [-1,1])for(const z of [-.3,.34]){B(side*.42,.16,z,.24,.16,.22,g2);B(side*.54,.05,z+.06,.16,.06,.2,g2);}
        // 尾巴：短一点，一节接一节（互相叠着，不留缝），末端往一边翘
        let x=0,z=-.55,w=.38;
        for(let i=0;i<(low?4:5);i++){B(x,.3,z,w,w*.8,.3,i%2?g2:g1,0,i*.32,0);x+=.09+i*.04;z-=.17;w*=.82;}
        break;
      }
      case 'inchworm': {
        // 小尺蠖：一拱一拱的小绿虫，脑袋在前面
        const c1='#9ad653',c2='#82c443';
        const seg=low?6:8;
        for(let i=0;i<seg;i++){
          const t=i/(seg-1),a=t*Math.PI,x=0,z=-.85+t*1.35,y=.17+Math.sin(a)*.5;
          B(x,y,z,.36,.34,.3,i%2?c2:c1);
        }
        B(0,.25,.72,.46,.44,.4,c1);eyes(.33,.93,.13,.09);cheeks(.21,.93,.19);
        for(const k of [-1,1]){B(k*.1,.54,.76,.04,.18,.04,'#5c8a2e');B(k*.12,.64,.78,.08,.08,.08,'#f39ab2');}
        for(const z of [-.85,-.7,.52,.66])for(const k of [-1,1])B(k*.12,.03,z,.08,.06,.08,'#5c8a2e');
        break;
      }
      case 'sun': {
        B(0,.85,0,.96,.96,.53,gold);B(0,.86,.27,.77,.77,.10,'#ffe99a');
        for(let i=0;i<8;i++){const a=i*Math.PI/4;B(Math.sin(a)*.76,.85+Math.cos(a)*.76,0,.20,.34,.28,'#f7ac35',0,0,-a);}
        eyes(.94,.34,.21,.10);cheeks(.76,.35,.31);B(0,.71,.35,.18,.055,.06,'#b85e35');break;
      }
      case 'sock': {
        // A matching pair: knitted blue shafts, red heel/toe, large pixel flower patches.
        for(const offset of [-.40,.40]){
          const blue='#39a8d1',red='#e84932',navy='#253958',yellow='#ffd14f',green='#4c9462';
          const S=(x,y,z,sx,sy,sz,col,rz=0)=>B(x+offset,y,z,sx,sy,sz,col,0,0,rz);
          S(.10,.78,0,.36,.94,.30,blue);S(-.07,.29,0,.57,.30,.34,blue,.58);
          S(-.24,.14,0,.40,.28,.36,red,.25);S(.24,.36,0,.25,.30,.33,red);
          S(-.19,.015,0,.45,.065,.35,navy,.28);
          S(.10,1.28,0,.46,.22,.34,red);S(.10,1.405,0,.48,.06,.36,navy);
          S(.10,1.44,0,.30,.012,.21,navy); // dark cuff opening
          for(const side of [-1,1]){
            const z=side*.155;
            S(-.03,1.31,side*.177,.10,.16,.018,yellow);S(.17,1.31,side*.177,.10,.16,.018,yellow);
            S(.06,.99,z,.08,.24,.018,yellow);S(.06,.99,z,.24,.08,.018,yellow);
            S(.18,.72,z,.10,.19,.018,red);S(.18,.72,z,.22,.07,.018,red);
            S(-.01,.53,z,.11,.12,.018,green);
            S(-.13,.28,side*.177,.07,.19,.018,yellow,.45);S(-.13,.28,side*.177,.19,.07,.018,yellow,.45);
            if(!low){S(.20,1.10,z,.075,.08,.018,green);S(-.02,.79,z,.065,.07,.018,'#f598a7');}
          }
        }break;
      }
      case 'soup': {
        // Low terracotta bowl with a real cream rim and a recessed, round soup surface.
        const lathe=(points,col)=>{const geom=new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),low?20:28).toNonIndexed();B(0,0,0,1,1,1,col,0,0,0,geom);geom.dispose();};
        lathe([[0,.04],[.52,.04],[.59,.09],[.59,.15],[.67,.15],[.67,.25],[.74,.25],[.74,.40],[.70,.40],[.64,.24],[0,.24]],'#c97f52');
        lathe([[.74,.38],[.79,.40],[.79,.455],[.71,.455],[.69,.40]],'#f9e7ba');
        const broth=new T.CylinderGeometry(.705,.705,.035,low?20:28).toNonIndexed();B(0,.382,0,1,1,1,'#f5dea0',0,0,0,broth);broth.dispose();
        // Ribbed ceramic sides are broad enough to read from the phone camera.
        for(let i=0;i<(low?16:24);i++){const a=i*Math.PI*2/(low?16:24);B(Math.cos(a)*.748,.325,Math.sin(a)*.748,.035,.145,.028,i%2?'#dc9466':'#bc734b',0,-a+Math.PI/2);}
        const carrot=(x,z,a)=>{B(x,.43,z,.23,.075,.11,'#e79c42',0,a);B(x,.43,z,.11,.075,.23,'#e79c42',0,a);};
        carrot(-.30,-.22,.25);carrot(.33,.23,-.18);
        for(const [x,z] of [[.25,-.28],[-.24,.28]]){B(x,.44,z,.20,.10,.21,'#79984e');B(x-.065,.50,z-.025,.14,.08,.14,'#98ad62');B(x+.055,.49,z+.055,.12,.08,.14,'#889f54');}
        for(const [x,z] of [[0,.06],[-.04,-.43],[.43,-.04]])B(x,.43,z,.13,.075,.12,'#ead195',0,.3);
        if(!low)for(const [x,z] of [[-.46,.05],[.04,.40],[.14,-.08]])B(x,.42,z,.055,.025,.08,'#62834c',0,.4);
        // Short wisps keep the food visible and still say “hot soup”.
        for(const x of [-.33,.27]){B(x,.66,-.33,.035,.20,.035,'#fff1cb',0,0,.2);B(x-.035,.83,-.33,.035,.16,.035,'#fff1cb',0,0,-.25);}break;
      }
      case 'sit':
        for(const x of [-.38,.38])for(const z of [-.3,.3])B(x,.35,z,.16,.7,.16,'#ae7848');B(0,.76,0,1,.20,.92,teal);
        for(const x of [-.38,.38])B(x,1.10,-.32,.16,.8,.16,'#ae7848');B(0,1.41,-.32,1,.39,.18,'#6fd5c3');if(!low)B(0,1.4,-.21,.71,.10,.04,cream);break;
      case 'apple':
        B(0,.56,0,1.04,.89,.95,'#ed6558');for(const x of [-.23,.23])B(x,.94,0,.61,.40,.76,'#f1785d');B(0,1.23,0,.13,.35,.14,'#885b3e',0,0,-.16);B(.26,1.30,0,.47,.16,.23,'#6ab65b',0,-.25,.28);if(!low)B(-.28,.75,.48,.16,.29,.06,cream,0,0,-.2);break;
      case 'ant':
        B(0,.44,-.48,.62,.55,.67,'#795669');B(0,.46,.05,.39,.41,.45,'#a16a76');B(0,.59,.50,.63,.56,.54,'#795669');
        for(const z of [-.30,.04,.3])for(const k of [-1,1]){B(k*.30,.31,z,.42,.13,.13,ink,0,k*.18,k*.38);B(k*.50,.17,z+.02,.13,.34,.13,ink,0,0,k*.2);}
        for(const k of [-1,1]){B(k*.20,.96,.53,.09,.40,.09,ink,0,0,-k*.24);B(k*.25,1.13,.54,.15,.13,.14,'#a16a76');}eyes(.66,.79,.16,.10);cheeks(.51,.79,.24);break;
      case 'cat':pet(false);break;
      case 'tiger':pet(true);break;
      case 'hat':
        B(0,.18,0,1.43,.20,1.02,'#454f72');B(0,.70,0,.86,.98,.75,'#454f72');B(0,.34,.0,.90,.23,.79,'#e7928c');B(0,.34,.41,.22,.20,.07,gold);B(0,.34,.45,.11,.10,.03,'#e7928c');if(!low)B(-.26,.82,.38,.11,.55,.025,'#68759a');break;
      case 'six':case 'ten': {
        const shapes=word==='six'?[['111','100','111','101','111']]:[['010','110','010','010','111'],['111','101','101','101','111']];const step=.27,off=word==='six'?0:-.50;
        shapes.forEach((rows,d)=>rows.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')B(off+d*.95+(x-1)*step,(4-y)*step+.14,0,.285,.285,low?.40:.47,d?teal:'#f3b447');})));break;
      }
      case 'top':
        B(0,.09,0,.14,.18,.14,ink);for(let i=0;i<4;i++){const w=.27+i*.22;B(0,.23+i*.18,0,w,.22,w,i%2?'#e97666':gold,0,i*.1);}B(0,.92,0,1.08,.18,1.08,teal,0,.18);B(0,1.22,0,.19,.50,.19,'#b9814f');break;
      case 'tent': {
        // Two thick pitched roof slabs, with a real hollow front and back, rather than a triangular icon.
        for(const k of [-1,1]){B(k*.32,.65,0,.16,1.22,1.15,'#efbd50',0,0,k*.57);B(k*.42,.38,.53,.24,.51,.07,cream,0,0,k*.12);B(k*.63,.06,.56,.13,.12,.14,'#ad704e');}
        B(0,.08,0,1.34,.12,1.24,'#7fa998');B(0,1.19,0,.15,.15,1.29,'#f7d989');break;
      }
      case 'turtle': {
        // Approved voxel sea turtle, without the island. Actual stepped geometry,
        // exposed faces greedily merged so the small vocabulary toy stays cheap.
        const vox=new Map(),unit=low?1.5:1,skin='#69a49a',skinDark='#548c86',belly='#e8d68c';
        const put=(x,y,z,col)=>vox.set([Math.round(x/unit),Math.round(y/unit),Math.round(z/unit)].join(','),col);
        const fill=(x0,x1,y0,y1,z0,z1,col)=>{for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)put(x,y,z,col);};
        // Four broad, flat, stepped paddles. Fore flippers sweep toward the head.
        for(const sign of [-1,1])for(const front of [true,false]){
          const widths=front?[2,3,3,3,2,2,1,0]:[2,2,2,1,1,0];
          widths.forEach((w,j)=>{const x=sign*(7+j),zc=(front?4:-8)+(front?1:-1)*Math.floor(j*.55);
            for(let z=zc-w;z<=zc+w;z++){put(x,1,z,belly);put(x,2,z,j>4?skinDark:skin);}
          });
        }
        for(let z=-16;z<=-11;z++)for(let x=-Math.floor((z+17)/3);x<=Math.floor((z+17)/3);x++)put(x,2,z,skin);
        // Connected ellipsoidal terraces; the broad patches read as shell scutes.
        const seeds=[[0,-2],[-5,-6],[5,-6],[-5,2],[5,2],[0,-10],[0,6]];
        const greens=['#88b845','#77a73d','#92bf4e','#79a946','#8ab54a','#6f9b3c','#8cb342'];
        for(const [y,rx,rz] of [[2,8,10],[3,9,11],[4,9,11],[5,8,10],[6,8,9],[7,7,8],[8,6,7],[9,5,5]]){
          for(let x=-rx;x<=rx;x++)for(let z=-rz;z<=rz;z++)if(x*x/(rx*rx)+z*z/(rz*rz)<=1){
            let col=belly;
            if(y>=4){const near=seeds.map(([sx,sz],i)=>({i,d:Math.hypot(x-sx,z-2-sz)})).sort((a,b)=>a.d-b.d);col=near[1].d-near[0].d<.8?'#746441':greens[near[0].i];}
            put(x,y,z-2,col);
          }
        }
        // A visible narrow neck, low broad head, thin cream jaw and short muzzle.
        fill(-1,1,3,5,8,13,skinDark);fill(-1,1,3,3,8,13,belly);
        fill(-3,3,5,8,12,16,skin);fill(-2,2,9,9,12,15,skinDark);
        fill(-2,2,4,4,12,17,belly);fill(-3,3,5,5,12,16,belly);
        fill(-2,2,6,7,17,17,skin);fill(-1,1,5,5,17,17,'#48675b');
        // Eyes sit on the front AND outside cheek surfaces, never buried in the head.
        for(const sign of [-1,1]){
          fill(sign<0?-3:2,sign<0?-2:3,7,8,16,16,'#263a32');put(sign*2,8,16,'#fff8df');
          fill(sign*3,sign*3,7,8,14,15,'#263a32');put(sign*3,8,15,'#fff8df');
          put(sign,7,17,'#3b6f65');
        }
        // Group exposed voxel faces by plane and colour, merge adjacent rectangles.
        for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
          const u=(axis+1)%3,w=(axis+2)%3,planes=new Map();
          for(const [key,col] of vox){const xyz=key.split(',').map(Number),adj=xyz.slice();adj[axis]+=sign;if(vox.has(adj.join(',')))continue;
            const plane=xyz[axis];if(!planes.has(plane))planes.set(plane,new Map());planes.get(plane).set(xyz[u]+','+xyz[w],col);
          }
          for(const [plane,mask] of planes)while(mask.size){
            const [key,col]=mask.entries().next().value,[a,b]=key.split(',').map(Number);let width=1,height=1;
            while(mask.get((a+width)+','+b)===col)width++;
            outer:while(true){for(let j=0;j<width;j++)if(mask.get((a+j)+','+(b+height))!==col)break outer;height++;}
            for(let j=0;j<width;j++)for(let k=0;k<height;k++)mask.delete((a+j)+','+(b+k));
            const corners=[[a-.5,b-.5],[a+width-.5,b-.5],[a+width-.5,b+height-.5],[a-.5,b+height-.5]];
            const normal=[0,0,0];normal[axis]=sign;color.set(col).convertSRGBToLinear();const shade=.88+.10*Math.max(0,normal[1])+.04*Math.max(0,normal[2])-.08*Math.max(0,-normal[2]);
            for(const i of sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]){const xyz=[0,0,0];xyz[axis]=plane+sign*.5;xyz[u]=corners[i][0];xyz[w]=corners[i][1];P.push(...xyz);N.push(...normal);C.push(color.r*shade,color.g*shade,color.b*shade);}
          }
        }
        break;
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(P,3));geo.setAttribute('normal',new T.Float32BufferAttribute(N,3));geo.setAttribute('color',new T.Float32BufferAttribute(C,3));geo.computeBoundingBox();
    const size=geo.boundingBox.getSize(new T.Vector3()),center=geo.boundingBox.getCenter(new T.Vector3());geo.translate(-center.x,-geo.boundingBox.min.y,-center.z);const scale=1.5/Math.max(size.x,size.y,size.z);geo.scale(scale,scale,scale);geo.computeBoundingBox();geo.computeBoundingSphere();geo.userData.wordModelShared=true;geo.userData.word=word;
    return geo;
  }
  function create(T,word,options={}) {
    if(!list.includes(word))return null;
    const bank=store(T),low=options.lowPower===undefined?!!window.YAYA_LOW_POWER:!!options.lowPower,key=word+(low?':low':':full');
    if(!bank.geometry.has(key))bank.geometry.set(key,build(T,word,low,bank));
    const root=new T.Group(),mesh=new T.Mesh(bank.geometry.get(key),bank.material);mesh.castShadow=mesh.receiveShadow=true;mesh.userData.wordModelShared=true;root.add(mesh);root.name='word-model-'+word;root.userData.word=word;root.userData.wordModel=true;
    root.userData.setMuted=muted=>{const greyKey=key+':grey';if(muted&&!bank.geometry.has(greyKey)){const grey=bank.geometry.get(key).clone(),a=grey.attributes.color;for(let i=0;i<a.count;i++){const l=.16+.40*(.2126*a.getX(i)+.7152*a.getY(i)+.0722*a.getZ(i));a.setXYZ(i,l,l,l);}grey.userData.wordModelShared=true;bank.geometry.set(greyKey,grey);}mesh.geometry=bank.geometry.get(muted?greyKey:key);root.userData.muted=!!muted;};
    return root;
  }
  window.YayaWordModels={create,has:word=>list.includes(word),list};
})();
