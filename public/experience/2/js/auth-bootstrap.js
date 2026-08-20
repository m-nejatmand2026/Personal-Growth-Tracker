const html=document.documentElement;
const app=document.querySelector('#experience2App');
const RETURN_URL=`${location.origin}/experience/2/`;

async function request(path,{method='GET',body}={}){
  const response=await fetch(path,{method,credentials:'same-origin',headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
  const text=await response.text();
  let data=null;
  if(text){try{data=JSON.parse(text)}catch{data={message:text}}}
  if(!response.ok){const error=new Error(data?.message||data?.error||`Request failed (${response.status})`);error.status=response.status;error.data=data;throw error}
  return data;
}

function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function initials(value='GC'){return String(value||'GC').trim().split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase()||'GC';}

function removeGate(){document.querySelector('#e2AuthHost')?.remove();html.classList.remove('auth-checking','auth-gated');}

async function launchApp(account=null){
  await import('/experience/2/js/app.js');
  if(account) {
    const { installAccountUi }=await import('/experience/2/js/account-ui.js');
    await installAccountUi(account);
  }
  removeGate();
}

function mountGate(content){
  html.classList.remove('auth-checking');
  html.classList.add('auth-gated');
  let host=document.querySelector('#e2AuthHost');
  if(!host){host=document.createElement('div');host.id='e2AuthHost';host.className='auth-host';document.body.append(host)}
  host.innerHTML=content;
  return host;
}

function setMessage(host,message,{error=false,success=false}={}){
  const node=host.querySelector('#authMessage');if(!node)return;
  node.textContent=message||'';node.classList.toggle('is-error',error);node.classList.toggle('is-success',success);
}

function setBusy(host,busy){host.querySelectorAll('button,input').forEach(node=>{node.disabled=Boolean(busy)});}

function renderConfigurationProblem(){
  mountGate(`<section class="auth-config-card static-surface" role="alert"><p class="eyebrow">Growth Compass accounts</p><h1>Sign-in is being configured</h1><p>The account boundary is enabled, but the required server credentials are not complete yet. No private workspace data is available until configuration is finished.</p></section>`);
}

function resetPasswordScreen(status,token){
  const host=mountGate(`<section class="auth-shell"><div class="auth-intro"><div class="auth-brand"><span class="auth-brand-mark">◇</span><span>Growth Compass</span></div><div class="auth-intro-copy"><h1>Choose a new password.</h1><p>Your private workspace stays exactly where you left it.</p></div><div class="auth-private-note"><span class="auth-private-dot"></span><span>Private workspace · secure account session</span></div></div><div class="auth-card"><div class="auth-card-head"><h2>Reset password</h2><p>Use at least 10 characters.</p></div><form class="auth-form" id="authResetForm"><label>New password<input id="authResetPassword" type="password" minlength="10" maxlength="128" autocomplete="new-password" required></label><label>Confirm password<input id="authResetConfirm" type="password" minlength="10" maxlength="128" autocomplete="new-password" required></label><button type="submit" class="primary-button auth-submit">Save new password</button></form><p class="auth-message" id="authMessage" aria-live="polite"></p><button type="button" class="auth-link-button" id="authBackToSignIn">Back to sign in</button></div></section>`);
  host.querySelector('#authBackToSignIn')?.addEventListener('click',()=>{history.replaceState(null,'','/experience/2/');renderSignIn(status)});
  host.querySelector('#authResetForm')?.addEventListener('submit',async event=>{event.preventDefault();const password=host.querySelector('#authResetPassword').value;const confirm=host.querySelector('#authResetConfirm').value;if(password!==confirm)return setMessage(host,'Passwords do not match.',{error:true});try{setBusy(host,true);await request('/api/auth/reset-password',{method:'POST',body:{newPassword:password,token}});setMessage(host,'Password updated. You can sign in now.',{success:true});history.replaceState(null,'','/experience/2/');setTimeout(()=>renderSignIn(status),700)}catch(error){setMessage(host,error.message,{error:true})}finally{setBusy(host,false)}});
}

function renderSignIn(status){
  const providers=status.providers||{};
  const providerButtons=`${providers.google?'<button type="button" class="auth-provider-button" data-auth-social="google"><span class="auth-provider-icon">G</span><span>Continue with Google</span></button>':''}${providers.apple?'<button type="button" class="auth-provider-button" data-auth-social="apple"><span class="auth-provider-icon">●</span><span>Continue with Apple</span></button>':''}`;
  const emailBlock=providers.email?`<div class="auth-divider"><span>or use email</span></div><div class="auth-tabs" role="tablist" aria-label="Email account"><button type="button" class="auth-tab active" role="tab" aria-selected="true" data-auth-mode="signin">Sign in</button><button type="button" class="auth-tab" role="tab" aria-selected="false" data-auth-mode="signup">Create account</button></div><form class="auth-form" id="authEmailForm"><label id="authNameLabel" hidden>Name<input id="authName" maxlength="120" autocomplete="name"></label><label>Email<input id="authEmail" type="email" maxlength="254" autocomplete="email" required></label><label>Password<input id="authPassword" type="password" minlength="10" maxlength="128" autocomplete="current-password" required></label><div class="auth-form-meta"><span></span>${providers.email_verification?'<button type="button" class="auth-link-button" id="authForgot">Forgot password?</button>':''}</div><button type="submit" class="primary-button auth-submit" id="authEmailSubmit">Sign in</button></form>`:'';
  const host=mountGate(`<section class="auth-shell"><div class="auth-intro"><div class="auth-brand"><span class="auth-brand-mark">◇</span><span>Growth Compass</span></div><div class="auth-intro-copy"><h1>Your space.<br>Your direction.</h1><p>One Growth Compass, with a separate private workspace for every person invited to test it.</p></div><div class="auth-private-note"><span class="auth-private-dot"></span><span>Your Goals, Journal and Progress stay private to your account</span></div></div><div class="auth-card"><div class="auth-card-head"><h2>Welcome</h2><p>Sign in to your private Growth Compass workspace.</p></div><div class="auth-provider-stack">${providerButtons}</div>${emailBlock}<p class="auth-message" id="authMessage" aria-live="polite"></p><p class="auth-invite-note">This preview is invite-only. Use the same email address that received your invitation.</p></div></section>`);

  let mode='signin';
  const syncMode=next=>{mode=next;host.querySelectorAll('[data-auth-mode]').forEach(button=>{const active=button.dataset.authMode===mode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});const nameLabel=host.querySelector('#authNameLabel');if(nameLabel)nameLabel.hidden=mode!=='signup';const password=host.querySelector('#authPassword');if(password)password.autocomplete=mode==='signup'?'new-password':'current-password';const submit=host.querySelector('#authEmailSubmit');if(submit)submit.textContent=mode==='signup'?'Create private workspace':'Sign in';setMessage(host,'')};
  host.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>syncMode(button.dataset.authMode)));

  host.querySelectorAll('[data-auth-social]').forEach(button=>button.addEventListener('click',async()=>{try{setBusy(host,true);setMessage(host,`Opening ${button.dataset.authSocial==='google'?'Google':'Apple'}…`);const result=await request('/api/auth/sign-in/social',{method:'POST',body:{provider:button.dataset.authSocial,callbackURL:RETURN_URL,errorCallbackURL:RETURN_URL,disableRedirect:true}});if(!result?.url)throw new Error('Could not start sign-in.');location.assign(result.url)}catch(error){setMessage(host,error.message,{error:true});setBusy(host,false)}}));

  host.querySelector('#authEmailForm')?.addEventListener('submit',async event=>{event.preventDefault();const email=host.querySelector('#authEmail').value.trim();const password=host.querySelector('#authPassword').value;try{setBusy(host,true);setMessage(host,mode==='signup'?'Creating your private workspace…':'Signing in…');if(mode==='signup'){const name=host.querySelector('#authName').value.trim();if(!name)throw new Error('Add your name.');await request('/api/auth/sign-up/email',{method:'POST',body:{name,email,password,callbackURL:RETURN_URL}});if(providers.email_verification){setMessage(host,'Check your email to verify your account, then return here to sign in.',{success:true});return}}else{await request('/api/auth/sign-in/email',{method:'POST',body:{email,password,rememberMe:true,callbackURL:RETURN_URL}})}const session=await request('/api/auth/get-session');if(session?.user){const account=await request('/api/account/me');await launchApp(account);return}setMessage(host,providers.email_verification?'Check your email to verify your account.':'Sign-in did not create a session.',{success:providers.email_verification,error:!providers.email_verification})}catch(error){setMessage(host,error.message,{error:true})}finally{setBusy(host,false)}});

  host.querySelector('#authForgot')?.addEventListener('click',async()=>{const email=host.querySelector('#authEmail')?.value.trim();if(!email)return setMessage(host,'Enter your email first.',{error:true});try{setBusy(host,true);await request('/api/auth/request-password-reset',{method:'POST',body:{email,redirectTo:`${RETURN_URL}?reset=1`}});setMessage(host,'If that account exists, a password reset link is on its way.',{success:true})}catch(error){setMessage(host,error.message,{error:true})}finally{setBusy(host,false)}});
}

async function boot(){
  try{
    const status=await request('/api/account/status');
    if(status.mode!=='enforced'){await launchApp();return}
    if(!status.configured){renderConfigurationProblem();return}
    const params=new URLSearchParams(location.search);const token=params.get('token');if(token&&params.get('reset')==='1'){resetPasswordScreen(status,token);return}
    const session=await request('/api/auth/get-session');
    if(session?.user){const account=await request('/api/account/me');await launchApp(account);return}
    renderSignIn(status);
  }catch(error){
    const host=mountGate(`<section class="auth-config-card static-surface" role="alert"><p class="eyebrow">Growth Compass</p><h1>Could not check your account</h1><p id="authBootError"></p><button type="button" class="primary-button" id="authRetry">Retry</button></section>`);host.querySelector('#authBootError').textContent=error.message;host.querySelector('#authRetry')?.addEventListener('click',()=>{html.classList.add('auth-checking');host.remove();void boot()});
  }
}

void boot();
