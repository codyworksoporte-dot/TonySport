"use client";

import { useId, type ReactNode } from "react";
import { DEFAULT_ELEMENTS, type TemplateElements } from "@/lib/studio";

export type JerseyProps = {
  color?: string;
  accent?: string;
  name?: string;
  number?: string;
  back?: boolean;
  variant?: "scales" | "stripe" | "clean";
  collar?: "v" | "round" | "chinese" | "polo";
  sleeve?: "short" | "long";
  hideFrontPrint?: boolean;
  elements?: Partial<TemplateElements>;
  artwork?: ReactNode;
  interaction?: ReactNode;
  interactive?: boolean;
  className?: string;
};

/** Original garment artwork. This is a design preview, not a product photograph. */
export default function Jersey({
  color = "#64fa18",
  accent = "#111811",
  name = "TONY",
  number = "10",
  back = false,
  variant = "clean",
  collar = "v",
  sleeve = "short",
  hideFrontPrint = false,
  elements,
  artwork,
  interaction,
  interactive = false,
  className,
}: JerseyProps) {
  const visible = { ...DEFAULT_ELEMENTS, ...elements };
  const uid = useId().replace(/:/g, "");
  const id = (part: string) => `jersey-${uid}-${part}`;
  const silhouette = sleeve === "long"
    ? "M180 72C154 82 120 86 100 103C76 132 48 259 22 350L75 373 133 194C133 254 126 394 123 480C154 495 200 503 239 503C279 503 326 495 357 480C354 392 347 256 347 194L405 373 458 350C432 259 404 132 380 103C360 86 326 82 300 72C282 82 262 87 240 87C218 87 198 82 180 72Z"
    : "M180 72 C164 78 148 84 126 91 L100 103 C88 116 63 153 39 190 L103 234 L133 194 C133 254 126 394 123 480 C154 495 200 503 239 503 C279 503 326 495 357 480 C354 392 347 256 347 194 L377 234 L441 190 C417 153 392 116 380 103 L354 91 C332 84 316 78 300 72 C282 82 262 87 240 87 C218 87 198 82 180 72 Z";

  return (
    <svg
      className={className}
      viewBox="0 0 480 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={interactive ? "group" : "img"}
      data-studio-artwork={artwork !== undefined ? "" : undefined}
      data-studio-side={artwork !== undefined ? (back ? "back" : "front") : undefined}
      aria-labelledby={id("title")}
    >
      <title id={id("title")}>{`${back ? "Espalda" : "Frente"} de jersey de muestra ${name}`}</title>
      <defs>
        <clipPath id={id("body")}><path d={silhouette} /></clipPath>
        <linearGradient id={id("light")} x1="124" y1="100" x2="348" y2="472" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity=".2" />
          <stop offset=".28" stopColor="white" stopOpacity=".03" />
          <stop offset=".67" stopColor="#102b0c" stopOpacity=".11" />
          <stop offset="1" stopColor="#001500" stopOpacity=".36" />
        </linearGradient>
        <linearGradient id={id("fold")}>
          <stop stopColor="#051000" stopOpacity="0" />
          <stop offset=".35" stopColor="#021300" stopOpacity=".22" />
          <stop offset=".53" stopColor="#ecffdc" stopOpacity=".22" />
          <stop offset=".72" stopColor="#051000" stopOpacity=".01" />
          <stop offset="1" stopColor="#041000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("sleeve")} x1="114" y1="129" x2="62" y2="205" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4ffe9" stopOpacity=".08" />
          <stop offset=".78" stopColor="#021000" stopOpacity="0" />
          <stop offset="1" stopColor="#000b00" stopOpacity=".48" />
        </linearGradient>
        <linearGradient id={id("sleeve-right")} x1="366" y1="129" x2="418" y2="205" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4ffe9" stopOpacity=".08" />
          <stop offset=".78" stopColor="#021000" stopOpacity="0" />
          <stop offset="1" stopColor="#000b00" stopOpacity=".48" />
        </linearGradient>
        <linearGradient id={id("collar")} x1="240" y1="66" x2="240" y2="126" gradientUnits="userSpaceOnUse">
          <stop stopColor="#050b05" />
          <stop offset=".5" stopColor="#233124" />
          <stop offset="1" stopColor="#071008" />
        </linearGradient>
        <linearGradient id={id("hem")} x1="240" y1="466" x2="240" y2="504" gradientUnits="userSpaceOnUse">
          <stop stopColor="#020a02" stopOpacity="0" />
          <stop offset=".63" stopColor="#102310" stopOpacity=".16" />
          <stop offset="1" stopColor="#001000" stopOpacity=".42" />
        </linearGradient>
        <pattern id={id("mesh")} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 .5H4M.5 0V4" stroke="#091c06" strokeWidth=".45" opacity=".2" />
          <path d="M2 1V2" stroke="white" strokeWidth=".55" opacity=".3" />
        </pattern>
        <pattern id={id("scales")} width="32" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(-4)">
          <path d="M-16 0 Q0 1 0 14 Q0 1 16 0 Q32 1 32 14 Q32 1 48 0 M0 14 Q16 15 16 28 Q16 15 32 14" stroke={accent} strokeWidth="1.2" opacity=".32" />
          <path d="M-14 2 Q-2 3-2 13 M18 2 Q30 3 30 13 M2 16 Q14 17 14 27" stroke="#f0ffe5" strokeWidth=".75" opacity=".22" />
          <path d="M0 2L2 5 0 8-2 5Z M16 16L18 19 16 22 14 19Z" fill={accent} opacity=".12" />
        </pattern>
        <pattern id={id("ribs")} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <path d="M0 0V3" stroke="white" strokeWidth=".6" opacity=".14" />
        </pattern>
        <filter id={id("shadow")} x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="17" stdDeviation="18" floodColor="#000" floodOpacity=".48" />
        </filter>
      </defs>

      <g filter={`url(#${id("shadow")})`} pointerEvents="none">
        <path d={silhouette} fill={color} />
        <g clipPath={`url(#${id("body")})`}>
          {visible.pattern && variant === "scales" && <path data-template-element="pattern" d={silhouette} fill={`url(#${id("scales")})`} />}
          {visible.pattern && variant === "stripe" && (
            <g data-template-element="pattern" fill={accent} opacity=".92">
              <path d="M38 75H118L316 509H236Z" />
              <path d="M129 75H141L339 509H327Z" />
              <path d="M16 75H26L224 509H214Z" />
            </g>
          )}

          {/* Woven shoulder panels and curved, inset side seams. */}
          {visible.trim && <g data-template-element="trim">
          <path d="M121 93L180 71 198 83 120 114 52 203 36 190 98 104Z" fill={accent} />
          <path d="M359 93L300 71 282 83 360 114 428 203 444 190 382 104Z" fill={accent} />
          <path d="M130 186Q159 263 142 390L138 489 120 481Z" fill={accent} opacity=".88" />
          <path d="M350 186Q321 263 338 390L342 489 360 481Z" fill={accent} opacity=".88" />
          <path d="M141 223Q153 320 145 425" stroke={color} strokeWidth="1.3" opacity=".7" />
          <path d="M339 223Q327 320 335 425" stroke={color} strokeWidth="1.3" opacity=".7" />
          </g>}

          <g pointerEvents="all">{artwork}</g>

          {sleeve === "short" && <>
            <path d="M120 112Q120 155 133 194L105 235 38 191Z" fill={`url(#${id("sleeve")})`} />
            <path d="M360 112Q360 155 347 194L375 235 442 191Z" fill={`url(#${id("sleeve-right")})`} />
          </>}
          <path d={silhouette} fill={`url(#${id("light")})`} />
          <path d={silhouette} fill={`url(#${id("mesh")})`} />

          {/* Long tonal folds keep the shirt dimensional at every size. */}
          <path d="M172 106Q189 211 171 306Q155 405 167 497H209Q177 403 193 304Q205 196 187 99Z" fill={`url(#${id("fold")})`} />
          <path d="M304 114Q277 197 302 300Q320 397 298 497H324Q342 397 318 296Q293 188 324 108Z" fill={`url(#${id("fold")})`} />
          <path d="M222 329Q211 423 224 504H252Q227 421 248 329Z" fill={`url(#${id("fold")})`} opacity=".5" />
          <path d="M128 443Q171 462 212 455M286 477Q326 474 355 464" stroke="#efffde" strokeOpacity=".13" strokeWidth="3" />
          <path d="M138 425Q165 436 185 434" stroke="#041500" strokeOpacity=".13" strokeWidth="2" />
          <path d="M348 237Q325 263 311 298" stroke="#001100" strokeOpacity=".13" strokeWidth="2" />

          {visible.trim && (sleeve === "short" ? <>
          <path d="M36 182L111 225 104 237 29 193Z" fill={accent} />
          <path d="M444 182L369 225 376 237 451 193Z" fill={accent} />
          <path d="M36 182L111 225 104 237 29 193ZM444 182L369 225 376 237 451 193Z" fill={`url(#${id("ribs")})`} />
          <path d="M42 185L110 224M438 185L370 224" stroke={color} strokeWidth="1.2" opacity=".7" />
          </> : <>
            <path d="M20 335L84 358 76 376 16 353ZM460 335L396 358 404 376 464 353Z" fill={accent}/>
            <path d="M33 348L73 363M447 348L407 363" stroke={color} strokeWidth="2" opacity=".6"/>
            <path d="M98 117L41 334M382 117L439 334" stroke={accent} strokeWidth="2" opacity=".4"/>
          </>)}
          <path d="M121 464Q240 494 359 464V511H121Z" fill={`url(#${id("hem")})`} />
          <path d="M125 480Q239 516 355 480" stroke={accent} strokeOpacity=".45" strokeWidth="1" />
          <path d="M127 476Q239 510 353 476" stroke={accent} strokeOpacity=".4" strokeWidth=".7" strokeDasharray="2 2" />
          <path d="M119 115Q119 158 133 194M361 115Q361 158 347 194" stroke={accent} strokeWidth="1" strokeOpacity=".36" />
          <path d="M122 115Q122 158 136 191M358 115Q358 158 344 191" stroke="#efffde" strokeWidth=".75" strokeOpacity=".28" strokeDasharray="2 2" />
        </g>

        {back ? (
          <>
            <path d="M179 72Q240 93 301 72L298 90Q240 115 182 90Z" fill={`url(#${id("collar")})`} />
            <path d="M186 78Q240 98 294 78" stroke={color} strokeOpacity=".7" strokeWidth="1.3" />
            <path d="M144 147Q240 166 336 147" stroke={accent} strokeOpacity=".3" />
            {visible.playerName && <text data-template-element="playerName" x="240" y="207" textAnchor="middle" fill={accent} fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize={name.length > 12 ? 27 : 34} fontWeight="900" letterSpacing="1" textLength={name.length > 6 ? 190 : undefined} lengthAdjust="spacingAndGlyphs">{name.toUpperCase()}</text>}
            {visible.playerNumber && <text data-template-element="playerNumber" x="240" y="383" textAnchor="middle" fill={accent} fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize="176" fontWeight="900" letterSpacing="-5">{number}</text>}
            {visible.brand && <text data-template-element="brand" x="240" y="442" textAnchor="middle" fill={accent} fontFamily="Arial, sans-serif" fontSize="10" fontWeight="800" letterSpacing="4">TONY SPORTSWEAR</text>}
          </>
        ) : (
          <>
            {collar === "v" ? <>
            {/* A layered V neck: interior binding, ribbed collar, and top stitch. */}
            <path d="M180 72Q240 99 300 72L281 89 240 126 199 89Z" fill={accent} />
            <path d="M198 82Q240 96 282 82L240 112Z" fill="#070d07" />
            <path d="M180 72L240 120 300 72 292 91 240 137 188 91Z" fill={`url(#${id("collar")})`} />
            <path d="M180 72L240 120 300 72 292 91 240 137 188 91Z" fill={`url(#${id("ribs")})`} />
            <path d="M185 81L240 128 295 81" stroke={color} strokeWidth="1.6" opacity=".75" />
            {visible.brand && <g data-template-element="brand"><path d="M231 91H249V99H231Z" fill="#f5f7e9" opacity=".75" />
            <text x="240" y="97" textAnchor="middle" fill="#101710" fontFamily="Arial, sans-serif" fontSize="4.5" fontWeight="900">TONY</text></g>}
            </> : collar === "round" ? <>
              <path d="M180 72Q240 91 300 72Q286 139 240 139Q194 139 180 72Z" fill={accent}/>
              <path d="M194 77Q240 91 286 77Q277 118 240 118Q203 118 194 77Z" fill="#112218"/>
              <path d="M187 78Q199 132 240 132Q281 132 293 78" stroke={color} strokeWidth="2" opacity=".65"/>
            </> : collar === "chinese" ? <>
              <path d="M180 73L182 55Q240 77 298 55L300 73 265 114H215Z" fill={accent}/>
              <path d="M191 65Q240 85 289 65L258 99H222Z" fill="#112218"/>
              <path d="M233 91H247V140H233Z" fill={accent}/>
              <circle cx="240" cy="116" r="2" fill={color}/>
            </> : <>
              <path d="M180 72L185 52Q240 75 295 52L300 72 273 133 242 105 208 133Z" fill={accent}/>
              <path d="M199 65Q240 80 281 65L241 106Z" fill="#112218"/>
              <path d="M233 104H248V159H233Z" fill={accent}/>
              <circle cx="240" cy="128" r="2" fill={color}/><circle cx="240" cy="146" r="2" fill={color}/>
              <path d="M184 62L207 119 238 99M296 62L273 119 244 99" stroke={color} strokeOpacity=".65"/>
            </>}

            {/* Original abstract speed mark and TONY typographic crest. */}
            {visible.brand && <g data-template-element="brand" fill={accent} transform="translate(171 171) rotate(-10)">
              <path d="M-10 1L8-8 12-3-6 6Z" />
              <path d="M-8 11L3 5 7 10-4 16Z" />
            </g>}
            {!hideFrontPrint && <>{visible.brand && <g data-template-element="brand" transform="translate(302 171)">
              <path d="M-21-15Q0-23 21-15L18 14 0 24-18 14Z" fill={accent} />
              <path d="M-18-13Q0-19 18-13L15 12 0 20-15 12Z" stroke={color} strokeWidth="1" />
              <text x="0" y="5" textAnchor="middle" fill={color} fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize="15" fontWeight="900">TONY</text>
              <path d="M-9 10H9" stroke={color} strokeWidth="1" />
            </g>}
            {visible.teamName && (visible.brand || name !== "TONY") && <text data-template-element="teamName" x="240" y="283" textAnchor="middle" fill={accent} fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize={name.length > 6 ? 42 : 66} fontWeight="900" letterSpacing={name.length > 6 ? ".5" : "-1"} textLength={name.length > 4 ? 204 : undefined} lengthAdjust="spacingAndGlyphs">{name.toUpperCase()}</text>}
            {visible.brand && <text data-template-element="brand" x="240" y="303" textAnchor="middle" fill={accent} opacity=".82" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="800" letterSpacing="4">SPORTSWEAR</text>}
            </>}
            {hideFrontPrint && visible.teamName && name && <text data-template-element="teamName" x="240" y="220" textAnchor="middle" fill={accent} fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize="27" fontWeight="900" letterSpacing=".8" textLength={name.length > 6 ? 180 : undefined} lengthAdjust="spacingAndGlyphs">{name.toUpperCase()}</text>}
          </>
        )}

        {visible.brand && <g data-template-element="brand" transform="translate(157 464) rotate(5)">
          <rect width="27" height="14" rx="1" fill="#101a11" />
          <rect x="2" y="2" width="23" height="10" rx=".5" stroke="#a0a898" strokeWidth=".5" />
          <text x="13.5" y="9.5" textAnchor="middle" fill="#dce8d2" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="800">TONY</text>
        </g>}
        <path d={silhouette} stroke="#d3efb6" strokeOpacity=".14" strokeWidth=".9" />
      </g>
      {interaction}
    </svg>
  );
}
