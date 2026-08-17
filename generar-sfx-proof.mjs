import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SR = 44100, DUR = 14.2, N = Math.floor(SR * DUR); const out = new Float32Array(N);
function whoosh(dur = 0.4){const n=Math.floor(SR*dur),b=new Float32Array(n);let p=0;for(let i=0;i<n;i++){const t=i/SR;const env=t<0.05?t/0.05:Math.exp(-(t-0.05)*9);let no=Math.random()*2-1;p=p*0.6+no*0.4;b[i]=p*env*(0.6+0.4*Math.sin(2*Math.PI*(2-t*3)*t))*0.5;}return b;}
function pop(dur=0.12){const n=Math.floor(SR*dur),b=new Float32Array(n);for(let i=0;i<n;i++){const t=i/SR;const f=500+500*Math.exp(-t*30);b[i]=Math.sin(2*Math.PI*f*t)*Math.exp(-t*26)*0.5;}return b;}
function place(buf,at,g=1){const o=Math.floor(at*SR);for(let i=0;i<buf.length&&o+i<N;i++)if(o+i>=0)out[o+i]+=buf[i]*g;}
const P=pop();
// sin whoosh de aire (quitado). Solo pops suaves al aparecer cada elemento:
[0.45,3.77,4.17,4.57,7.45,10.95].forEach(t=>place(P,t,0.7));
let pk=0;for(let i=0;i<N;i++)pk=Math.max(pk,Math.abs(out[i]));const g=pk>0?Math.pow(10,-3/20)/pk:1;
const buf=Buffer.alloc(44+N*2);buf.write("RIFF",0);buf.writeUInt32LE(36+N*2,4);buf.write("WAVE",8);buf.write("fmt ",12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(SR,24);buf.writeUInt32LE(SR*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write("data",36);buf.writeUInt32LE(N*2,40);
for(let i=0;i<N;i++){let s=Math.max(-1,Math.min(1,out[i]*g));buf.writeInt16LE((s*32767)|0,44+i*2);}
fs.writeFileSync(path.join(__dirname,"public","voz","sfx_proof.wav"),buf);console.log("🔊 sfx_proof.wav ok");
