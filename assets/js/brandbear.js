(function () {
    'use strict';

    /*
     * BrandBear Godlike setup
     * Tu nastavujeme Godlike šablónu pre BrandBear web.
     */
    function initGodlike() {
        if (typeof window.Godlike === 'undefined') {
            return;
        }

        window.Godlike.setOptions({
            enableCookieAlert: false,
            enableShortcuts: false,
            enableFadeBetweenPages: true,
            enableMouseParallax: true,
            scrollToAnchorSpeed: 700,
            parallaxSpeed: 0.6
        });

        window.Godlike.init();
    }

    /*
     * BrandBear one-page anchor navigation
     * Rieši kliky na odkazy typu #kontakt, #portfolio, #home...
     */
    function initAnchorNavigation() {
        document.addEventListener('click', function (event) {
            var link = event.target.closest('a[href^="#"]');

            if (!link) {
                return;
            }

            var hash = link.getAttribute('href');

            if (!hash || hash === '#') {
                return;
            }

            var target;

            try {
                target = document.querySelector(hash);
            } catch (error) {
                return;
            }

            if (!target) {
                return;
            }

            if (link.classList.contains('bb-package-btn')) {
                var selectedPackage = link.getAttribute('data-package');
                var packageSelect = document.getElementById('bb-package-select');

                if (packageSelect && selectedPackage) {
                    packageSelect.value = selectedPackage;
                    packageSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            event.preventDefault();
            event.stopPropagation();

            if (event.stopImmediatePropagation) {
                event.stopImmediatePropagation();
            }

            /*
             * Zavrie mobilné / bočné menu, ak je otvorené.
             */
            if (typeof window.Godlike !== 'undefined' && typeof window.jQuery !== 'undefined') {
                if (typeof window.Godlike.closeSide === 'function') {
                    window.Godlike.closeSide(window.jQuery('.nk-navbar-left-side, .nk-navbar-right-side'));
                }

                if (typeof window.Godlike.closeFullscreenNavbar === 'function') {
                    window.Godlike.closeFullscreenNavbar();
                }
            }

            var navbar = document.querySelector('.nk-navbar-top');
            var offset = navbar ? navbar.offsetHeight + 20 : 0;
            var targetTop = target.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
                top: targetTop,
                behavior: 'smooth'
            });

            history.pushState(null, '', hash);
        }, true);
    }

    /*
     * BrandBear scroll top button
     * Funguje len vtedy, ak niekde na stránke bude element s triedou .bb-scroll-top.
     */
    function initScrollTopButton() {
        document.addEventListener('click', function (event) {
            var scrollTopButton = event.target.closest('.bb-scroll-top');

            if (!scrollTopButton) {
                return;
            }

            event.preventDefault();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            history.pushState(null, '', '#home');
        });
    }

    function initPackageSelection() {
        var packageSelect = document.getElementById('bb-package-select');
        var packageButtons = document.querySelectorAll('.bb-package-btn');

        function setActivePackage(selectedPackage) {
            packageButtons.forEach(function (button) {
                var buttonPackage = button.getAttribute('data-package');
                var pricingCard = button.closest('.nk-pricing');

                if (buttonPackage === selectedPackage) {
                    button.classList.add('bb-package-btn-active');

                    if (pricingCard) {
                        pricingCard.classList.add('bb-package-card-active');
                    }
                } else {
                    button.classList.remove('bb-package-btn-active');

                    if (pricingCard) {
                        pricingCard.classList.remove('bb-package-card-active');
                    }
                }
            });
        }

        packageButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                var selectedPackage = button.getAttribute('data-package');

                if (packageSelect && selectedPackage) {
                    packageSelect.value = selectedPackage;
                    packageSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }

                setActivePackage(selectedPackage);
            });
        });

        if (packageSelect) {
            packageSelect.addEventListener('change', function () {
                setActivePackage(packageSelect.value);
            });

            setActivePackage(packageSelect.value);
        }
    }

    initGodlike();
    initPackageSelection();
    initAnchorNavigation();
    initScrollTopButton();

}());