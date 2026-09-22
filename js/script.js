/* ============================================================
   MIKIN SOLAR DESIGN - script.js
   Vanilla JavaScript - all site interactions.
   ============================================================ */

"use strict";

const API_URL = "https://solar-backend.mikinvp4.workers.dev"; // <--- PASTE YOUR WORKER URL HERE

async function saveToCloudflare(payload) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    
    let data;
    try { 
        data = await res.json(); 
    } catch(e) { 
        data = {}; 
    }
    
    if (!res.ok || !data.ok) {
        throw new Error(data.error || "Server connection failed");
    }
    return data;
}

function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = String(str == null ? "" : str);
    return div.innerHTML;
}

function isValidEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}
// CHANGED: Indian mobile validation (optional +91, 10 digits starting 6-9)
function isValidPhone(str) {
    var s = String(str).replace(/[\s-]/g, "").replace(/^(\+91|0)/, "");
    return /^[6-9]\d{9}$/.test(s);
}

const approvedReviews = [];

window.addEventListener("load", function () {
    var loader = document.getElementById("page-loader");
    if (loader) {
        setTimeout(function () {
            loader.classList.add("hidden");
        }, 400);
    }
});

function initLibraries() {
    if (typeof AOS !== "undefined") {
        AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 80 });
    }
    if (typeof GLightbox !== "undefined") {
        GLightbox({ selector: ".glightbox", touchNavigation: true, loop: true, descPosition: "bottom", closeButton: true });
    }
    var reviewsSwiperEl = document.querySelector(".reviews-swiper");
    if (typeof Swiper !== "undefined" && reviewsSwiperEl && !reviewsSwiperEl.classList.contains("reviews-empty")) {
        new Swiper(".reviews-swiper", {
            slidesPerView: 1, spaceBetween: 28, loop: true, grabCursor: true,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: ".reviews-swiper .swiper-pagination", clickable: true },
            navigation: { nextEl: ".reviews-swiper .swiper-button-next", prevEl: ".reviews-swiper .swiper-button-prev" },
            breakpoints: { 640: { slidesPerView: 1 }, 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } }
        });
    }
}

function renderReviews() {
    var wrapper = document.getElementById("reviews-wrapper");
    if (!wrapper) return;

    if (approvedReviews.length === 0) {
        var swiperEl = document.querySelector(".reviews-swiper");
        if (swiperEl) swiperEl.classList.add("reviews-empty");
        if (!document.querySelector(".reviews-empty-note")) {
            var note = document.createElement("div");
            note.className = "reviews-empty-note";
            note.setAttribute("role", "status");
            note.innerHTML = '<i class="fa-solid fa-star-half-stroke"></i><p>No published reviews yet. Had a project delivered?<br>I\'d love to hear about it — leave a review using the form below.</p>';
            wrapper.parentNode.appendChild(note);
        }
        return;
    }

    wrapper.innerHTML = approvedReviews.map(function (r) {
        var stars = "";
        for (var i = 1; i <= 5; i++) { stars += i <= r.rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'; }
        var initials = r.name.trim().split(/\s+/).map(function (w) { return w.charAt(0).toUpperCase(); }).join("").slice(0, 2);
        return (
            '<div class="swiper-slide"><div class="review-card">' +
            '<div class="review-stars">' + stars + '</div>' +
            '<p class="review-text"><i class="fa-solid fa-quote-left"></i>' + escapeHtml(r.review) + '</p>' +
            '<div class="review-author"><div class="avatar-circle">' + escapeHtml(initials) + '</div>' +
            '<div class="review-author-info"><h5>' + escapeHtml(r.name) + '</h5><p>' + escapeHtml(r.company) + ' <span class="review-date">' + escapeHtml(r.date) + '</span></p></div>' +
            '</div></div></div>'
        );
    }).join("");
}

function initMobileMenu() {
    var hamburger = document.getElementById("hamburger");
    var overlay = document.getElementById("mobile-overlay");
    if (!hamburger || !overlay) return;

    hamburger.addEventListener("click", function () {
        var open = overlay.classList.toggle("open");
        hamburger.classList.toggle("open", open);
        hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeMenu(); });
    function closeMenu() {
        overlay.classList.remove("open"); hamburger.classList.remove("open"); hamburger.setAttribute("aria-expanded", "false");
    }
    overlay.querySelectorAll("a.nav-link").forEach(function (link) {
        link.addEventListener("click", function (e) {
            e.preventDefault(); closeMenu();
            var target = document.querySelector(link.getAttribute("href"));
            if (target) target.scrollIntoView({ behavior: "smooth" });
        });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
}

function initScrollSpy() {
    var sections = document.querySelectorAll("main section[id]");
    var navLinks = document.querySelectorAll(".nav-link");
    if (!sections.length) return;

    function setActive(id) { navLinks.forEach(function (link) { link.classList.toggle("active", link.getAttribute("data-target") === id); }); }
    var scrollOffset = 120;
    function onScroll() {
        var pos = window.scrollY + scrollOffset;
        var current = sections[0].id;
        sections.forEach(function (sec) { if (sec.offsetTop <= pos) current = sec.id; });
        var pageBottom = document.body.offsetHeight - window.innerHeight;
        if (window.scrollY >= pageBottom - 4) current = sections[sections.length - 1].id;
        setActive(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
}

function initCountUp() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    function animateCounter(el) {
        var target = parseInt(el.getAttribute("data-count"), 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var duration = 1600; var start = null;
        function step(timestamp) {
            if (!start) start = timestamp;
            var progress = Math.min((timestamp - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) { animateCounter(entry.target); io.unobserve(entry.target); }
        });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
}

function initPortfolioFilter() {
    var buttons = document.querySelectorAll(".filter-btn");
    var items = document.querySelectorAll(".portfolio-item");
    if (!buttons.length || !items.length) return;

    buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            buttons.forEach(function (b) { b.classList.remove("active"); });
            btn.classList.add("active");
            var filter = btn.getAttribute("data-filter");
            items.forEach(function (item) {
                var show = filter === "all" || item.getAttribute("data-category") === filter;
                if (show) {
                    item.classList.remove("hidden"); item.classList.add("hiding");
                    requestAnimationFrame(function () {
                        item.classList.remove("hiding"); item.classList.add("appearing");
                        setTimeout(function () { item.classList.remove("appearing"); }, 420);
                    });
                } else {
                    item.classList.add("hiding");
                    setTimeout(function () { item.classList.add("hidden"); item.classList.remove("hiding"); }, 300);
                }
            });
        });
    });
}

function initStarRating() {
    var container = document.getElementById("star-rating");
    if (!container) return;
    var stars = container.querySelectorAll("i");
    var hiddenInput = document.getElementById("rv-rating");
    var current = 0;
    function paint(level) { stars.forEach(function (s) { s.classList.toggle("active", parseInt(s.getAttribute("data-value"), 10) <= level); }); }
    stars.forEach(function (star) {
        star.addEventListener("mouseenter", function () { paint(parseInt(star.getAttribute("data-value"), 10)); });
        star.addEventListener("click", function () {
            current = parseInt(star.getAttribute("data-value"), 10);
            hiddenInput.value = current; paint(current);
        });
    });
    container.addEventListener("mouseleave", function () { paint(current); });
}

function showFormStatus(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.className = "form-status show " + (type || "");
}

function initReviewForm() {
    var form = document.getElementById("review-form");
    if (!form) return;
    var status = document.getElementById("review-form-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    var btnHTML = submitBtn.innerHTML;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (submitBtn.disabled) return; // ignore extra clicks

        var name = document.getElementById("rv-name").value.trim();
        var email = document.getElementById("rv-email").value.trim();
        var message = document.getElementById("rv-message").value.trim();
        var rating = document.getElementById("rv-rating").value;

        if (!name || !email || !message) { showFormStatus(status, "Please fill in all fields.", "error"); return; }
        if (rating === "0") { showFormStatus(status, "Please select a star rating.", "error"); return; }

        // Disable button right away
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
        showFormStatus(status, "Sending your review...", "");

        saveToCloudflare({
            type: "review", name: name, email: email,
            company: document.getElementById("rv-company").value.trim() || "Not provided",
            rating: parseInt(rating, 10), review_message: message
        }).then(function () {
            showFormStatus(status, "Thank you! Your review has been saved.", "success");
            form.reset();
            document.querySelectorAll("#star-rating i").forEach(function (s) { s.classList.remove("active"); });
            document.getElementById("rv-rating").value = "0";
        }).catch(function () {
            showFormStatus(status, "Sorry, an error occurred.", "error");
        }).finally(function () {
            // Enable button again
            submitBtn.disabled = false;
            submitBtn.innerHTML = btnHTML;
        });
    });
}

function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var status = document.getElementById("contact-form-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    var btnHTML = submitBtn.innerHTML;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (submitBtn.disabled) return; // ignore extra clicks

        var name = document.getElementById("ct-name").value.trim();
        var email = document.getElementById("ct-email").value.trim();
        var phone = document.getElementById("ct-phone").value.trim();
        var message = document.getElementById("ct-message").value.trim();

        if (!name || !email || !message) { showFormStatus(status, "Please fill in all required fields.", "error"); return; }
        if (!isValidPhone(phone)) { showFormStatus(status, "Please enter a valid 10-digit mobile number.", "error"); return; }

        // Disable button right away
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        showFormStatus(status, "Sending your message...", "");

        saveToCloudflare({
            type: "contact", name: name, email: email, phone: phone,
            subject: document.getElementById("ct-subject").value || "General Enquiry",
            message: message
        }).then(function () {
            showFormStatus(status, "Message sent successfully!", "success");
            form.reset();
        }).catch(function () {
            showFormStatus(status, "Sorry, an error occurred.", "error");
        }).finally(function () {
            // Enable button again
            submitBtn.disabled = false;
            submitBtn.innerHTML = btnHTML;
        });
    });
}

function initBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", function () { btn.classList.toggle("show", window.scrollY > 500); }, { passive: true });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
}

function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   SOLAR CALCULATOR ENGINE (Integrated from solarcalculator.html)
   ============================================================ */
function initSolarCalculator() {
    if (!document.getElementById("inputs")) return; // Only run if calculator is on page

    var lastCalc = null;
    var INDIA_AVG_PSH = 5.10;
    var CITIES = [
      ["Agartala","Tripura",4.50],["Agra","Uttar Pradesh",5.10],["Ahmedabad","Gujarat",5.50],
      ["Aizawl","Mizoram",4.60],["Ajmer","Rajasthan",5.55],["Aligarh","Uttar Pradesh",5.00],
      ["Amritsar","Punjab",4.95],["Aurangabad","Maharashtra",5.40],["Bareilly","Uttar Pradesh",4.90],
      ["Belagavi","Karnataka",5.35],["Bengaluru","Karnataka",5.40],["Bhavnagar","Gujarat",5.55],
      ["Bhopal","Madhya Pradesh",5.30],["Bhubaneswar","Odisha",4.90],["Bhuj","Gujarat",5.75],
      ["Bikaner","Rajasthan",5.80],["Bilaspur","Chhattisgarh",5.05],["Chandigarh","Chandigarh",4.95],
      ["Chennai","Tamil Nadu",5.25],["Coimbatore","Tamil Nadu",5.40],["Cuttack","Odisha",4.90],
      ["Dehradun","Uttarakhand",4.70],["Delhi","Delhi NCR",5.05],["Dhanbad","Jharkhand",4.80],
      ["Durgapur","West Bengal",4.75],["Faridabad","Haryana",5.05],["Gandhinagar","Gujarat",5.50],
      ["Gangtok","Sikkim",4.40],["Gaya","Bihar",4.80],["Ghaziabad","Uttar Pradesh",5.00],
      ["Gorakhpur","Uttar Pradesh",4.80],["Guntur","Andhra Pradesh",5.20],["Gurugram","Haryana",5.10],
      ["Guwahati","Assam",4.40],["Gwalior","Madhya Pradesh",5.20],["Howrah","West Bengal",4.70],
      ["Hubballi","Karnataka",5.40],["Hyderabad","Telangana",5.35],["Imphal","Manipur",4.60],
      ["Indore","Madhya Pradesh",5.40],["Itanagar","Arunachal Pradesh",4.30],["Jabalpur","Madhya Pradesh",5.15],
      ["Jaipur","Rajasthan",5.45],["Jaisalmer","Rajasthan",5.90],["Jalandhar","Punjab",4.90],
      ["Jammu","Jammu & Kashmir",4.85],["Jamnagar","Gujarat",5.60],["Jamshedpur","Jharkhand",4.90],
      ["Jodhpur","Rajasthan",5.75],["Kalaburagi","Karnataka",5.50],["Kanpur","Uttar Pradesh",4.95],
      ["Kochi","Kerala",5.00],["Kohima","Nagaland",4.50],["Kolhapur","Maharashtra",5.20],
      ["Kolkata","West Bengal",4.70],["Kota","Rajasthan",5.40],["Kozhikode","Kerala",5.00],
      ["Leh","Ladakh",5.70],["Lucknow","Uttar Pradesh",4.95],["Ludhiana","Punjab",4.90],
      ["Madurai","Tamil Nadu",5.40],["Mangaluru","Karnataka",5.10],["Meerut","Uttar Pradesh",4.95],
      ["Moradabad","Uttar Pradesh",4.90],["Mumbai","Maharashtra",5.20],["Muzaffarpur","Bihar",4.70],
      ["Mysuru","Karnataka",5.30],["Nagpur","Maharashtra",5.30],["Nashik","Maharashtra",5.40],
      ["Navi Mumbai","Maharashtra",5.20],["Nellore","Andhra Pradesh",5.15],["Nizamabad","Telangana",5.30],
      ["Noida","Uttar Pradesh",5.05],["Panaji","Goa",5.30],["Patiala","Punjab",4.95],
      ["Patna","Bihar",4.75],["Port Blair","Andaman & Nicobar",4.70],["Prayagraj","Uttar Pradesh",5.00],
      ["Puducherry","Puducherry",5.20],["Pune","Maharashtra",5.40],["Raipur","Chhattisgarh",5.10],
      ["Rajkot","Gujarat",5.55],["Ranchi","Jharkhand",4.90],["Rourkela","Odisha",4.90],
      ["Salem","Tamil Nadu",5.30],["Shillong","Meghalaya",4.50],["Shimla","Himachal Pradesh",4.70],
      ["Siliguri","West Bengal",4.50],["Solapur","Maharashtra",5.50],["Srinagar","Jammu & Kashmir",4.45],
      ["Surat","Gujarat",5.40],["Thane","Maharashtra",5.20],["Thiruvananthapuram","Kerala",5.10],
      ["Thrissur","Kerala",5.00],["Tiruchirappalli","Tamil Nadu",5.30],["Tirunelveli","Tamil Nadu",5.35],
      ["Tirupati","Andhra Pradesh",5.20],["Udaipur","Rajasthan",5.50],["Ujjain","Madhya Pradesh",5.40],
      ["Vadodara","Gujarat",5.45],["Varanasi","Uttar Pradesh",4.90],["Vijayawada","Andhra Pradesh",5.20],
      ["Visakhapatnam","Andhra Pradesh",5.00],["Warangal","Telangana",5.30]
    ];
    var ALIASES = {
      bangalore:"Bengaluru", bombay:"Mumbai", calcutta:"Kolkata", madras:"Chennai",
      trivandrum:"Thiruvananthapuram", mysore:"Mysuru", mangalore:"Mangaluru",
      hubli:"Hubballi", dharwad:"Hubballi", belgaum:"Belagavi", gulbarga:"Kalaburagi",
      pondicherry:"Puducherry", allahabad:"Prayagraj", gurgaon:"Gurugram",
      vizag:"Visakhapatnam", waltair:"Visakhapatnam", trichy:"Tiruchirappalli",
      tiruchirapalli:"Tiruchirappalli", cochin:"Kochi", ernakulam:"Kochi",
      calicut:"Kozhikode", baroda:"Vadodara", poona:"Pune", panjim:"Panaji",
      goa:"Panaji", simla:"Shimla", banaras:"Varanasi", benares:"Varanasi",
      newdelhi:"Delhi", ncr:"Delhi", secunderabad:"Hyderabad",
      chhatrapatisambhajinagar:"Aurangabad", tirupathi:"Tirupati", vizianagaram:"Visakhapatnam"
    };

    var CAPEX_RES = [[2,70000],[3,60000],[10,55000],[Infinity,50000]];
    var CAPEX_CNI = [[10,50000],[50,45000],[100,42000],[Infinity,38000]];
    var GRID_CO2_KG_PER_KWH = 0.71;
    var MONTHLY_DAILY_YIELD = [
      { month: "January", daily: 3.31 },
      { month: "February", daily: 3.34 },
      { month: "March", daily: 4.27 },
      { month: "April", daily: 4.43 },
      { month: "May", daily: 4.45 },
      { month: "June", daily: 3.98 },
      { month: "July", daily: 2.96 },
      { month: "August", daily: 3.03 },
      { month: "September", daily: 4.13 },
      { month: "October", daily: 3.71 },
      { month: "November", daily: 3.53 },
      { month: "December", daily: 2.84 }
    ];

    function normalize(s) { return String(s == null ? "" : s).toLowerCase().replace(/[^a-z]/g, ""); }
    var CITY_MAP = {};
    for (var i = 0; i < CITIES.length; i++) { CITY_MAP[normalize(CITIES[i][0])] = { city: CITIES[i][0], state: CITIES[i][1], psh: CITIES[i][2] }; }
    function lookupCity(raw) {
      var n = normalize(raw);
      if (!n) return { psh: INDIA_AVG_PSH, found: false, blank: true, label: "" };
      if (ALIASES[n]) n = normalize(ALIASES[n]);
      var hit = CITY_MAP[n];
      if (hit) return { psh: hit.psh, found: true, blank: false, label: hit.city + ", " + hit.state };
      return { psh: INDIA_AVG_PSH, found: false, blank: false, label: String(raw).trim() };
    }

    function specificYield(psh, pr) { return psh * 365 * pr; }
    function panelsNeeded(kWp, wp) { return Math.ceil(kWp * 1000 / wp); }
    function areaNeeded(panels, areaPerPanel, factor) {
      var areaPerPanelWithSpacing = areaPerPanel * 1.20;
      return panels * areaPerPanelWithSpacing;
    }
    function maxPanels(area, areaPerPanel, packFactor) {
      var areaPerPanelWithSpacing = areaPerPanel * 1.20;
      return Math.floor(area / areaPerPanelWithSpacing);
    }
    function pmSuryaGharSubsidy(kWp) {
      if (kWp <= 0) return 0;
      if (kWp <= 2) return 30000 * kWp;
      if (kWp < 3) return 60000 + (kWp - 2) * 18000;
      return 78000;
    }
    function slabRate(kWp, slabs) {
      for (var i = 0; i < slabs.length; i++) { if (kWp <= slabs[i][0]) return slabs[i][1]; }
      return slabs[slabs.length - 1][1];
    }
    function npv(rate, cf) {
      var v = 0;
      for (var t = 0; t < cf.length; t++) v += cf[t] / Math.pow(1 + rate, t);
      return v;
    }
    function irr(cf) {
      var lo = -0.9999, hi = 10, fLo = npv(lo, cf), fHi = npv(hi, cf);
      if (!isFinite(fLo) || !isFinite(fHi) || fLo * fHi > 0) return null;
      for (var k = 0; k < 300; k++) {
        var mid = (lo + hi) / 2, fMid = npv(mid, cf);
        if (fMid === 0) return mid;
        if (fLo * fMid < 0) { hi = mid; fHi = fMid; } else { lo = mid; fLo = fMid; }
      }
      return (lo + hi) / 2;
    }
    function paybackYears(cf) {
      var cum = cf[0];
      if (cum >= 0) return 0;
      for (var t = 1; t < cf.length; t++) {
        if (cum + cf[t] >= 0) {
          if (cf[t] === 0) return null;
          return (t - 1) + (-cum / cf[t]);
        }
        cum += cf[t];
      }
      return null;
    }

    function $(id) { return document.getElementById(id); }
    function num(id) {
      var el = $(id);
      if (!el) return null;
      var s = String(el.value).trim();
      if (s === "") return null;
      var v = parseFloat(s);
      return isFinite(v) ? v : null;
    }
    function numOr(id, dflt) { var v = num(id); return v === null ? dflt : v; }
    function inr(v) { return (v === null || !isFinite(v)) ? "—" : "₹" + Math.round(v).toLocaleString("en-IN"); }
    function fmt(v, d) { return (v === null || !isFinite(v)) ? "—" : v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }); }
    function kpi(k, v, u, s, hero) {
      return '<div class="kpi' + (hero ? " hero" : "") + '"><div class="k">' + k + '</div>' +
             '<div class="v">' + v + (u ? '<span class="u">' + u + "</span>" : "") + "</div>" +
             (s ? '<div class="s">' + s + "</div>" : "") + "</div>";
    }
    function row(label, value, sub) { return "<tr><td>" + label + (sub ? '<span class="sub">' + sub + "</span>" : "") + "</td><td>" + value + "</td></tr>"; }

    var state = { panel: "A", segment: "RES", subsidy: "Y" };
    function wireSeg(id, key) {
      var box = $(id);
      if (!box) return;
      box.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        state[key] = b.getAttribute("data-v");
        var all = box.querySelectorAll("button");
        for (var i = 0; i < all.length; i++) { all[i].setAttribute("aria-pressed", all[i] === b ? "true" : "false"); }
        recalc();
      });
    }

    function gather() {
      var g = {};
      var cityInfo = lookupCity($("city") ? $("city").value : "");
      g.cityInfo = cityInfo;
      var pshOv = num("psh");
      g.psh = pshOv !== null ? pshOv : cityInfo.psh;
      g.pshOverridden = pshOv !== null;

      g.pr = numOr("pr", 0.74);
      g.pack = numOr("pack", 0.80);
      g.wp = state.panel === "A" ? numOr("wpA", 650) : numOr("wpB", 700);
      g.panelArea = state.panel === "A" ? numOr("areaA", 2.62) : numOr("areaB", 3.12);
      g.otherWp = state.panel === "A" ? numOr("wpB", 700) : numOr("wpA", 650);
      g.otherArea = state.panel === "A" ? numOr("areaB", 3.12) : numOr("areaA", 2.62);
      g.panelLabel = state.panel === "A" ? "A · below 650 Wp" : "B · 700 Wp";
      g.otherLabel = state.panel === "A" ? "B (700 Wp)" : "A (below 650 Wp)";

      g.consumption = num("consumption");
      g.bill = num("bill");
      g.area = num("area");
      g.fixed = numOr("fixed", 0);
      g.tariffOv = num("tariffOv");

      g.isRes = state.segment === "RES";
      g.wantSubsidy = state.subsidy === "Y" && g.isRes;
      g.capexOv = num("capexOv");
      g.stateSub = numOr("stateSub", 0);
      g.adBen = numOr("adBen", 0) / 100;
      g.selfUse = numOr("selfUse", 100) / 100;
      g.exportRate = numOr("exportRate", 3);
      g.esc = numOr("esc", 3) / 100;
      g.deg = numOr("deg", 0.5) / 100;
      g.disc = numOr("disc", 8) / 100;
      g.om = numOr("om", 1) / 100;
      g.invYr = Math.round(numOr("invYr", 12));
      g.invCost = numOr("invCost", 6000);
      g.life = Math.max(1, Math.round(numOr("life", 25)));

      g.yield = specificYield(g.psh, g.pr);
      return g;
    }

    function effectiveTariff(g) {
      var variable = g.bill === null ? null : Math.max(0, g.bill - g.fixed);
      if (variable !== null && g.consumption !== null && g.consumption > 0) { return { rate: variable / g.consumption, basis: "derived" }; }
      if (g.tariffOv !== null) return { rate: g.tariffOv, basis: "override" };
      return { rate: g.isRes ? 8.00 : 9.00, basis: "default" };
    }
    function resolveConsumption(g, tariff) {
      if (g.consumption !== null && g.consumption > 0) { return { kwh: g.consumption, estimated: false }; }
      if (g.bill !== null && tariff.rate > 0) { return { kwh: Math.max(0, g.bill - g.fixed) / tariff.rate, estimated: true }; }
      return { kwh: null, estimated: false };
    }
    function buildSizing(g, cons) {
      if (cons.kwh === null || cons.kwh <= 0) return null;
      var s = {};
      s.exactKWp = cons.kwh / g.yield;
      s.panels = panelsNeeded(s.exactKWp, g.wp);
      s.installedKWp = s.panels * g.wp / 1000;
      s.generation = s.installedKWp * g.yield;
      s.offset = cons.kwh > 0 ? s.generation / cons.kwh : null;
      s.areaReq = areaNeeded(s.panels, g.panelArea, g.pack);
      return s;
    }
    function buildArea(g, s) {
      if (g.area === null || g.area <= 0) return null;
      var a = {};
      a.fitPanels = maxPanels(g.area, g.panelArea, g.pack);
      a.fitKWp = a.fitPanels * g.wp / 1000;
      a.fitGeneration = a.fitKWp * g.yield;
      a.densityThis = g.wp / g.panelArea;
      a.densityOther = g.otherWp / g.otherArea;
      a.otherFitPanels = maxPanels(g.area, g.otherArea, g.pack);
      a.otherFitKWp = a.otherFitPanels * g.otherWp / 1000;
      if (s) {
        a.required = s.areaReq;
        a.sufficient = g.area >= s.areaReq - 1e-9;
        a.delta = g.area - s.areaReq;
      }
      return a;
    }
    function buildROI(g, kWp, tariff) {
      if (kWp <= 0) return null;
      var r = {};
      r.kWp = kWp;
      r.rate = g.capexOv !== null ? g.capexOv : slabRate(kWp, g.isRes ? CAPEX_RES : CAPEX_CNI);
      r.gross = r.rate * kWp;
      r.subsidy = g.wantSubsidy ? pmSuryaGharSubsidy(kWp) : 0;
      r.stateSub = Math.min(g.stateSub, Math.max(0, r.gross - r.subsidy));
      r.net = Math.max(0, r.gross - r.subsidy - r.stateSub);
      r.adBenefit = g.isRes ? 0 : g.adBen * r.gross;
      r.gen1 = kWp * g.yield;
      r.om1 = g.om * r.gross;
      r.tariff = tariff.rate;

      var cf = [-r.net], gens = [], cums = [], cum = -r.net;
      r.lifetimeSavings = 0; r.lifetimeGen = 0; r.pvOm = 0; r.pvGen = 0; r.rows = [];

      for (var y = 1; y <= g.life; y++) {
        var gen = r.gen1 * Math.pow(1 - g.deg, y - 1);
        var retail = r.tariff * Math.pow(1 + g.esc, y - 1);
        var save = gen * (g.selfUse * retail + (1 - g.selfUse) * g.exportRate);
        var om = r.om1 * Math.pow(1 + g.esc, y - 1);
        var inv = (y === g.invYr) ? g.invCost * kWp : 0;
        var ad = (y === 1) ? r.adBenefit : 0;
        var net = save - om - inv + ad;
        cum += net; cf.push(net); gens.push(gen); cums.push(cum);
        r.lifetimeSavings += save; r.lifetimeGen += gen;
        r.pvOm += (om + inv) / Math.pow(1 + g.disc, y);
        r.pvGen += gen / Math.pow(1 + g.disc, y);
        r.rows.push({ y: y, gen: gen, retail: retail, save: save, om: om + inv, net: net, cum: cum });
      }
      r.cf = cf; r.cums = cums; r.save1 = r.rows[0].save; r.netBenefit1 = r.save1 - r.om1;
      r.simplePayback = r.netBenefit1 > 0 ? r.net / r.netBenefit1 : null;
      r.payback = paybackYears(cf); r.npv = npv(g.disc, cf); r.irr = irr(cf);
      r.simpleROI = r.net > 0 ? r.netBenefit1 / r.net : null;
      r.lcoe = r.pvGen > 0 ? (r.net + r.pvOm) / r.pvGen : null;
      r.co2 = r.gen1 * GRID_CO2_KG_PER_KWH / 1000;

      var dcum = -r.net; r.discPayback = null;
      for (var t = 1; t < cf.length; t++) {
        var d = cf[t] / Math.pow(1 + g.disc, t);
        if (dcum + d >= 0 && r.discPayback === null && d !== 0) { r.discPayback = (t - 1) + (-dcum / d); }
        dcum += d;
      }
      return r;
    }

    function renderSizing(g, cons, s) {
      var el = $("sizeOut");
      if(!el) return;
      if (!s) { el.innerHTML = '<div class="empty">Enter your <b>yearly average electricity consumption</b> (or your yearly bill) to size the plant.</div>'; return; }
      var estPill = cons.estimated ? '<span class="pill est">estimated</span>' : "";
      var pshPill = g.pshOverridden ? '<span class="pill">manual PSH</span>' : (g.cityInfo.found ? "" : '<span class="pill avg">India avg</span>');

      var html = '<div class="kpis">' +
        kpi("Required plant size", fmt(s.installedKWp, 2), " kWp", s.panels + " × " + Math.round(g.wp) + " Wp", true) +
        kpi("Specific yield", fmt(g.yield, 0), " kWh/kWp/yr", "PSH × 365 × PR " + fmt(g.pr, 2)) +
        kpi("Est. annual generation", fmt(s.generation, 0), " kWh", fmt(s.generation / 12, 0) + " kWh per month avg") +
        "</div>";
      el.innerHTML = html;
    }

    function renderArea(g, s, a) {
      var el = $("areaOut");
      if(!el) return;
      if (!a) { el.innerHTML = '<div class="empty">Enter your <b>shadow-free area</b> to check whether it is sufficient.</div>'; return; }

      var html = "";
      if (s) {
        if (a.sufficient) html += '<div class="verdict ok"><strong>Yes — sufficient area.</strong> The ' + fmt(s.installedKWp, 2) + ' kWp system fits.</div>';
        else html += '<div class="verdict no"><strong>No — area is short by ' + fmt(-a.delta, 2) + ' m².</strong> Only <b>' + fmt(a.fitKWp, 2) + ' kWp</b> fits.</div>';
      }
      html += '<div class="kpis">' +
        kpi("Area required", s ? fmt(a.required, 2) : "—", " m²", s ? s.panels + " panels" : "needs consumption") +
        (s && !a.sufficient ? kpi("Max capacity that fits", fmt(a.fitKWp, 2), " kWp", a.fitPanels + " panels (Option " + state.panel + ")") : "") +
        "</div>";
      el.innerHTML = html;
    }

    function renderROI(g, cons, s, a, tariff) {
      var el = $("roiOut");
      if(!el) return;
      var wasOpen = el.querySelector("details") ? el.querySelector("details").open : false;
      if (g.bill === null || g.bill <= 0) { el.innerHTML = '<div class="empty">Enter your <b>yearly average bill</b> to calculate ROI.</div>'; return; }

      var kWp = null, capped = false;
      if (s && a && !a.sufficient) { kWp = a.fitKWp; capped = true; }
      else if (s) { kWp = s.installedKWp; }
      else if (a) { kWp = a.fitKWp; }
      if (kWp === null || kWp <= 0) { el.innerHTML = '<div class="empty">Add consumption or area to establish system size.</div>'; return; }

      var r = buildROI(g, kWp, tariff);
      var html = "";
      if (capped) html += '<div class="verdict warn"><strong>Costed at ' + fmt(kWp, 2) + ' kWp (roof-limited).</strong></div>';

      // FUTURE EDIT: To remove an ROI KPI, delete the corresponding kpi() line below
      var co2Kg = Math.max(0, r.gen1 * 0.72);
      var co2Tonnes = co2Kg / 1000;
      html += '<div class="kpis">' +
        kpi("Payback", r.payback === null ? "—" : fmt(r.payback, 1), " yrs", "cumulative cashflow turns positive", true) +
        kpi("IRR", r.irr === null ? "—" : fmt(r.irr * 100, 1), "%", g.life + "-year, post-subsidy") +
        kpi("Net cost to you", inr(r.net), "", inr(r.rate) + "/kWp gross") +
        kpi("CO₂ Footprint Reduced", fmt(co2Tonnes, 1), " t/yr", "India grid factor 0.72 kg/kWh") +
        "</div>";

      html += '<details class="calc-details calc-result-details"' + (wasOpen ? " open" : "") + '>' +
        '<summary>More ROI details</summary><div class="body">' +
        kpi("Year-1 net saving", inr(r.netBenefit1), "", "after " + inr(r.om1) + " O&M");

      // FUTURE EDIT: To remove Cost Build-up table, comment this block
      html += "<h3>Cost build-up</h3><table class='dl'>" +
        row("System size costed", fmt(kWp, 2) + " kWp") +
        row("Gross installed cost", inr(r.gross)) +
        row("PM Surya Ghar subsidy", r.subsidy > 0 ? "− " + inr(r.subsidy) : "—") +
        "<tr class='total'><td>Net cost to you</td><td>" + inr(r.net) + "</td></tr></table>";

      html += "<h3>Cumulative cashflow</h3>" +
        '<div class="chart-wrap">' + chartSVG(r, g) + '<div class="chart-tooltip" aria-live="polite"></div></div>' +
        '</div></details>';
      el.innerHTML = html;

      var tooltip = el.querySelector('.chart-tooltip');
      var points = el.querySelectorAll('.chart-point');
      points.forEach(function (point) {
        point.addEventListener('mousemove', function (event) {
          var rect = el.querySelector('.chart-wrap').getBoundingClientRect();
          var year = point.getAttribute('data-year');
          var cashflow = Number(point.getAttribute('data-cashflow'));
          tooltip.innerHTML = 'Year ' + year + '<br>Cashflow ' + inr(cashflow);
          tooltip.classList.add('show');
          tooltip.style.left = (event.clientX - rect.left) + 'px';
          tooltip.style.top = (event.clientY - rect.top) + 'px';
        });
        point.addEventListener('mouseleave', function () {
          tooltip.classList.remove('show');
        });
      });
    }

    function renderMonthlyOutput(g, s, a) {
      var el = $("monthlyOut");
      if(!el) return;
      var wasOpen = el.querySelector("details") ? el.querySelector("details").open : false;
      var capped = (s && a && !a.sufficient);

      var kWp = null;
      if (s && a && !a.sufficient) { kWp = a.fitKWp; }
      else if (s) { kWp = s.installedKWp; }
      else if (a) { kWp = a.fitKWp; }

      if (kWp === null || kWp <= 0) {
        el.innerHTML = '<div class="empty">Add consumption or area to establish the plant size.</div>';
        return;
      }

      var DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
      var totalWeight = 0;
      for (var i = 0; i < MONTHLY_DAILY_YIELD.length; i++) {
      totalWeight += MONTHLY_DAILY_YIELD[i].daily * DAYS_IN_MONTH[i];
      }

      var annualGeneration = (s && a && !a.sufficient) ? a.fitGeneration : (s ? s.generation : a.fitGeneration);

      var totalAnnualOutput = 0;
      var rows = MONTHLY_DAILY_YIELD.map(function (item, index) {
          var weight = item.daily * DAYS_IN_MONTH[index];
          var output = annualGeneration * (weight / totalWeight);
          totalAnnualOutput += output;
          return '<tr><td>' + (index + 1) + '</td><td>' + item.month + '</td><td>' + fmt(output, 1) + ' kWh</td></tr>';
      }).join("");

      el.innerHTML = (capped ? '<div class="verdict warn"><strong>Output shown for roof-limited system (' + fmt(kWp, 2) + ' kWp), not full required size.</strong></div>' : "") +
        '<div class="monthly-output-summary"><span>Annual output</span><strong>' + fmt(totalAnnualOutput, 1) + ' kWh/year</strong></div>' +
        '<details class="calc-details calc-result-details"' + (wasOpen ? " open" : "") + '>' +
        '<summary>View monthwise output</summary><div class="body"><table class="monthly-output-table">' +
        '<thead><tr><th>SrNo</th><th>Month</th><th>Expected Solar Output (kWh)</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></details>';
    }

    function chartSVG(r, g) {
      var pts = [{ x: 0, y: -r.net }];
      for (var i = 0; i < r.cums.length; i++) pts.push({ x: i + 1, y: r.cums[i] });
      var lo = 0, hi = 0;
      for (var j = 0; j < pts.length; j++) { if (pts[j].y < lo) lo = pts[j].y; if (pts[j].y > hi) hi = pts[j].y; }
      if (hi === lo) hi = lo + 1;
      var W = 620, H = 190, padL = 8, padR = 8, padT = 12, padB = 22;
      var sx = function (x) { return padL + x / g.life * (W - padL - padR); };
      var sy = function (y) { return padT + (hi - y) / (hi - lo) * (H - padT - padB); };
      var d = "";
      for (var k = 0; k < pts.length; k++) d += (k ? " L" : "M") + sx(pts[k].x).toFixed(1) + "," + sy(pts[k].y).toFixed(1);
      var zeroY = sy(0).toFixed(1);
      var s = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img">';
      s += '<line x1="' + padL + '" y1="' + zeroY + '" x2="' + (W - padR) + '" y2="' + zeroY + '"/>';
      s += '<path d="' + d + " L" + sx(g.life).toFixed(1) + "," + zeroY + " L" + sx(0).toFixed(1) + "," + zeroY + ' Z" fill="#e8f3ee"/>';
      s += '<path d="' + d + '" fill="none" stroke="#0b6b4f" stroke-width="2"/>';
      for (var k = 0; k < pts.length; k++) {
        var label = 'Year ' + pts[k].x + ' · Cashflow ' + inr(pts[k].y);
        s += '<circle class="chart-point" data-year="' + pts[k].x + '" data-cashflow="' + pts[k].y + '" cx="' + sx(pts[k].x).toFixed(1) + '" cy="' + sy(pts[k].y).toFixed(1) + '" r="1.7" fill="#d4af37" stroke="#d4af37"><title>' + label + '</title></circle>';
      }
      if (r.payback !== null && r.payback <= g.life) {
        s += '<circle cx="' + sx(r.payback).toFixed(1) + '" cy="' + zeroY + '" r="3" fill="rgba(212, 175, 55, 0.05)" stroke="rgba(212, 175, 55, 0.1)"/>';
        s += '<text x="' + (sx(r.payback) + 8).toFixed(1) + '" y="' + (parseFloat(zeroY) - 8).toFixed(1) +
             '" font-size="15" fill="#d4af37" font-weight="700">payback ' + fmt(r.payback, 1) + " yrs</text>";
      }
      s += '<text x="' + padL + '" y="' + (H - 6) + '" font-size="10.5" fill="#656d76">year 0 · ' + inr(-r.net) + "</text>";
      s += '<text x="' + (W - padR) + '" y="' + (H - 6) + '" font-size="10.5" fill="#656d76" text-anchor="end">year ' +
           g.life + " · " + inr(pts[pts.length - 1].y) + "</text>";
      s += "</svg>";
      return s;
    }

    function renderHints(g) {
      if($("cityHint")) $("cityHint").innerHTML = g.cityInfo.found ? "Matched <b>" + g.cityInfo.label + "</b>." : "Using India avg PSH.";
      if($("capexHint")) $("capexHint").innerHTML = "Leave blank to use default benchmark costs.";
    }

    function recalc() {
      var g = gather();
      var tariff = effectiveTariff(g);
      var cons = resolveConsumption(g, tariff);
      var s = buildSizing(g, cons);
      var a = buildArea(g, s);
      renderHints(g); renderSizing(g, cons, s); renderArea(g, s, a); renderROI(g, cons, s, a, tariff); renderMonthlyOutput(g, s, a);

      lastCalc = { g: g, cons: cons, s: s, a: a, kWp: null, r: null };
      if (s && a && !a.sufficient) lastCalc.kWp = a.fitKWp;
      else if (s) lastCalc.kWp = s.installedKWp;
      else if (a) lastCalc.kWp = a.fitKWp;
      if (lastCalc.kWp) lastCalc.r = buildROI(lastCalc.g, lastCalc.kWp, tariff);
    }

	// CHANGED: Removed generateProposalPDF (jsPDF logic). 
