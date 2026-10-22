const SITE_CONFIG = Object.freeze({
    signupUrl:
        "https://app.inventoryos.co.uk/login.html?view=register",

    loginUrl:
        "https://app.inventoryos.co.uk/login.html"
});

const VALID_PLANS = new Set([
    "free",
    "starter",
    "pro",
    "business"
]);

function normalisePlan(plan){
    const clean = String(plan || "")
        .trim()
        .toLowerCase();

    return VALID_PLANS.has(clean)
        ? clean
        : "";
}

function withPlan(url, plan){
    const cleanPlan = normalisePlan(plan);

    if(!cleanPlan){
        return url;
    }

    const builtUrl = new URL(url);

    builtUrl.searchParams.set(
        "plan",
        cleanPlan
    );

    builtUrl.searchParams.set(
        "source",
        "inventoryos-pricing"
    );

    return builtUrl.toString();
}

function setConfiguredLinks(){
    document
        .querySelectorAll(
            "[data-signup-link]"
        )
        .forEach(
            function(link){
                const plan =
                    normalisePlan(
                        link.dataset.plan
                    );

                link.href = withPlan(
                    SITE_CONFIG.signupUrl,
                    plan
                );
            }
        );

    document
        .querySelectorAll(
            "[data-login-link]"
        )
        .forEach(
            function(link){
                const plan =
                    normalisePlan(
                        link.dataset.plan
                    );

                link.href = withPlan(
                    SITE_CONFIG.loginUrl,
                    plan
                );
            }
        );
}

function setupHeader(){
    const header =
        document.querySelector(
            ".site-header"
        );

    if(!header){
        return;
    }

    function updateHeader(){
        header.classList.toggle(
            "scrolled",
            window.scrollY > 12
        );
    }

    updateHeader();

    window.addEventListener(
        "scroll",
        updateHeader,
        {
            passive:true
        }
    );
}

function setupMobileMenu(){
    const button =
        document.getElementById(
            "menuButton"
        );

    const menu =
        document.getElementById(
            "mobileMenu"
        );

    if(
        !button ||
        !menu
    ){
        return;
    }

    function closeMenu(){
        menu.hidden = true;

        button.setAttribute(
            "aria-expanded",
            "false"
        );

        button.setAttribute(
            "aria-label",
            "Open menu"
        );

        document.body.classList.remove(
            "menu-open"
        );
    }

    function openMenu(){
        menu.hidden = false;

        button.setAttribute(
            "aria-expanded",
            "true"
        );

        button.setAttribute(
            "aria-label",
            "Close menu"
        );

        document.body.classList.add(
            "menu-open"
        );
    }

    button.addEventListener(
        "click",
        function(){
            if(menu.hidden){
                openMenu();
            }else{
                closeMenu();
            }
        }
    );

    menu
        .querySelectorAll("a")
        .forEach(
            function(link){
                link.addEventListener(
                    "click",
                    closeMenu
                );
            }
        );

    window.addEventListener(
        "resize",
        function(){
            if(
                window.innerWidth >
                820
            ){
                closeMenu();
            }
        }
    );
}

function setupRevealAnimations(){
    const elements =
        document.querySelectorAll(
            ".reveal"
        );

    if(
        !("IntersectionObserver" in window)
    ){
        elements.forEach(
            function(element){
                element.classList.add(
                    "visible"
                );
            }
        );

        return;
    }

    const observer =
        new IntersectionObserver(
            function(entries){
                entries.forEach(
                    function(entry){
                        if(!entry.isIntersecting){
                            return;
                        }

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    }
                );
            },
            {
                threshold:0.12,
                rootMargin:"0px 0px -35px 0px"
            }
        );

    elements.forEach(
        function(element){
            observer.observe(element);
        }
    );
}

function setupWorkflow(){
    const buttons =
        document.querySelectorAll(
            "[data-workflow-step]"
        );

    const screens =
        document.querySelectorAll(
            "[data-workflow-screen]"
        );

    if(
        !buttons.length ||
        !screens.length
    ){
        return;
    }

    function showStep(step){
        buttons.forEach(
            function(button){
                button.classList.toggle(
                    "active",
                    button.dataset.workflowStep === step
                );
            }
        );

        screens.forEach(
            function(screen){
                screen.classList.toggle(
                    "active",
                    screen.dataset.workflowScreen === step
                );
            }
        );
    }

    buttons.forEach(
        function(button){
            button.addEventListener(
                "click",
                function(){
                    showStep(
                        button.dataset.workflowStep
                    );
                }
            );
        }
    );
}

function setupFaq(){
    const items =
        document.querySelectorAll(
            ".faq-item"
        );

    items.forEach(
        function(item){
            const button =
                item.querySelector(
                    "button"
                );

            if(!button){
                return;
            }

            button.addEventListener(
                "click",
                function(){
                    const willOpen =
                        !item.classList.contains(
                            "open"
                        );

                    items.forEach(
                        function(otherItem){
                            otherItem.classList.remove(
                                "open"
                            );

                            const otherButton =
                                otherItem.querySelector(
                                    "button"
                                );

                            if(otherButton){
                                otherButton.setAttribute(
                                    "aria-expanded",
                                    "false"
                                );
                            }
                        }
                    );

                    if(willOpen){
                        item.classList.add(
                            "open"
                        );

                        button.setAttribute(
                            "aria-expanded",
                            "true"
                        );
                    }
                }
            );
        }
    );
}

