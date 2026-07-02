const SITE_CONFIG = Object.freeze({
    signupUrl:
        "https://app.inventoryos.co.uk/register.html",

    loginUrl:
        "https://app.inventoryos.co.uk/login.html"
});

function setConfiguredLinks(){
    document
        .querySelectorAll(
            "[data-signup-link]"
        )
        .forEach(
            function(link){
                link.href =
                    SITE_CONFIG.signupUrl;
            }
        );

    document
        .querySelectorAll(
            "[data-login-link]"
        )
        .forEach(
            function(link){
                link.href =
                    SITE_CONFIG.loginUrl;
            }
        );
}

function setupHeader(){
    const header =
        document.querySelector(
            ".site-header"
        );

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
