(function(){
  "use strict";
  const C = window.B1_ACCESS_V2;
  if(!C) return;
  const TKEY = "B1V2_TEACHER_" + C.version;
  const S2KEY = "B1V2_STAGE2_" + C.version;
  function isTeacher(){ return sessionStorage.getItem(TKEY)==="1" || localStorage.getItem(TKEY)==="1"; }
  function stageForPath(path){
    const p=(path||location.pathname).toLowerCase();
    if(/\/(lesson-[123]|review-1)(\/|$)/.test(p)) return "stage1";
    if(/\/(lesson-[456]|review-2)(\/|$)/.test(p)) return "stage2";
    if(/\/(lesson-[789]|review-3)(\/|$)/.test(p)) return "stage3";
    return null;
  }
  function isStage2Unlocked(){ return localStorage.getItem(S2KEY)==="1"; }
  function canOpen(stage){
    if(isTeacher()) return true;
    if(stage==="stage1") return true;
    if(stage==="stage2") return isStage2Unlocked();
    return false;
  }
  function css(){
    if(document.getElementById("b1v2-style")) return;
    const s=document.createElement("style"); s.id="b1v2-style"; s.textContent=`
      .b1v2-badge{position:absolute;right:13px;top:13px;z-index:20;padding:5px 9px;border:1px solid #d4dfd8;border-radius:999px;background:rgba(255,255,255,.94);font:700 12px/1.2 "Microsoft JhengHei","Noto Sans TC",sans-serif;color:#53675e}
      .b1v2-dim{filter:saturate(.72);opacity:.86}.b1v2-toolbar{position:fixed;right:12px;bottom:12px;z-index:99990;display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
      .b1v2-toolbar button{border:1px solid #ccd9d1;background:#fffefb;color:#50635a;border-radius:999px;padding:8px 11px;font:700 12px/1 "Microsoft JhengHei","Noto Sans TC",sans-serif;box-shadow:0 5px 16px rgba(30,50,42,.09);cursor:pointer}
      .b1v2-modal{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;background:rgba(25,45,37,.34);padding:20px}
      .b1v2-box{width:min(420px,92vw);background:#fffefb;border:1px solid #d8e2dc;border-radius:20px;padding:24px;box-shadow:0 22px 65px rgba(20,42,33,.2);font-family:"Microsoft JhengHei","Noto Sans TC",sans-serif;color:#263c35}
      .b1v2-box h2{font-size:21px;margin:0 0 8px}.b1v2-box p{margin:0 0 14px;color:#6f7d77;line-height:1.5}.b1v2-box input{width:100%;box-sizing:border-box;border:1px solid #cbd8d0;border-radius:11px;padding:12px 13px;font-size:16px}.b1v2-msg{min-height:20px;color:#a14e4e!important;font-size:13px}.b1v2-actions{display:flex;justify-content:flex-end;gap:9px}.b1v2-actions button{border:1px solid #bed0c5;border-radius:10px;padding:9px 14px;background:#edf5ef;color:#29483d;font-weight:800;cursor:pointer}.b1v2-actions .sec{background:#fff;color:#65756d}
      body.b1v2-blocked>*:not(.b1v2-modal):not(script){visibility:hidden!important}
    `;document.head.appendChild(s);
  }
  function modal(title,text,opt={}){
    css(); const wrap=document.createElement("div");wrap.className="b1v2-modal";
    wrap.innerHTML=`<div class="b1v2-box"><h2>${title}</h2><p>${text}</p>${opt.input===false?'':'<input type="password" autocomplete="off" aria-label="密碼">'}<p class="b1v2-msg"></p><div class="b1v2-actions"><button class="sec" data-cancel>取消</button><button data-ok>${opt.ok||'確認'}</button></div></div>`;
    document.body.appendChild(wrap); const input=wrap.querySelector('input'),msg=wrap.querySelector('.b1v2-msg');
    const close=()=>wrap.remove();
    wrap.querySelector('[data-cancel]').onclick=()=>{close();opt.onCancel&&opt.onCancel()};
    wrap.querySelector('[data-ok]').onclick=()=>opt.onOK&&opt.onOK(input?input.value:'',msg,close);
    if(input){setTimeout(()=>input.focus(),20);input.onkeydown=e=>{if(e.key==='Enter')wrap.querySelector('[data-ok]').click()};}
  }
  function request(stage,go){
    if(canOpen(stage)) return go();
    const s=C.stages[stage];
    if(stage==="stage3" || s.mode==="locked") return modal("目前尚未開放",`${s.label} 目前尚未開放。`,{input:false,ok:"返回",onOK:(v,m,c)=>c()});
    if(stage==="stage2") return modal(`解鎖 ${s.label}`,"請輸入本階段課程密碼。",{onOK:(v,m,c)=>{if(v===s.code){localStorage.setItem(S2KEY,"1");c();go();}else m.textContent="密碼錯誤，請再試一次。";}});
  }
  function teacherLogin(){
    modal("教師登入","輸入教師密碼後，可直接開啟全部課程。",{onOK:(v,m,c)=>{if(v===C.teacherCode){localStorage.setItem(TKEY,"1");c();location.reload();}else m.textContent="教師密碼錯誤。";}});
  }
  function resetAll(){ localStorage.removeItem(TKEY); sessionStorage.removeItem(TKEY); localStorage.removeItem(S2KEY); location.reload(); }
  function toolbar(){
    css(); const b=document.createElement('div');b.className='b1v2-toolbar';
    if(isTeacher()) b.innerHTML='<button data-teacher>教師模式</button><button data-reset>登出並清除測試</button>';
    else b.innerHTML='<button data-login>教師登入</button><button data-reset>清除測試狀態</button>';
    document.body.appendChild(b);
    const login=b.querySelector('[data-login]'); if(login)login.onclick=teacherLogin;
    b.querySelector('[data-reset]').onclick=resetAll;
  }
  function setupHome(){
    css();
    document.querySelectorAll('a.card[href]').forEach(a=>{
      const stage=stageForPath(new URL(a.href,location.href).pathname); if(!stage)return;
      const badge=document.createElement('span');badge.className='b1v2-badge';
      if(isTeacher()) badge.textContent='教師可用';
      else if(stage==='stage1') badge.textContent='公開';
      else if(stage==='stage2' && isStage2Unlocked()) badge.textContent='已解鎖';
      else if(stage==='stage2'){badge.textContent='🔒 需密碼';a.classList.add('b1v2-dim');}
      else {badge.textContent='🔒 尚未開放';a.classList.add('b1v2-dim');}
      a.style.position=a.style.position||'relative'; a.appendChild(badge);
      a.addEventListener('click',e=>{e.preventDefault(); const href=a.href; request(stage,()=>location.href=href);});
    });
    toolbar();
  }
  function guardPage(){
    const stage=stageForPath(location.pathname); if(!stage)return;
    document.body.classList.add('b1v2-blocked');
    request(stage,()=>{document.body.classList.remove('b1v2-blocked');toolbar();});
  }
  window.B1AccessV2={setupHome,guardPage,resetAll};
})();