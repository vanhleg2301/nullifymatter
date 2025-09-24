/* ===== Pricing Cards Component (vanilla JS) ===== */
(function () {
	const MOUNT_ID = "pricing-cards-root";
	const STYLE_ID = "nm-pricing-style";

	function injectStyles() {
		if (document.getElementById(STYLE_ID)) return;
		const css = `
      /* Container col: dùng row-cols-* sẵn có của bạn */
      .nm-price-col { display:flex; }
      .nm-price-card{
        background:#fff; border:1px solid #e6eef4; border-radius:16px;
        padding:24px; width:100%; display:flex; flex-direction:column; gap:16px;
        box-shadow:0 2px 12px rgba(16,24,40,.04);
      }
      .nm-price-card.popular{}
      .nm-badge{
        display:inline-flex; align-items:center; gap:8px;
        padding:6px 10px; border-radius:999px; font-weight:600; font-size:12px;
        width:max-content;
      }
      .nm-title{ font-size:22px; font-weight:700; margin:4px 0 2px; color:#0f172a; }
      .nm-price{ font-size:28px; font-weight:800; letter-spacing:.2px; color:#0f172a; }
      .nm-price .cur{ font-size:16px; font-weight:700; margin-right:6px; opacity:.85; }
      .nm-price .unit{ font-size:14px; font-weight:500; margin-left:6px; color:#475569; }
      
.nm-cta{
  --cta-bg: #65c2b6;
  /* fallback màu hover thủ công ~12% đậm hơn */
  --cta-bg-hover: #59aba0;

  background: var(--cta-bg);
  color:#fff;
  display:inline-flex; justify-content:center; align-items:center;
  height:40px; border-radius:5px; text-decoration:none; font-weight:700; width:100%;
  transition: background-color .18s ease;
}

/* chữ luôn trắng ở mọi state (ghi đè rule a:hover của theme) */
.nm-cta,
.nm-cta:link,
.nm-cta:visited,
.nm-cta:hover,
.nm-cta:focus,
.nm-cta:active{
  color:#fff !important;
  text-decoration:none !important;
}

/* Hover: đậm hơn nhưng KHÔNG đổi màu chữ */
.nm-cta:hover{
  background: var(--cta-bg-hover);
}

/* Trình duyệt hỗ trợ color-mix thì dùng công thức đậm 12% */
@supports (background: color-mix(in srgb, #000, #fff)) {
  .nm-cta:hover{
    background: color-mix(in srgb, var(--cta-bg), black 12%);
  }
}

      .nm-features{ list-style:none; padding:0; margin:8px 0 0; display:flex; flex-direction:column; gap:10px; text-align:left;}
      .nm-features li{ display:flex; align-items:flex-start; gap:10px; color:#1f2937; font-size:14px; }
      .nm-features img.nm-check{ width:18px; height:18px; margin-top:2px; flex:0 0 18px; }
      .nm-meta{ color:#64748b; font-size:12px; }

	  .nm-pages{
  display:inline-flex; align-items:center;
  padding:6px 10px; border-radius:999px;
  background:#ecfdff; color:#0d719a;
  font-weight:700; font-size:12px; width:max-content;
  align-self: center;
  margin-inline: auto; 

}

      @media (min-width: 992px){
        .nm-price-card{ padding:28px; }
        .nm-price{ font-size:32px; }
      }
    `;
		const s = document.createElement("style");
		s.id = STYLE_ID;
		s.textContent = css;
		document.head.appendChild(s);
	}

	function el(html) {
		const t = document.createElement("template");
		t.innerHTML = html.trim();
		return t.content.firstElementChild;
	}

	function render(root, data) {
		injectStyles();
		const row = root; // root chính là .row của bạn
		row.innerHTML = ""; // clear just in case

		const tick = data?.icons?.tickBlue || data?.icons?.tick || "";

		data.plans.forEach((plan) => {
			const isPopular = !!plan.badge;
			const badgeHTML = isPopular ? "" : "";

			const priceHTML = `
        <div class="nm-price">
          <span class="cur">${plan.price.currency}</span>
          <span class="amt">${String(plan.price.amount)}</span>
          <span class="unit">${plan.price.unit}</span>
        </div>
      `;

			const pagesLabel = plan.pages
				? typeof plan.pages === "number"
					? `${plan.pages} pages`
					: String(plan.pages)
				: "";
			const pagesHTML = pagesLabel
				? `<div class="nm-pages">${pagesLabel}</div>`
				: "";

			const featuresHTML = (plan.featuresCard || [])
				.map(
					(f) =>
						`<li><img class="nm-check" src="${tick}" alt=""><span>${f}</span></li>`,
				)
				.join("");

			const col = el(`
        <div class="col nm-price-col">
          <article class="nm-price-card ${isPopular ? "popular" : ""}">
            <h3 class="nm-title">${plan.name}</h3>
            ${priceHTML}

			${pagesHTML}

            <a class="nm-cta" href="${
							plan.cta.href
						}" target="_blank" rel="noopener">${plan.cta.label}</a>
            ${
							plan.featuresCardHeading
								? `<div class="nm-meta">${plan.featuresCardHeading}</div>`
								: ""
						}
            <ul class="nm-features">${featuresHTML}</ul>
          </article>
        </div>
      `);

			row.appendChild(col);
		});
	}

	async function boot() {
		const root =
			document.getElementById(MOUNT_ID) ||
			document.querySelector(`#${MOUNT_ID}`) ||
			document.getElementById("pricing-cards-root");
		if (!root) return;

		// 1) Ưu tiên đọc JSON từ file ngoài qua data-src
		const src = root.getAttribute("data-src");
		if (src) {
			try {
				const res = await fetch(src, { cache: "no-store" });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data = await res.json();
				render(root, data);
				return;
			} catch (err) {
				console.error("Load pricing JSON from file failed:", err);
				// rơi xuống fallback nếu có inline
			}
		}

		// 2) Fallback: nếu còn <script id="pricing-data"> trong DOM
		const dataTag = document.getElementById("pricing-data");
		if (dataTag) {
			try {
				const data = JSON.parse(dataTag.textContent.trim());
				render(root, data);
			} catch (e) {
				console.error("Invalid inline pricing JSON", e);
			}
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
