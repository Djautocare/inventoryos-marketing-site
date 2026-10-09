const SITE_CONFIG = Object.freeze({
    signupUrl:
        "https://app.inventoryos.co.uk/register.html",

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
 const reseller=document.getElementById('resellerAudience'),manufacturer=document.getElementById('manufacturingAudience');
 function choose(value,{updateUrl=true}={}){const manufacturing=value==='manufacturing';reseller.hidden=manufacturing;manufacturer.hidden=!manufacturing;buttons.forEach(b=>{const selected=b.dataset.audience===(manufacturing?'manufacturing':'resellers');b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});document.getElementById('manufacturingPricingNote').hidden=!manufacturing;document.querySelectorAll('a[href="#features"],a[href="#mfg-features"],a[href="#workflow"],a[href="#mfg-workflow"],a[href="#what-it-does"],a[href="#mfg-overview"]').forEach(a=>{const map={'#features':'#mfg-features','#workflow':'#mfg-workflow','#what-it-does':'#mfg-overview'};const reverse=Object.fromEntries(Object.entries(map).map(([k,v])=>[v,k]));a.setAttribute('href',manufacturing?(map[a.getAttribute('href')]||a.getAttribute('href')):(reverse[a.getAttribute('href')]||a.getAttribute('href')));});if(updateUrl){const url=new URL(location.href);url.searchParams.set('audience',manufacturing?'manufacturing':'resellers');url.hash='';history.replaceState(null,'',url);}}
 buttons.forEach((b,index)=>{b.addEventListener('click',()=>choose(b.dataset.audience));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;choose(buttons[next].dataset.audience);buttons[next].focus();});});choose(new URL(location.href).searchParams.get('audience')==='manufacturing'?'manufacturing':'resellers',{updateUrl:false});
})();
