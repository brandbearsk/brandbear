(function () {
        var defaultLanguage = 'sk';
        var availableLanguages = ['sk', 'en'];
        var storageKey = 'brandbear_language';
        var jsonBasePath = 'assets/json/';
        var currentLanguage = defaultLanguage;

        function hasLanguage(language) {
            return availableLanguages.indexOf(language) !== -1;
        }

        function getSavedLanguage() {
            var savedLanguage = localStorage.getItem(storageKey);
            return hasLanguage(savedLanguage) ? savedLanguage : defaultLanguage;
        }

        function getValue(translations, key) {
            return key.split('.').reduce(function (value, part) {
                return value && Object.prototype.hasOwnProperty.call(value, part) ? value[part] : null;
            }, translations);
        }

        function loadTranslations(language) {
            var request = new XMLHttpRequest();
            request.open('GET', jsonBasePath + language + '.json', false);
            request.overrideMimeType('application/json');
            request.send(null);

            if ((request.status >= 200 && request.status < 300 || request.status === 0) && request.responseText) {
                return JSON.parse(request.responseText);
            }

            return null;
        }

        function setTranslatedAttribute(translations, attributeName, dataAttributeName) {
            document.querySelectorAll('[' + dataAttributeName + ']').forEach(function (element) {
                var value = getValue(translations, element.getAttribute(dataAttributeName));

                if (value !== null && value !== undefined) {
                    element.setAttribute(attributeName, value);
                }
            });
        }

        function applyTranslations(translations, language) {
            if (!translations) {
                return;
            }

            currentLanguage = language;
            document.documentElement.setAttribute('lang', language);

            document.querySelectorAll('[data-i18n]').forEach(function (element) {
                var value = getValue(translations, element.getAttribute('data-i18n'));

                if (value !== null && value !== undefined) {
                    element.textContent = value;
                }
            });

            document.querySelectorAll('[data-i18n-html]').forEach(function (element) {
                var value = getValue(translations, element.getAttribute('data-i18n-html'));

                if (value !== null && value !== undefined) {
                    element.innerHTML = value;
                }
            });

            setTranslatedAttribute(translations, 'placeholder', 'data-i18n-placeholder');
            setTranslatedAttribute(translations, 'title', 'data-i18n-title');
            setTranslatedAttribute(translations, 'alt', 'data-i18n-alt');
            setTranslatedAttribute(translations, 'content', 'data-i18n-content');
            setTranslatedAttribute(translations, 'aria-label', 'data-i18n-aria-label');

            document.querySelectorAll('[data-bb-language-current]').forEach(function (element) {
                element.textContent = language.toUpperCase();
            });

            document.querySelectorAll('[data-bb-set-language]').forEach(function (element) {
                var optionLanguage = element.getAttribute('data-bb-set-language');
                element.textContent = optionLanguage.toUpperCase();
                element.classList.toggle('is-active', optionLanguage === language);
            });
        }

        function setLanguage(language) {
            if (!hasLanguage(language)) {
                language = defaultLanguage;
            }

            localStorage.setItem(storageKey, language);
            applyTranslations(loadTranslations(language), language);
        }

        window.BrandBearI18n = {
            setLanguage: setLanguage,
            getLanguage: function () {
                return currentLanguage;
            }
        };

        setLanguage(getSavedLanguage());

        document.addEventListener('DOMContentLoaded', function () {
            var switcher = document.querySelector('[data-bb-language-switcher]');
            var toggle = document.querySelector('[data-bb-language-toggle]');

            if (!switcher || !toggle) {
                return;
            }

            toggle.addEventListener('click', function (event) {
                event.preventDefault();
                switcher.classList.toggle('is-open');
            });

            document.querySelectorAll('[data-bb-set-language]').forEach(function (button) {
                button.addEventListener('click', function (event) {
                    event.preventDefault();

                    var selectedLanguage = button.getAttribute('data-bb-set-language');

                    if (selectedLanguage !== currentLanguage) {
                        setLanguage(selectedLanguage);
                    }

                    switcher.classList.remove('is-open');
                });
            });

            document.addEventListener('click', function (event) {
                if (!switcher.contains(event.target)) {
                    switcher.classList.remove('is-open');
                }
            });
        });
    })();

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

