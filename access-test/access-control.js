(function(){
  "use strict";
  const cfg = window.B1_ACCESS_CONFIG;
  if (!cfg) return;
  const KEY = 'b1_access_' + cfg.version;
  const TEACHER_KEY = 'b1_teacher_' + cfg.version;
  const params = new URLSearchParams(location.search);
  const previewStudent = params.get('studentPreview') === '1';
  function getUnlocked(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
  function saveUnlocked(obj){localStorage.setItem(KEY,JSON.stringify(obj))}
  function isTeacher(){return !previewStudent && localStorage.getItem(TEACHER_KEY)==='1'}
  function stageUnlocked(stage){
    const s=cfg.stages[stage]; if(!s)return false;
    if(isTeacher())return true;
    if(s.status==='public')return true;
    if(s.status==='locked')return false;
    return !!getUnlocked()[stage];
  }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function styleOnce(){
    if(document.getElementById('b1-access-style'))return;
    const st=document.createElement('style');st.id='b1-access-style';st.textContent=`
      .b1-access-modal{position:fixed;inset:0;background:rgba(23,42,34,.34);display:grid;place-items:center;z-index:99999;padding:22px}
      .b1-access-box{width:min(92vw,420px);background:#fffef9;border:1px solid #d9e2dc;border-radius:22px;padding:26px;box-shadow:0 22px 60px rgba(31,55,45,.22);font-family:"Microsoft YaHei","Noto Sans TC",system-ui,sans-serif;color:#263c35}
      .b1-access-box h2{margin:0 0 8px;font-size:1.35rem}.b1-access-box p{margin:0 0 16px;color:#6e7c76;line-height:1.55}
      .b1-access-box input{width:100%;font-size:1rem;padding:12px 14px;border:1px solid #cbd8d0;border-radius:12px;outline:none;background:#fff}
      .b1-access-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
      .b1-access-btn{border:1px solid #b8c9be;background:#edf5ef;color:#29483d;padding:9px 14px;border-radius:10px;font-weight:700;cursor:pointer}
      .b1-access-btn.secondary{background:#fff;color:#68776f}.b1-access-msg{min-height:1.4em;margin-top:10px!important;color:#9a4e4e!important;font-size:.9rem}
      .b1-access-toolbar{position:fixed;right:14px;bottom:14px;z-index:9998;display:flex;gap:8px;align-items:center;font-family:"Microsoft YaHei","Noto Sans TC",system-ui,sans-serif}
      .b1-access-chip{border:1px solid #d0ddd5;background:rgba(255,255,255,.94);color:#51645b;border-radius:999px;padding:7px 11px;font-size:.78rem;font-weight:700;box-shadow:0 5px 16px rgba(31,55,45,.08);cursor:pointer}
      .b1-access-panel{position:fixed;right:14px;bottom:58px;z-index:9999;width:min(92vw,380px);background:#fffef9;border:1px solid #d8e1db;border-radius:18px;padding:18px;box-shadow:0 18px 50px rgba(31,55,45,.2);font-family:"Microsoft YaHei","Noto Sans TC",system-ui,sans-serif;color:#263c35}
      .b1-access-panel h3{margin:0 0 12px;font-size:1.1rem}.b1-access-row{display:grid;grid-template-columns:1fr auto;gap:10px;padding:10px 0;border-top:1px solid #edf0ed;font-size:.9rem}
      .b1-access-state{font-weight:800}.b1-access-note{font-size:.78rem;color:#78857f;margin-top:10px;line-height:1.45}
      .access-lock{position:absolute;top:13px;right:13px;z-index:3;font-size:.78rem;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.88);border:1px solid #d9e2dc;color:#68776f;font-weight:800}
      .card.access-locked{filter:saturate(.78)}
      @media(max-width:640px){.b1-access-toolbar{right:10px;bottom:10px}.b1-access-panel{right:10px;bottom:54px}}
    `;document.head.appendChild(st);
  }
  function modal({title,text,input=true,confirm='確認',cancel='取消',onConfirm,onCancel}){
    styleOnce();const w=document.createElement('div');w.className='b1-access-modal';
    w.innerHTML=`<div class="b1-access-box" role="dialog" aria-modal="true"><h2>${esc(title)}</h2><p>${esc(text)}</p>${input?'<input type="password" autocomplete="off" aria-label="密碼">':''}<p class="b1-access-msg"></p><div class="b1-access-actions"><button class="b1-access-btn secondary" data-cancel>${esc(cancel)}</button><button class="b1-access-btn" data-ok>${esc(confirm)}</button></div></div>`;
    document.body.appendChild(w);const inp=w.querySelector('input'),msg=w.querySelector('.b1-access-msg'),close=()=>w.remove();
    const cancelAction=()=>{if(onCancel)onCancel();close()};w.querySelector('[data-cancel]').onclick=cancelAction;w.onclick=e=>{if(e.target===w)cancelAction()};
    const go=()=>onConfirm(inp?inp.value:'',msg,close);w.querySelector('[data-ok]').onclick=go;
    if(inp){inp.addEventListener('keydown',e=>{if(e.key==='Enter')go()});setTimeout(()=>inp.focus(),30)}
  }
  function requestStage(stage,onSuccess,onCancel){
    const s=cfg.stages[stage];
    if(isTeacher()||s.status==='public')return onSuccess();
    if(s.status==='locked')return modal({title:'目前尚未開放',text:`${s.label} 目前尚未開放。`,input:false,confirm:'返回',cancel:'取消',onCancel:onCancel,onConfirm:(v,m,c)=>{c();if(onCancel)onCancel();}});
    if(stageUnlocked(stage))return onSuccess();
    modal({title:`解鎖 ${s.label}`,text:'請輸入本階段課程密碼。',onCancel:onCancel,onConfirm:(v,msg,close)=>{
      if(v===s.studentCode){const u=getUnlocked();u[stage]=true;saveUnlocked(u);close();onSuccess()}else msg.textContent='密碼錯誤，請再試一次。';
    }});
  }
  function teacherLogin(){
    modal({title:'教師登入',text:'輸入教師密碼後，可直接開啟全部課程。',onConfirm:(v,msg,close)=>{
      if(v===cfg.teacherCode){localStorage.setItem(TEACHER_KEY,'1');close();location.href=location.pathname}else msg.textContent='教師密碼錯誤。';
    }});
  }
  function teacherPanel(){
    styleOnce();const old=document.querySelector('.b1-access-panel');if(old){old.remove();return}
    const p=document.createElement('div');p.className='b1-access-panel';const names={public:'公開',password:'密碼',locked:'鎖定'};
    p.innerHTML='<h3>課程密碼管理｜測試版</h3>'+Object.entries(cfg.stages).map(([k,s])=>`<div class="b1-access-row"><div><strong>${esc(s.label)}</strong><br><span style="color:#6e7c76">學生密碼：${s.status==='password'?esc(s.studentCode):'—'}</span></div><div class="b1-access-state">${names[s.status]}</div></div>`).join('')+'<div class="b1-access-note">測試版狀態由 access-config.js 集中控制；正式採用後改一個設定檔即可，不必逐課修改。</div>';
    document.body.appendChild(p);
  }
  function toolbar(){
    styleOnce();const bar=document.createElement('div');bar.className='b1-access-toolbar';
    if(isTeacher()){
      bar.innerHTML='<button class="b1-access-chip" data-panel>教師模式</button><button class="b1-access-chip" data-preview>預覽學生</button><button class="b1-access-chip" data-logout>登出</button>';
      bar.querySelector('[data-panel]').onclick=teacherPanel;
      bar.querySelector('[data-preview]').onclick=()=>location.href=location.pathname+'?studentPreview=1';
      bar.querySelector('[data-logout]').onclick=()=>{localStorage.removeItem(TEACHER_KEY);location.reload()};
    }else if(previewStudent){
      bar.innerHTML='<button class="b1-access-chip" data-back>返回教師模式</button>';bar.querySelector('[data-back]').onclick=()=>location.href=location.pathname;
    }else{
      bar.innerHTML='<button class="b1-access-chip" data-login>教師登入</button><button class="b1-access-chip" data-reset>清除測試狀態</button>';
      bar.querySelector('[data-login]').onclick=teacherLogin;
      bar.querySelector('[data-reset]').onclick=()=>{Object.keys(localStorage).filter(k=>k.startsWith('b1_access_')||k.startsWith('b1_teacher_')).forEach(k=>localStorage.removeItem(k));location.replace(location.pathname);};
    }
    document.body.appendChild(bar);
  }
  function setupHome(){
    document.querySelectorAll('a.card[data-stage]').forEach(a=>{
      const stage=a.dataset.stage,s=cfg.stages[stage];if(!s)return;
      const badge=document.createElement('span');badge.className='access-lock';
      if(isTeacher())badge.textContent='教師可用';
      else if(s.status==='public')badge.textContent='公開';
      else if(s.status==='locked'){badge.textContent='🔒 尚未開放';a.classList.add('access-locked')}
      else if(stageUnlocked(stage))badge.textContent='已解鎖';
      else{badge.textContent='🔒 需密碼';a.classList.add('access-locked')}
      a.appendChild(badge);a.addEventListener('click',e=>{e.preventDefault();const href=a.href;requestStage(stage,()=>location.href=href)});
    });toolbar();
  }
  window.B1Access={setupHome,teacherLogin,requestStage,stageUnlocked,isTeacher};
})();