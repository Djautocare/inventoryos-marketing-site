const form=document.getElementById('label-time-form');
if(form)form.addEventListener('submit',event=>{
 event.preventDefault();
 if(!form.reportValidity())return;
 const count=Number(form.elements.labels.value),seconds=Number(form.elements.seconds.value);
 if(!Number.isInteger(count)||count<1||count>10000||!Number.isInteger(seconds)||seconds<1||seconds>3600)return;
 const total=count*seconds,hours=Math.floor(total/3600),minutes=Math.floor(total%3600/60),remaining=total%60;
 const duration=[hours?hours+' '+(hours===1?'hour':'hours'):'',minutes?minutes+' '+(minutes===1?'minute':'minutes'):'',remaining?remaining+' '+(remaining===1?'second':'seconds'):''].filter(Boolean).join(' ');
 document.getElementById('label-time-result').textContent=count+' '+(count===1?'label':'labels')+' × '+seconds+' '+(seconds===1?'second':'seconds')+' = '+duration+' of manual preparation.';
});