function setCurrentYear(){
    const year =
        document.getElementById(
            "currentYear"
        );

    if(year){
        year.textContent =
            new Date().getFullYear();
    }
}

document.addEventListener(
    "DOMContentLoaded",
    function(){
        setConfiguredLinks();
        setupHeader();
        setupMobileMenu();
        setupRevealAnimations();
        setupWorkflow();
        setupFaq();
        setCurrentYear();
    }
);


(function initialiseAudienceChoice(){
 const buttons=[...document.querySelectorAll('[data-audience]')];if(!buttons.length)return;
 const panels={resellers:document.getElementById('resellerAudience'),manufacturing:document.getElementById('manufacturingAudience'),retail:document.getElementById('retailAudience')};
 const routes={features:{resellers:'#features',manufacturing:'#mfg-features',retail:'#retail-features'},workflow:{resellers:'#workflow',manufacturing:'#mfg-workflow',retail:'#retail-workflow'},overview:{resellers:'#what-it-does',manufacturing:'#mfg-overview',retail:'#retail-overview'},faq:{resellers:'#faq',manufacturing:'#faq',retail:'#retail-faq'},pricing:{resellers:'#pricing',manufacturing:'#pricing',retail:'#retail-pricing'},printing:{resellers:'#printing',manufacturing:'#printing',retail:'#retail-features'}};
 const names={resellers:'Reseller',manufacturing:'Manufacturing',retail:'Retail'},pages={resellers:'index.html',manufacturing:'manufacturing.html',retail:'retail.html'};
 let selected='resellers';
 document.querySelectorAll('.header a[href^="index.html#"]').forEach(a=>{a.dataset.overviewSection=a.hash.slice(1);});
 function scrollToGuideHash(){
  if(!location.hash)return;
  const id=decodeURIComponent(location.hash.slice(1));
  requestAnimationFrame(()=>{const target=document.getElementById(id);if(target&&!target.closest('[hidden]'))target.scrollIntoView({block:'start',behavior:'instant'});});
 }
 function choose(value,{updateUrl=true}={}){
  const current=Object.hasOwn(panels,value)?value:'resellers';selected=current;
  for(const [key,panel]of Object.entries(panels))panel.hidden=key!==current;
  buttons.forEach(b=>{const active=b.dataset.audience===current;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
  document.getElementById('manufacturingPricingNote').hidden=current!=='manufacturing';document.getElementById('pricing').hidden=current==='retail';document.getElementById('faq').hidden=current==='retail';document.querySelector('.printing-section').hidden=current==='retail';document.querySelector('main .final-cta').hidden=current!=='resellers';
  document.querySelectorAll('[data-overview-section]').forEach(a=>a.href=pages[current]+'#'+a.dataset.overviewSection);
  const signup=document.querySelector('.header .button');if(signup){signup.firstChild.textContent=current==='resellers'?'Start free':'Get started';signup.href=current==='retail'?'https://app.inventoryos.co.uk/login.html?view=register&returnTo=%2Fretail%2Fdashboard%2Findex.html':'https://app.inventoryos.co.uk/login.html?view=register&plan='+(current==='manufacturing'?'business':'free');}
  const login=document.querySelector('.header .nav-login');if(login)login.href='https://app.inventoryos.co.uk/login.html'+(current==='retail'?'?returnTo=%2Fretail%2Fdashboard%2Findex.html':'');
  document.querySelectorAll('[data-guide-section]').forEach(a=>{const key=a.dataset.guideSection;a.href=routes[key][current];a.hidden=key==='printing'&&current==='retail';});
  const title=document.querySelector('[data-guide-title]');if(title)title.textContent=names[current]+' feature guide';
  const back=document.querySelector('[data-guide-back]');if(back){back.href=pages[current];back.textContent='← Back to the '+names[current].toLowerCase()+' overview';}
  if(updateUrl){const url=new URL(location.href);url.searchParams.set('audience',current);url.hash='';history.replaceState(null,'',url);}
 }
 function audienceFromHash(){const hash=location.hash.slice(1);return hash.startsWith('mfg-')||hash==='recipe-planning'?'manufacturing':hash.startsWith('retail-')?'retail':null;}
 buttons.forEach((b,index)=>{b.addEventListener('click',()=>choose(b.dataset.audience));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;choose(buttons[next].dataset.audience);buttons[next].focus();});});
 const urlMode=new URL(location.href).searchParams.get('audience');choose(audienceFromHash()||urlMode,{updateUrl:false});
 if(document.readyState==='complete')scrollToGuideHash();else window.addEventListener('load',scrollToGuideHash,{once:true});
 window.addEventListener('hashchange',()=>{const mode=audienceFromHash();if(mode&&mode!==selected)choose(mode,{updateUrl:false});scrollToGuideHash();});
})();
