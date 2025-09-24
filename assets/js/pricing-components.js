// /assets/js/pricing-components.js
const q = (sel, ctx = document) => ctx.querySelector(sel);
const qa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

async function loadJSON(src) {
	const res = await fetch(src, { cache: "no-store" });
	if (!res.ok) throw new Error(`Failed to load ${src}`);
	return res.json();
}

function fmtPrice(p) {
	if (!p || p.amount === "" || p.amount === null || p.amount === undefined)
		return "";
	return `${p.currency} ${p.amount}`;
}

/* ------------------ RENDER: PRICING CARDS ------------------ */
function renderPricingCards(container, data) {
	const { plans, icons } = data;

	const cardHtml = (plan) => {
		const badge = plan.badge
			? `<div class="badge-container ml-4" style="background-color:${plan.badge.bg};height:fit-content"><span style="color:${plan.badge.color}">${plan.badge.label}</span></div>`
			: "";

		const price = plan.price
			? `<p><span class="price-large">${fmtPrice(
					plan.price,
			  )}</span><span class="span-1"> ${plan.price.unit || ""}</span></p>`
			: "";

		const features = (plan.featuresCard || [])
			.map(
				(t) => `
        <p class="flex span-2">
          <img style="width:20px;height:28px;margin-right:8px" src="${icons.tick}" />
          ${t}
        </p>`,
			)
			.join("");

		const heading = plan.featuresCardHeading
			? `<p class="span-2-semibold">${plan.featuresCardHeading}</p>`
			: "";

		const primaryBorder = plan.id === "none" ? "pricing-card--border" : "";

		return `
    <div class="pricing-card-2 gap-5 md:gap-7 w-full md:w-1/2 xl:w-1/3 flex-shrink-0 ${primaryBorder}">
      <div class="flex flex-col md:gap-7">
        <div class="flex items-center">${
					plan.id === "none"
						? `<p class="title-1">${plan.name}</p>${badge}`
						: `<p class="title-1">${plan.name}</p>`
				}</div>
        ${price}
      </div>

      <a href="${plan.cta?.href || "#"}" class="button-full-width py-2">${
			plan.cta?.label || "Learn more"
		}</a>
      <div class="flex flex-col gap-4">
        ${heading}
        ${features}
      </div>
    </div>`;
	};

	const dots = plans
		.map(
			(_, i) =>
				`<span class="dot w-4 h-4 rounded-full disable-button-color" data-dot="${i}"></span>`,
		)
		.join("");

	container.innerHTML = `
    <div class="pricing-cards-container" style="background-color:#ecfdff">
      <p class="title-40 mb-6">Pick the plan that works best for you</p>
      <p class="description-2" style="color:#3d3d3d">Start for free to experience our impactful features. Upgrade for unlimited access to HeyHi's full features.</p>

      <div id="slider-container" class="mt-6 lg:mt-16 flex gap-4 xl:gap-2 overflow-scroll">
        ${plans.map(cardHtml).join("")}
      </div>

      <div class="flex space-x-4 justify-center mt-12 xl:hidden">
        ${dots}
      </div>
    </div>
  `;

	// Mobile dots active state based on scroll
	const scroller = q("#slider-container", container);
	const dotEls = qa("[data-dot]", container);
	const updateDots = () => {
		const cardW =
			scroller.firstElementChild?.getBoundingClientRect().width || 1;
		const idx = Math.round(scroller.scrollLeft / (cardW + 16)); // 16 ~ gap
		dotEls.forEach((d, i) =>
			d.classList.toggle("active-button-color", i === idx),
		);
	};
	scroller?.addEventListener("scroll", updateDots, { passive: true });
	updateDots();
}

