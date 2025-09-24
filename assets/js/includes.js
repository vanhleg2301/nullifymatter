if (!window.__includesLoaded) {
	window.__includesLoaded = true;

	(function () {
		// ----- helper: thêm tiền tố scope vào selector CSS (đủ tốt cho đa số rule thường) -----
		function scopeCss(css, scope) {
			const block = (s) =>
				s
					.split(",")
					.map((x) => {
						x = x.trim();
						if (!x || x.startsWith("@") || /^(:root|from|to|\d+%)/.test(x))
							return x;
						return `${scope} ${x}`;
					})
					.join(", ");
			// @media
			css = css.replace(/@media[^{]+\{([\s\S]*?)\}\s*/g, (m) =>
				m.replace(/([^{}]+)\{/g, (all, sel) => `${block(sel)}{`),
			);
			// khối thường
			css = css.replace(/([^{}@]+)\{/g, (all, sel) => `${block(sel)}{`);
			return css;
		}

		// ----- di chuyển <link/style data-head> từ partial lên <head> -----
		async function injectHeadAssets(container) {
			// 1) link scoped
			const scopedLinks = container.querySelectorAll(
				'link[rel="stylesheet"][data-head][data-scope]',
			);
			for (const link of scopedLinks) {
				const href = link.getAttribute("href");
				const scope = link.getAttribute("data-scope");
				try {
					const res = await fetch(href, { cache: "no-cache" });
					const css = await res.text();
					const style = document.createElement("style");
					style.setAttribute("data-injected", "scoped");
					style.textContent = scopeCss(css, scope);
					document.head.appendChild(style);
				} catch (e) {
					console.warn("Scope CSS failed:", href, e);
				}
				link.remove(); // không để nó áp dụng global
			}

			// 2) link thường (KHÔNG scope) – chỉ thêm nếu chưa có
			container
				.querySelectorAll('link[rel="stylesheet"][data-head]:not([data-scope])')
				.forEach((link) => {
					const href = link.getAttribute("href");
					if (!href) return;
					if (
						!document.head.querySelector(
							`link[rel="stylesheet"][href="${href}"]`,
						)
					) {
						document.head.appendChild(link.cloneNode(true));
					}
					link.remove();
				});

			// 3) preconnect / dns-prefetch … (đưa lên head, chống trùng)
			container
				.querySelectorAll(
					'link[rel="preconnect"][data-head],link[rel="dns-prefetch"][data-head]',
				)
				.forEach((link) => {
					const href = link.getAttribute("href");
					if (
						!document.head.querySelector(
							`link[rel="${link.rel}"][href="${href}"]`,
						)
					) {
						document.head.appendChild(link.cloneNode(true));
					}
					link.remove();
				});

			// 4) style inline cho header
			container.querySelectorAll("style[data-head]").forEach((s) => {
				const marker = s.textContent.trim().slice(0, 120);
				const dup = Array.from(
					document.head.querySelectorAll("style[data-inline-head]"),
				).some((x) => x.textContent.trim().slice(0, 120) === marker);
				if (!dup) {
					const n = document.createElement("style");
					n.setAttribute("data-inline-head", "1");
					n.textContent = s.textContent;
					document.head.appendChild(n);
				}
				s.remove();
			});
		}

		async function include(el) {
			const url = el.getAttribute("data-include");
			if (!url) return;
			try {
				const res = await fetch(url, { cache: "no-cache" });
				if (!res.ok) throw new Error(res.status + " " + res.statusText);
				const html = await res.text();

				// parse HTML partial
				const tmp = document.createElement("div");
				tmp.innerHTML = html;

				// đưa asset được đánh dấu data-head lên <head>
				await injectHeadAssets(tmp);

				// thay placeholder bằng markup còn lại
				const frag = document.createDocumentFragment();
				while (tmp.firstChild) frag.appendChild(tmp.firstChild);
				el.replaceWith(frag);

				// đánh dấu link active
				const norm = (p) => {
					if (!p) return "/";
					p = p.replace(/\/index\.html?$/i, "");
					if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
					return p || "/";
				};
				const path = norm(location.pathname);
				document.querySelectorAll(".navbar a.nav-link").forEach((a) => {
					const href = norm(a.getAttribute("href") || "#");
					if (href === path) a.classList.add("active");
				});

				// xử lý include lồng
				document.querySelectorAll("[data-include]").forEach((n) => {
					if (n !== el) include(n);
				});
			} catch (e) {
				console.error("Include failed:", url, e);
			}
		}

		document.addEventListener("DOMContentLoaded", () => {
			document.querySelectorAll("[data-include]").forEach(include);
		});
	})();
}