// Added buildPayloadForPDF to compile all data for the Cloudflare/Google server.
function buildPayloadForPDF(email, clientName, clientPhone) {
    var g = lastCalc.g, s = lastCalc.s, a = lastCalc.a, r = lastCalc.r;
    
    // Calculate monthly outputs (matching your specific yield logic)
    var DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
    var totalWeight = 0;
    for (var i = 0; i < MONTHLY_DAILY_YIELD.length; i++) {
        totalWeight += MONTHLY_DAILY_YIELD[i].daily * DAYS_IN_MONTH[i];
    }
    var annualGen = (s && a && !a.sufficient) ? a.fitGeneration : (s ? s.generation : (a ? a.fitGeneration : 0));
    
    var monthlyOutputs = [];
    for (var j = 0; j < MONTHLY_DAILY_YIELD.length; j++) {
        var weight = MONTHLY_DAILY_YIELD[j].daily * DAYS_IN_MONTH[j];
        var output = (annualGen * (weight / totalWeight)).toFixed(1);
        monthlyOutputs.push({ month: MONTHLY_DAILY_YIELD[j].month, output: output });
    }

    return {
        type: "solar", 
        email: email,
        client_name: clientName,
        client_phone: clientPhone, // CHANGED
        location: $("city") ? $("city").value : "",
        yearly_consumption: g.consumption, 
        yearly_bill: g.bill, 
        shadow_free_area: g.area,
        solar_panel_selection: state.panel === "A" ? "A (650 Wp or below)" : "B (above 650 Wp)",
        required_plant_size: s ? s.installedKWp : null, 
        specific_yield: g.yield,
        estimated_annual_generation: s ? s.generation : null, 
        area_required: (s && a) ? a.required : null,
        is_area_sufficient: (s && a) ? (a.sufficient ? "Yes" : "No") : null,
        max_capacity_fits: a ? a.fitKWp : null, 
        payback_period: r && r.payback !== null ? r.payback : null,
        co2_footprint: r ? (r.gen1 * 0.72 / 1000) : null, 
        one_year_saving: r ? r.save1 : null,
        net_cost: r ? r.net : null,
        irr_percent: r && r.irr !== null ? (r.irr * 100) : null,
        monthly_outputs: monthlyOutputs
    };
}

