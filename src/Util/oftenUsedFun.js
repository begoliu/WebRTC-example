export function trace(msg){
    msg = msg.trim();
    const runtime = (performance.now() / 1000).toFixed(3);
    console.log(runtime, msg);
}