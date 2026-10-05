// Original title decorations. SVG paths keep the central letter independent of
// the Japanese font metrics installed on iPad, Android and desktop browsers.
const svg = (body, box = "0 0 120 120") =>
  `<svg viewBox="${box}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
export function homeLetter(paths) {
  return svg(
    `<g fill="none" stroke="currentColor" stroke-width="29" stroke-linecap="round" stroke-linejoin="round">${paths.map((d) => `<path d="${d}"/>`).join("")}</g>`,
    "20 10 350 370",
  );
}
export function homeSun() {
  return `<div class="home-sun" aria-hidden="true">${svg(`<g stroke="#ffe177" stroke-width="5" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => `<path d="M60 5v8" transform="rotate(${i * 30} 60 60)"/>`).join("")}</g><circle cx="60" cy="60" r="35" fill="#ffdc64"/><circle cx="49" cy="55" r="4" fill="#795633"/><circle cx="72" cy="55" r="4" fill="#795633"/><path d="M51 69q10 12 20 0" fill="none" stroke="#795633" stroke-width="4" stroke-linecap="round"/><circle cx="39" cy="65" r="6" fill="#ffbe74"/><circle cx="81" cy="65" r="6" fill="#ffbe74"/>`)}</div>`;
}
export function homeParty() {
  return `<div class="home-party" aria-hidden="true"><div class="party-flags">${svg('<path d="M4 10Q140 62 276 10" fill="none" stroke="#fff8db" stroke-width="4"/><path d="m24 19 36 11-25 30Z" fill="#ffae74"/><path d="m78 33 36 6-20 32Z" fill="#7bcbe8"/><path d="m136 41 36-2-17 34Z" fill="#ffdf74"/><path d="m194 34 36-8-9 34Z" fill="#ee98bb"/>', "0 0 280 84")}</div><div class="party-duck">${svg('<ellipse cx="58" cy="108" rx="47" ry="6" fill="#648b7133"/><path d="M13 78q15-20 48-12l8-34q7-18 24-11t13 24L88 66q13 30-24 39T13 78Z" fill="#fff9de" stroke="#e6c674" stroke-width="3"/><path d="m101 34 16 9-18 5" fill="#ffae56"/><circle cx="94" cy="32" r="3" fill="#684d34"/><path d="M37 81q14-14 34-2-8 19-29 13" fill="#ffda70"/><path d="M29 107h12m25-1h12" stroke="#ffad5c" stroke-width="5" stroke-linecap="round"/>')}</div><div class="party-butterfly">${svg('<path d="M60 56C14-8-12 59 43 63C-1 97 39 124 60 72C81 124 121 97 77 63C132 59 106-8 60 56Z" fill="#f6a1be" stroke="#fff7dc" stroke-width="4"/><path d="M60 53v25m-2-23-11-13m16 13 11-13" stroke="#836791" stroke-width="5" stroke-linecap="round"/><circle cx="29" cy="45" r="8" fill="#ffe077"/><circle cx="92" cy="45" r="8" fill="#ffe077"/>')}</div><div class="party-blocks">${svg('<path d="m12 63 32-17 31 16-32 18Z" fill="#96dded"/><path d="M12 63v32l31 18V80Z" fill="#48b9df"/><path d="M43 80v33l32-17V62Z" fill="#279dc5"/><path d="m61 57 25-13 25 13-25 14Z" fill="#c5e78c"/><path d="M61 57v31l25 14V71Z" fill="#90c85e"/><path d="M86 71v31l25-14V57Z" fill="#6eae46"/><path d="m43 17 25-14 25 14-25 14Z" fill="#ffe397"/><path d="M43 17v31l25 14V31Z" fill="#ffc456"/><path d="M68 31v31l25-14V17Z" fill="#eba544"/>')}</div></div>`;
}