/* ------------------ RENDER: COMPARE TABLE ------------------ */
function renderCompare(container, data) {
	const { plans, compare, icons } = data;

	// Map theo id để cập nhật CTA khi đổi cột ở mobile
	const planById = Object.fromEntries((plans || []).map((p) => [p.id, p]));

	const headerCell = (p) => `
    <th class="border-b-2 border-gray-300 px-4 hidden lg:table-cell">
      <div class="flex flex-col gap-4 items-start lg:mb-20">
        <p class="quicksand-20">${p.name}</p>
        <p class="description-14">${
					fmtPrice(p.price) ? `${fmtPrice(p.price)}${p.price.unit || ""}` : ""
				}</p>
        <a href="${p.cta?.href || "#"}"
           class="button-outline-nobg"
           style="padding:4px 8px;font-size:14px${
							p.cta?.variant === "primary"
								? ";color:white;background-color:#0d719a"
								: ""
						}">${p.cta?.label || "Learn more"}</a>
      </div>
    </th>`;

	const boolCell = (val) =>
		val === true || val === "true"
			? `<img src="${icons.tickBlue}" />`
			: `<img src="${icons.notTickBlue}" />`;

	// NEW: chuẩn hoá hiển thị theo type trong JSON
	function cellContentByType(type, value) {
		const t = (type || "text").toLowerCase();
		if (t === "bool") return boolCell(!!value);
		if (t === "number") return value ?? "";
		return value ?? "";
	}

	const td = (content, planId, hiddenOnMobile = true) =>
		`<td class="px-0 flex justify-center lg:justify-start md:px-4 py-2 description-16--primary-color ${
			hiddenOnMobile ? "hidden lg:table-cell" : "lg:table-cell"
		}" data-column="${planId}">${content}</td>`;

	const sectionHeaderRow = (title) => `
    <tr>
      <td class="px-0 md:px-4 py-2 description-2" style="font-weight:600;color:#3d3d3d">${title}</td>
      ${(plans || [])
				.map(
					(p, i) =>
						`<td class="px-0 md:px-4 py-2 ${
							i === 0 ? "" : "hidden"
						} lg:table-cell" data-column="${p.id}"></td>`,
				)
				.join("")}
    </tr>`;

	const rowsHtml = (compare?.sections || [])
		.map((sec) => {
			const head = sectionHeaderRow(sec.title);
			const rows = (sec.rows || [])
				.map((r) => {
					const labelCell = `
            <td class="px-0 md:px-4 lg:pl-10 py-2 description-16--3d3d3d-color">
              <p class="dotted-text">${r.label}</p>
            </td>`;

					const cells = (plans || [])
						.map((p, i) => {
							// an toàn khi thiếu key: để trống cell
							const rawVal =
								r.values && Object.prototype.hasOwnProperty.call(r.values, p.id)
									? r.values[p.id]
									: null;
							const content = cellContentByType(r.type, rawVal);
							// Cột đầu hiển thị trên mobile; cột còn lại ẩn trên mobile
							return td(content, p.id, i !== 0);
						})
						.join("");

					return `<tr>${labelCell}${cells}</tr>`;
				})
				.join("");

			return head + rows;
		})
		.join("");

	container.innerHTML = `
    <div class="compare-feature-container">
      <!-- Mobile controls -->
      <div class="flex lg:hidden">
        <div class="w-1/2 md:ml-4">
          <div class="mb-4 w-fit">
            <div class="relative">
              <select id="column-select"
                      class="block w-full rounded-md pl-4 pr-6 border-gray-300 border-2 focus:border-indigo-500 focus:ring-indigo-500 appearance-none"
                      style="font-family:'Lexend Deca';height:40px">
                ${(plans || [])
									.map(
										(p) =>
											`<option value="${p.id}">${p.name}${
												fmtPrice(p.price)
													? ` - ${fmtPrice(p.price)}${p.price.unit || ""}`
													: ""
											}</option>`,
									)
									.join("")}
              </select>
              <span class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                <img src="${icons.dropdown}" />
              </span>
            </div>
          </div>
        </div>
        <div class="w-1/2 flex justify-end md:justify-center">
          <button id="button-started" class="button-outline-nobg" style="padding:4px 8px;font-size:14px;height:40px">
            <a id="link-started" href="${plans?.[0]?.cta?.href || "#"}">${
		plans?.[0]?.cta?.label || "Get Started"
	}</a>
          </button>
        </div>
      </div>

      <table class="table-auto w-full">
        <thead>
          <tr>
            <th class="border-b-2 border-gray-300 quicksand-24 px-4 flex justify-start hidden lg:table-cell" style="color:#3d3d3d;padding-bottom:130px">
              <div style="max-width:300px;text-wrap:wrap;text-align:left">Compare plans &amp; features</div>
            </th>
            ${(plans || []).map(headerCell).join("")}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

	// Mobile: switch visible column + update CTA
	const selectEl = q("#column-select", container);
	const linkEl = q("#link-started", container);
	const btnEl = q("#button-started", container);

	function applyMobileColumn(colId) {
		qa("[data-column]", container).forEach((td) => {
			const id = td.getAttribute("data-column");
			if (window.matchMedia("(min-width: 1024px)").matches) {
				// desktop: luôn hiện (bị Tailwind điều khiển)
				td.classList.remove("hidden");
				td.classList.add("lg:table-cell");
			} else {
				// mobile: chỉ hiện cột được chọn
				if (id === colId) {
					td.classList.remove("hidden");
				} else {
					td.classList.add("hidden");
				}
			}
		});

		const p = planById[colId] || plans?.[0];
		if (p) {
			linkEl.setAttribute("href", p.cta?.href || "#");
			linkEl.textContent = p.cta?.label || "Get Started";
			// đổi style nếu là contact sales (nếu có)
			if (p.cta?.variant === "primary") {
				btnEl.style.backgroundColor = "#0d719a";
				btnEl.style.color = "white";
			} else {
				btnEl.style.backgroundColor = "";
				btnEl.style.color = "";
			}
		}
	}

	selectEl?.addEventListener("change", (e) =>
		applyMobileColumn(e.target.value),
	);
	applyMobileColumn(selectEl?.value || plans?.[0]?.id);

	// Khi resize qua lại mobile/desktop, cập nhật hiển thị
	window.addEventListener("resize", () =>
		applyMobileColumn(selectEl?.value || plans?.[0]?.id),
	);
}

/* ------------------ BOOT ------------------ */
document.addEventListener("DOMContentLoaded", async () => {
	// Gom tất cả container cần render + load JSON 1 lần / nguồn
	const targets = qa("[data-component]");
	// nhóm theo data-src để tối ưu fetch
	const bySrc = new Map();
	targets.forEach((el) => {
		const src = el.getAttribute("data-src") || "";
		if (!bySrc.has(src)) bySrc.set(src, []);
		bySrc.get(src).push(el);
	});

	for (const [src, els] of bySrc.entries()) {
		try {
			const data = await loadJSON(src);
			els.forEach((el) => {
				const type = el.getAttribute("data-component");
				if (type === "pricing-cards") renderPricingCards(el, data);
				if (type === "pricing-compare") renderCompare(el, data);
			});
		} catch (e) {
			els.forEach(
				(el) =>
					(el.innerHTML = `<div style="padding:16px;border:1px dashed #ccc;border-radius:8px">Failed to load pricing data.</div>`),
			);
			console.error(e);
		}
	}
});
