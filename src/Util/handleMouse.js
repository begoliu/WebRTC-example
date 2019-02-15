//转换byte
export const Int2Byte = (num,len) => {
    let bytes = [];
    let base = 256;
    for(let i = 4; i > 0  ; i--){
        if(num%Math.pow(base,i-1) === num) {
            bytes.push(0);
            // console.log(bytes);
        }else{
            if(num%Math.pow(base,i-1) === 0) {
                bytes.push(num/Math.pow(base,i-1));
                break;
            }
            bytes.push(parseInt(num/Math.pow(base,i-1),10));
            num = num - parseInt(num/Math.pow(base,i-1),10)*Math.pow(base,i-1);
        }
    }
    while (bytes.length < 4) {
        bytes.push(0);
    }
    return bytes.length > len ? bytes.reverse().filter((it,index) => index < len) : bytes.reverse();
};



//获取鼠标点击的坐标
function mouseXY(event){
    if(event){
        event = event || window.event;
        return {mX:event.offsetX,mY:event.offsetY}
    }
    return {mX:null,mY:null}
}
//单击
function mouseSingleClick(){}
//双击
function mouseDoubleClick(){}