// CHANGED: Helper function to download Base64 strings sent back from the server
function downloadBase64PDF(base64Data, filename) {
    var link = document.createElement('a');
    link.href = 'data:application/pdf;base64,' + base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

    function initCalcSubmit() {
    var btn = document.getElementById("calcDownloadBtn");
    var modal = document.getElementById("email-modal");
    var closeBtn = document.getElementById("close-modal");
    var sendBtn = document.getElementById("send-pdf-btn");
    var status = document.getElementById("modal-status");

    if (!btn || !modal) return;

    var TEST_MODE_INSTANT_PDF = false; // 🧪 TESTING ONLY — set to false later

    btn.addEventListener("click", async function () {
        if (!lastCalc || (lastCalc.g.consumption === null && lastCalc.g.bill === null)) {
            alert("Please enter your consumption or bill details first to generate results.");
            return;
        }

        if (TEST_MODE_INSTANT_PDF) {
            var originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';
            btn.disabled = true;
            
            try {
                // FIXED: Now properly sends "Test Client" as the name argument for testing
                var payload = buildPayloadForPDF("test@example.com", "Test Client", "9999999999"); // CHANGED number added
                var res = await saveToCloudflare(payload); 
                
                if (res.pdfBase64) {
                    downloadBase64PDF(res.pdfBase64, "solar_estimate_TEST.pdf");
                } else {
                    alert("Error: No PDF returned from server.");
                }
            } catch (err) {
                alert("Error generating PDF: " + err.message);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            return;
        }

        modal.classList.add("show");
    });

    closeBtn.addEventListener("click", () => { modal.classList.remove("show"); });

    sendBtn.onclick = async function () {
        var email = document.getElementById("client-email").value.trim();
        var clientName = document.getElementById("client-name").value.trim();
        var phone = document.getElementById("client-phone").value.trim(); // CHANGED
        
        if (!clientName) {
            showFormStatus(status, "Please enter your name.", "error");
            return;
        }
        if (!isValidEmail(email)) {
            showFormStatus(status, "Please enter a valid email.", "error");
            return;
        }
        if (!isValidPhone(phone)) { // CHANGED
            showFormStatus(status, "Please enter a valid 10-digit mobile number.", "error");
        return;
        }
        
        modal.classList.add("processing");
        status.textContent = "Generating PDF and sending email... (this takes ~5-10 seconds)";
        status.style.color = "#d4af37";
        sendBtn.disabled = true;

        try {
            var payload = buildPayloadForPDF(email, clientName, phone); // CHANGED added phone
            await saveToCloudflare(payload); 

            // SUCCESS - RESTORE SCREEN & CLOSE
            status.textContent = "Success! PDF sent to your email."; 
            status.style.color = "#4ade80";
            sendBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sent Successfully';
            modal.classList.remove("processing"); 

            // Pop-up auto-close is triggered here on success
            setTimeout(() => {
                modal.classList.remove("show"); 
                status.textContent = ""; 
                sendBtn.disabled = false;
                sendBtn.innerHTML = 'Generate & Email PDF'; 
                closeBtn.style.display = "block"; 
            }, 3000);

        } catch (error) {
            console.error(error);
            // ERROR - RESTORE SCREEN SO THEY CAN TRY AGAIN
            status.textContent = "An error occurred. Please try again."; 
            status.style.color = "#f87171";
            modal.classList.remove("processing");
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Generate & Email PDF';
            closeBtn.style.display = "block";
        }
    };
}

    // Populate Cities
    var dl = $("cityList"), frag = "";
    if(dl) {
      for (var i = 0; i < CITIES.length; i++) { frag += '<option value="' + CITIES[i][0] + '">' + CITIES[i][1] + "</option>"; }
      dl.innerHTML = frag;
    }

    wireSeg("panelSeg", "panel");
    wireSeg("segSeg", "segment");
    wireSeg("subSeg", "subsidy");
    // initCalcSubmit();    // --> I DELETED THE DUPLICATE initCalcSubmit(); FROM HERE <--
    
    $("inputs").addEventListener("input", recalc);
    $("inputs").addEventListener("change", recalc);

    var DEFAULTS = {
      city: "Pune", consumption: "3600", bill: "32000", area: "30",
      wpA: "650", areaA: "2.62", wpB: "700", areaB: "3.12", psh: "", pr: "0.74", pack: "0.80",
      capexOv: "", fixed: "0", tariffOv: "", stateSub: "0", adBen: "0",
      selfUse: "100", exportRate: "3.00", esc: "3.0", deg: "0.5", disc: "8.0",
      om: "1.0", invYr: "12", invCost: "6000", life: "25"
    };

    if($("resetBtn")) {
        $("resetBtn").addEventListener("click", function () {
          for (var k in DEFAULTS) { if ($(k)) $(k).value = DEFAULTS[k]; }
          state.panel = "A"; state.segment = "RES"; state.subsidy = "Y";
          ["panelSeg", "segSeg", "subSeg"].forEach(function (id) {
            var bs = $(id).querySelectorAll("button");
            for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", i === 0 ? "true" : "false");
          });
          recalc();
        });
    }

    initCalcSubmit();
    recalc();
}

/* ============================================================
   BOOTSTRAP - run everything once the DOM is ready
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
    renderReviews();
    initLibraries();
    initMobileMenu();
    initScrollSpy();
    initCountUp();
    initPortfolioFilter();
    initStarRating();
    initReviewForm();
    initContactForm();
    initBackToTop();
    initYear();
    initSolarCalculator();
});