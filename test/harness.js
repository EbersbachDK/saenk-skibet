const fs=require('fs');const src=fs.readFileSync(process.argv[2],'utf8');
const errors=[];const noop=()=>{};
function ctxStub(){const grad={addColorStop:noop};return new Proxy({},{get(t,k){if(k in t)return t[k];if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>grad;if(k==='measureText')return s=>({width:String(s).length*6});if(k==='getImageData')return ()=>({data:new Uint8ClampedArray(4)});if(k==='roundRect')return noop;if(typeof k==='string'&&/^[a-z]/.test(k)&&!['globalAlpha','fillStyle','strokeStyle','lineWidth','font','textAlign','textBaseline','globalCompositeOperation','lineCap','lineJoin'].includes(k))return noop;return t[k];},set(t,k,v){t[k]=v;return true;}});}
const els={};
function mkEl(id){const listeners={};const el={id,hidden:false,style:{setProperty:noop},dataset:{},classList:{toggle:noop,add:noop,remove:noop,contains:()=>false},textContent:'',innerHTML:'',value:'',width:300,height:150,
 children:[],listeners,addEventListener(t,f){(listeners[t]=listeners[t]||[]).push(f);},setAttribute(k,v){this['attr_'+k]=v;},getAttribute(k){return this['attr_'+k];},appendChild(c){this.children.push(c);},
 getContext:()=>ctxStub(),getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720}),setPointerCapture:noop,closest:()=>null,querySelectorAll:()=>[],focus:noop,select:noop,clientWidth:1280,clientHeight:720,
 fire(t,e){for(const f of listeners[t]||[])f(Object.assign({preventDefault:noop,target:el,currentTarget:el,pointerId:1,pointerType:'mouse',button:0},e||{}));}};return el;}
const html=src;const scriptStart=html.indexOf('<script>')+8,scriptEnd=html.lastIndexOf('</script>');const code=html.slice(scriptStart,scriptEnd);
// collect tool / mviews / mspawn buttons from html
function collect(re,cls){const out=[];let m;while((m=re.exec(html))){const e=mkEl('');e.className=cls;e.dataset[m[1]]=m[2];out.push(e);}return out;}
const toolEls=collect(/class="[^"]*\btool\b[^"]*"[^>]*data-(tool)="([a-z]+)"/g,'tool');
const toolEls2=toolEls.length?toolEls:collect(/data-(tool)="([a-z]+)"/g,'tool');
const spawnEls=collect(/data-(sp)="([a-z]+)"/g,'sp'),viewEls=collect(/data-(v)="([a-z]+)"/g,'v'),panEls=collect(/data-(pan)="([-0-9]+)"/g,'pan');
global.document={getElementById:id=>els[id]||(els[id]=mkEl(id)),createElement:t=>mkEl(t),querySelectorAll:sel=>{if(sel==='.tool')return toolEls2;if(sel.includes('mspawn'))return spawnEls;if(sel.includes('mviews'))return viewEls;if(sel==='.phold')return panEls;return [];},
 addEventListener:noop,body:mkEl('body'),hidden:false};
const wl={};global.window={devicePixelRatio:1,addEventListener:(t,f)=>{(wl[t]=wl[t]||[]).push(f);},scrollTo:noop};
global.matchMedia=()=>({matches:false,addEventListener:noop});global.navigator={maxTouchPoints:0,userAgent:'node'};global.location={search:'',hash:'#test1'};global.history={replaceState:noop};
const store={};global.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}};
let rafQ=[];global.requestAnimationFrame=f=>{rafQ.push(f);};global.setTimeout=(f)=>{rafQ.push(()=>f());};
let now=0;global.performance={now:()=>now};
const origErr=console.error;console.error=(...a)=>{errors.push('render: '+(a[0]&&a[0].stack||a.join(' ')));};
const api=`;globalThis.G={get bodies(){return bodies},get people(){return people},get sharks(){return sharks},get sunkAt(){return sunkAt},start,setTool,setView,click:()=>click(),ptr,spawnWhale,spawnHunter,spawnHeli,tsunami,addShark,applyWorld,ORDER,SHIPS,get whale(){return whale},get helis(){return helis},get hunters(){return hunters},get camX(){return camX},setThunder:v=>{thunder=v},drive,get started(){return started},get rescued(){return rescued},openDesigner,dz,get DESIGN(){return DESIGN},MODS,HULLS,buildDesign,get time(){return time}};`;
try{(0,eval)(code+api);}catch(e){console.log('INIT ERROR',e.stack);process.exit(1);}
function run(n){for(let i=0;i<n;i++){now+=16.7;const q=rafQ;rafQ=[];for(const f of q){try{f(now);}catch(e){errors.push(e.stack.split('\n').slice(0,3).join(' | '));if(errors.length>200){report();process.exit(0);}}}}}
function report(){const c={};for(const e of errors)c[e]=(c[e]||0)+1;for(const [e,n] of Object.entries(c))console.log(n+'x',e);console.log('total errors',errors.length);}
const G=globalThis.G;
function shipCenter(){const b=G.bodies.reduce((a,x)=>(!a||x.M>a.M)?x:a,null);if(!b)return null;return {x:b.px+b.g.W*8/2*Math.cos(b.a),y:b.py+b.g.H*8*.5};}
const seeds=['test1','arktis9','abc','999','storm','x7'];
let si=0;
for(const view of ['side','iso','top'])for(const k of G.ORDER){
  G.applyWorld(seeds[(si++)%seeds.length]);G.start(k);G.setView(view);run(60);
  for(const tool of ['water','drill','fire','bomb','torpedo','person','bolt']){G.setTool(tool);const c=shipCenter();if(!c)break;G.ptr.sx=c.x-G.camX+(Math.random()-.5)*200;G.ptr.sy=view==='side'?c.y+(Math.random()-.5)*60:360+(Math.random()-.5)*60;
    if(view==='side'){G.ptr.x=G.ptr.sx+G.camX;G.ptr.y=G.ptr.sy;}
    G.ptr.down=true;G.ptr.over=true;G.click();run(40);G.ptr.down=false;run(20);}
  G.addShark();G.addShark();G.spawnHunter();G.spawnHeli();G.spawnWhale();G.tsunami();G.setThunder(true);G.drive.r=true;G.drive.pl=true;run(500);G.drive.r=false;G.drive.pl=false;G.setThunder(false);run(1200);
  console.log(view,k,'bodies',G.bodies.length,'people',G.people.length,'sunk',G.sunkAt!==null,'whale',G.whale&&G.whale.st,'rescued',G.rescued);
}
// designer
G.openDesigner();for(const m of Object.keys(G.MODS))G.dz.d.items.push({t:m,x:Object.keys(G.MODS).indexOf(m)*9});try{G.buildDesign(G.dz.d);}catch(e){errors.push('design '+e.stack);}
report();