document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("bb-contact-form");

    if (!form) {
        return;
    }

    var endpoint = "https://uhwcwvzacknidptbclgg.supabase.co/functions/v1/contact-form";
    var successBox = form.querySelector(".nk-form-response-success");
    var errorBox = form.querySelector(".nk-form-response-error");
    var submitButton = form.querySelector("button[type='submit'], button:not([type])");

    var companyName = document.getElementById("bb-company-name");
    var companyIco = document.getElementById("bb-company-ico");
    var companyCombined = document.getElementById("bb-company-combined");

    var imageInput = document.getElementById("bb-images");
    var fileList = document.getElementById("bb-file-list");

    var maxFiles = 5;
    var maxFileSize = 5 * 1024 * 1024;
    var allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

    function setMessage(type, message) {
        if (successBox) {
            successBox.textContent = type === "success" ? message : "";
        }

        if (errorBox) {
            errorBox.textContent = type === "error" ? message : "";
        }
    }

    function getValue(name) {
        var field = form.querySelector("[name='" + name + "']");
        return field ? field.value.trim() : "";
    }

    function updateCompanyValue() {
        if (!companyCombined) {
            return;
        }

        var name = companyName ? companyName.value.trim() : "";
        var ico = companyIco ? companyIco.value.trim() : "";

        companyCombined.value = [name, ico].filter(Boolean).join(" / ");
    }

    function updateFileList() {
        if (!imageInput || !fileList) {
            return;
        }

        var files = Array.prototype.slice.call(imageInput.files || []);

        if (!files.length) {
            fileList.innerHTML = "";
            return;
        }

        fileList.innerHTML = files.map(function (file) {
            return "<div>• " + file.name + "</div>";
        }).join("");
    }

    function validateImages() {
        if (!imageInput) {
            return true;
        }

        var files = Array.prototype.slice.call(imageInput.files || []);

        if (files.length > maxFiles) {
            setMessage("error", "Môžete priložiť maximálne 5 obrázkov.");
            return false;
        }

        for (var i = 0; i < files.length; i++) {
            if (allowedImageTypes.indexOf(files[i].type) === -1) {
                setMessage("error", "Povolené sú iba obrázky JPG, PNG alebo WEBP.");
                return false;
            }

            if (files[i].size > maxFileSize) {
                setMessage("error", "Jeden obrázok môže mať maximálne 5 MB.");
                return false;
            }
        }

        return true;
    }

    if (companyName) {
        companyName.addEventListener("input", updateCompanyValue);
    }

    if (companyIco) {
        companyIco.addEventListener("input", updateCompanyValue);
    }

    if (imageInput) {
        imageInput.addEventListener("change", updateFileList);
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        setMessage("", "");
        updateCompanyValue();

        var name = getValue("name");
        var email = getValue("email");
        var company = getValue("company");
        var phone = getValue("phone");
        var selectedPackage = getValue("package");
        var message = getValue("message");

        if (!name || !email || !selectedPackage || !message) {
            setMessage("error", "Prosím, vyplňte všetky povinné polia.");
            return;
        }

        if (!validateImages()) {
            return;
        }

        var formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("company", company);
        formData.append("phone", phone);
        formData.append("package", selectedPackage);
        formData.append("message", message);
        formData.append("page_url", window.location.href);

        if (imageInput && imageInput.files && imageInput.files.length) {
            Array.prototype.forEach.call(imageInput.files, function (file) {
                formData.append("images", file, file.name);
            });
        }

        if (submitButton) {
            submitButton.disabled = true;
        }

        fetch(endpoint, {
            method: "POST",
            body: formData
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Form submission failed");
                }

                return response.json();
            })
            .then(function () {
                form.reset();

                if (fileList) {
                    fileList.innerHTML = "";
                }

                if (companyCombined) {
                    companyCombined.value = "";
                }

                setMessage("success", "Ďakujeme, správa bola úspešne odoslaná.");
            })
            .catch(function () {
                setMessage("error", "Správu sa nepodarilo odoslať. Skúste to prosím znova.");
            })
            .finally(function () {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            });
    });
});

(function () {
    const themeToggle = document.getElementById("bb-theme-toggle");

    if (!themeToggle) {
        return;
    }

    const themeIcon = themeToggle.querySelector(".bb-theme-icon");
    const savedTheme = localStorage.getItem("bb-theme");

    const preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";

    const currentTheme = savedTheme || preferredTheme;

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("bb-theme", theme);

        if (theme === "light") {
            themeToggle.setAttribute("aria-label", "Prepnúť tmavý režim");
        } else {
            themeToggle.setAttribute("aria-label", "Prepnúť svetlý režim");
        }
    }

    applyTheme(currentTheme);

    themeToggle.addEventListener("click", function () {
        const activeTheme = document.documentElement.getAttribute("data-theme");
        const nextTheme = activeTheme === "light" ? "dark" : "light";

        applyTheme(nextTheme);
    });
})();