import { io } from 'socket.io-client';
const URL='https://movemall-source-production.up.railway.app';
const t=setTimeout(()=>{console.log('❓ ไม่ตอบใน 15 วิ');process.exit(2);},15000);
const s=io(URL,{transports:['websocket'],reconnection:false,auth:{token:'dummy.local.token'}});
s.on('connect',()=>{clearTimeout(t);console.log('❌ production ยังรับ token ปลอม — ยังไม่ deploy ตัวแก้');s.close();process.exit(1);});
s.on('connect_error',e=>{clearTimeout(t);console.log(`✅ production ปฏิเสธ token ปลอมแล้ว (${e.message})`);process.exit(0);});
