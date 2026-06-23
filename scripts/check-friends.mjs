#!/usr/bin/env node
/**
 * check-friends.mjs — Health-check every friend link in friends.md.
 *
 * For each active (non-commented) `href` in the `friends:` frontmatter block of
 * src/content/pages/friends.md, this script:
 *   1. Fetches the URL (follows redirects, browser-like UA, per-request timeout).
 *   2. Classifies the HTTP outcome:
 *        OK    — 2xx and no parking/sale/placeholder/spam signature in the body.
 *        SPAM  — domain squatted by a black-hat actor: page stuffed with
 *                gambling/adult/grey-market content (黑灰产抢注页).
 *        SOLD  — body matches a domain-parking / "for sale" / broker signature,
 *                or the request landed on a known domain-parking/broker host
 *                (域名被域名商持有、挂高价停放/出售页).
 *        WARN  — reachable but non-2xx (403/404/5xx), placeholder/"coming soon"
 *                page, unusual redirect, or an empty/too-small body.
 *        DEAD  — DNS failure / connection refused / TLS error / timeout.
 *   3. For DEAD links, runs a native WHOIS lookup (port 43) to confirm whether
 *      the domain is still registered:
 *        whois=available  — 域名已无注册记录（可被重新注册，建议移除友链）
 *        whois=registered — 域名仍在注册中（站点只是暂时宕机/迁移）
 *        whois=unknown    — WHOIS 无定论（服务器限流/格式未识别）
 *   4. For DEAD links (still registered) and inconclusive WARN links (blocked /
 *      empty / placeholder), probes HTTP (port 80) and the apex/www domain —
 *      a subdomain whose apex is squatted (SPAM) or parked (SOLD) is upgraded.
 *
 * Content checks (spam / for-sale / parking) run on EVERY reachable response,
 * including healthy 2xx pages — a still-up friend domain may have been quietly
 * squatted. Bodies are decoded by their charset (Content-Type / <meta charset>),
 * so GBK/GB18030/Big5 Chinese spam pages are scanned correctly, and numeric
 * HTML entities are decoded before keyword matching. Requests use a full
 * current-Chrome header set (UA + Accept + Sec-Fetch); IP/region-based WAF
 * blocks (e.g. a 403 to datacenter IPs) still cannot be bypassed.
 *
 * Zero dependencies — Node >=18 (global fetch, AbortSignal.timeout,
 * node:net/https/http, ICU-backed TextDecoder for GBK/Big5).
 *
 * Usage:
 *   node scripts/check-friends.mjs                 # check all (+ whois & probe)
 *   node scripts/check-friends.mjs --json          # machine-readable output
 *   node scripts/check-friends.mjs --no-whois      # skip the WHOIS pass
 *   node scripts/check-friends.mjs --no-probe      # skip HTTP/apex fallback probe
 *   node scripts/check-friends.mjs --timeout 20000 # per-request HTTP timeout (ms)
 *   node scripts/check-friends.mjs --concurrency 4
 *
 * Exit code: 0 if every link is OK, 1 if any SPAM/SOLD/WARN/DEAD found.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import https from "node:https";
import http from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRIENDS_MD = join(
  __dirname,
  "..",
  "src",
  "content",
  "pages",
  "friends.md",
);

// ── CLI args ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const noWhois = argv.includes("--no-whois");
const noProbe = argv.includes("--no-probe");
function numArg(flag, fallback) {
  const i = argv.indexOf(flag);
  if (i !== -1 && argv[i + 1]) {
    const n = Number(argv[i + 1]);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}
const TIMEOUT_MS = numArg("--timeout", 15000);
const CONCURRENCY = numArg("--concurrency", 8);
const WHOIS_TIMEOUT_MS = numArg("--whois-timeout", 10000);

// A full, current-Chrome header set. WAFs that gate on a missing/odd UA or the
// absence of Sec-Fetch/Accept headers will serve real content (e.g. squatter
// sites that 403 a bare client). IP/region-based blocks still can't be bypassed.
// NB: no Accept-Encoding — node:http won't auto-decompress, so we ask for plain.
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9," +
    "image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
};

// ── Parking / "for sale" detection ───────────────────────────────────────────
// Hostnames that strongly indicate a parked / sold / brokered domain.
const PARKING_HOSTS = [
  "sedo.com",
  "sedoparking.com",
  "dan.com",
  "undeveloped.com",
  "afternic.com",
  "hugedomains.com",
  "parkingcrew.net",
  "parkingcrew.com",
  "bodis.com",
  "above.com",
  "parklogic.com",
  "uniregistry.com",
  "domainmarket.com",
  "namesilo.com",
  "voodoo.com",
  "cashparking.com",
  "fabulous.com",
  "skenzo.com",
  "smartname.com",
  "trafficz.com",
  "domainspot.com",
  "buydomains.com",
  "atom.com",
  "brandbucket.com",
  "saw.com",
  "sav.com",
  "epik.com",
  "internettraffic.com",
  "domainnameshop.com",
  "name.com",
  "godaddy.com", // GoDaddy parked landing (cashparking)
];

// Definitive for-sale / parked landing-page signatures (case-insensitive).
const STRONG_SALE_SIGNATURES = [
  "this domain is for sale",
  "this domain name is for sale",
  "the domain is for sale",
  "domain is for sale",
  "domain for sale",
  "buy this domain",
  "the owner of this domain",
  "this domain may be for sale",
  "domain may be for sale",
  "inquire about this domain",
  "the domain name you've entered is parked",
  "domain parking",
  "parked domain",
  "this domain is parked",
  "this webpage was generated by the domain owner",
  "purchase this domain",
  "buy now for",
  "interested in this domain",
  "get this domain",
  "the domain you are looking for is for sale",
  "is for sale!",
  "域名出售",
  "域名停放",
  "该域名待出售",
  "此域名正在出售",
  "这个域名可以出售",
  "域名正在出售",
  "购买此域名",
  "购买该域名",
  "该域名可能正在出售",
  "出售此域名",
  "本域名待售",
  "域名已被出售",
  "该域名已被注册并停放",
  "域名一口价",
  "域名竞价",
];

// Placeholder / default / under-construction landing pages → WARN (域名可能已
// 转手或未配置，但未明确挂售).
const PLACEHOLDER_SIGNATURES = [
  "future home of something",
  "coming soon",
  "website coming soon",
  "under construction",
  "site is under construction",
  "default web page",
  "apache2 ubuntu default page",
  "apache2 debian default page",
  "welcome to nginx",
  "iis windows server",
  "it works!",
  "建设中",
  "正在建设",
  "网站建设中",
  "默认页",
  "暂未开放",
  "本页面由系统自动生成",
];

function hostMatches(hostname, list) {
  const h = hostname.toLowerCase();
  return list.find((d) => h === d || h.endsWith("." + d));
}

function findSignature(body, list) {
  const lower = decodeEntities(body).toLowerCase();
  return list.find((s) => lower.includes(s.toLowerCase()));
}

/**
 * Decode numeric HTML entities (&#xHEX; and &#DEC;) so keyword scans see the
 * real text. Squatter pages routinely entity-encode their Chinese spam
 * (e.g. &#x6210;&#x4eba; → 成人) specifically to evade naive substring filters.
 */
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => fromCp(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => fromCp(parseInt(d, 10)));
}
function fromCp(cp) {
  try {
    return String.fromCodePoint(cp);
  } catch {
    return "";
  }
}

/** Normalise a charset label to one TextDecoder understands. */
function normalizeCharset(cs) {
  if (!cs) return "utf-8";
  const c = cs.trim().toLowerCase();
  if (c === "utf8" || c === "utf-8") return "utf-8";
  if (c === "gb2312" || c === "gb-2312" || c === "gbk") return "gbk";
  if (c === "gb18030") return "gb18030";
  if (c === "big5" || c === "big5-hkscs" || c === "cp950") return "big5";
  if (c === "euc-jp" || c === "shift_jis" || c === "sjis") return c;
  return c; // unknown → let TextDecoder try; decodeBody falls back to utf-8
}

/**
 * Decode a response body honouring its charset. Chinese spam/squatter sites are
 * frequently served as GBK/GB18030/Big5, not UTF-8 — decoding those as UTF-8
 * yields mojibake and keyword scans miss everything. Charset is taken from the
 * Content-Type header, else from a <meta charset> in the document head.
 */
function decodeBody(buf, contentType = "") {
  let charset = (/charset=["']?([\w-]+)/i.exec(contentType) || [])[1];
  if (!charset) {
    const head = buf.subarray(0, 4096).toString("latin1");
    charset =
      (/<meta[^>]+charset=["']?([\w-]+)/i.exec(head) || [])[1] ||
      (/<meta[^>]+content=["'][^"']*charset=([\w-]+)/i.exec(head) || [])[1];
  }
  const label = normalizeCharset(charset);
  try {
    return new TextDecoder(label).decode(buf);
  } catch {
    return buf.toString("utf8");
  }
}

/**
 * Detect a for-sale / broker landing page in the body.
 * Returns a human-readable reason, or null. Combines explicit signatures with
 * a price heuristic: a sale keyword + a currency-prefixed price on a SHORT page
 * (long articles that merely mention "buy" + a price are not flagged).
 */
function detectForSale(body) {
  const sig = findSignature(body, STRONG_SALE_SIGNATURES);
  if (sig) return `页面含出售/停放特征: "${sig}"`;

  const text = decodeEntities(body);
  const hasSaleWord =
    /\b(for sale|make an offer|buy now|purchase this|this domain)\b/i.test(
      text,
    ) || /(域名出售|一口价|域名竞价|购买域名|该域名)/.test(text);
  const priceMatch =
    text.match(/(?:\$|usd\s?|￥|¥|€|£)\s?[\d][\d,]{2,}(?:\.\d+)?/i) ||
    text.match(/[\d][\d,]{3,}\s?(?:usd|dollars|元|rmb)/i);
  if (hasSaleWord && priceMatch && text.trim().length < 8000) {
    return `疑似域名交易页（短页面含售价 "${priceMatch[0].trim()}" + 出售关键词，正文 ${body.trim().length} bytes）`;
  }
  return null;
}

// High-confidence black-hat / squatter content (赌博 / 色情 / 灰产). Squatted
// domains are typically stuffed with many of these; require ≥2 distinct hits to
// avoid flagging a legit page that merely mentions one term.
const SPAM_KEYWORDS = [
  // 赌博 / 博彩
  "博彩",
  "赌博",
  "赌场",
  "娱乐城",
  "时时彩",
  "六合彩",
  "幸运飞艇",
  "葡京",
  "威尼斯人",
  "太阳城",
  "真人荷官",
  "百家乐",
  "老虎机",
  "电子游艺",
  "现金网",
  "体育投注",
  "首存优惠",
  "注册送彩金",
  "菠菜",
  "bet365",
  "澳门金沙",
  "澳门威尼斯",
  // 色情
  "三级片",
  "成人电影",
  "成人视频",
  "av在线",
  "av天堂",
  "天堂网",
  "苍井空",
  "a片",
  "aa片",
  "无码",
  "国产精品",
  "亚洲精品",
  "巨乳",
  "乱伦",
  "自慰",
  "做爱",
  "情色",
  "裸聊",
  "一夜情",
  "约炮",
  "免费观看",
  "在线播放",
  "porn",
  "escort",
  "viagra",
  "cialis",
  // 灰产
  "传奇私服",
  "代孕",
  "代开发票",
  "办理证件",
  "外围女",
];

/**
 * Detect black-hat / squatter spam content (黑灰产抢注页面常充斥赌博/色情内容).
 * HTML entities are decoded first — squatter pages entity-encode their spam to
 * dodge naive substring filters. Returns a reason when ≥2 distinct keywords
 * match, else null.
 */
function detectSpam(body) {
  const lower = decodeEntities(body).toLowerCase();
  const hits = [];
  for (const k of SPAM_KEYWORDS) {
    if (lower.includes(k.toLowerCase())) hits.push(k);
    if (hits.length >= 6) break;
  }
  if (hits.length >= 2) {
    return `命中赌博/色情/灰产关键词 ×${hits.length}: ${hits.slice(0, 6).join("、")}`;
  }
  return null;
}

/**
 * Classify a fetched response body into a verdict + reason.
 * Shared by the normal fetch path and the insecure (ignore-TLS) refetch path,
 * so SOLD/parking detection is identical regardless of how the body was obtained.
 */
function classifyBody({ status, statusText = "", body, finalHost }) {
  const parkedHost = finalHost ? hostMatches(finalHost, PARKING_HOSTS) : null;
  if (parkedHost) {
    return {
      verdict: "SOLD",
      reason: `跳转至域名停放/交易商: ${parkedHost} (${finalHost})`,
    };
  }
  const saleReason = detectForSale(body);
  if (saleReason) return { verdict: "SOLD", reason: saleReason };

  // Content check applies to ALL responses (incl. 2xx) — a still-reachable
  // friend domain may have been quietly squatted and now serves spam.
  const spamReason = detectSpam(body);
  if (spamReason) return { verdict: "SPAM", reason: spamReason };

  if (status >= 200 && status < 300) {
    const placeholder = findSignature(body, PLACEHOLDER_SIGNATURES);
    if (placeholder) {
      return {
        verdict: "WARN",
        reason: `疑似占位/默认/建设中页面: "${placeholder}"（域名可能已转手或未配置）`,
      };
    }
    if (body.trim().length < 200) {
      return {
        verdict: "WARN",
        reason: `2xx 但页面内容过少 (${body.trim().length} bytes)`,
      };
    }
    return { verdict: "OK", reason: "可正常访问" };
  }
  return { verdict: "WARN", reason: `HTTP ${status} ${statusText}`.trim() };
}

/** True if a Node network error code denotes a TLS-certificate problem. */
function isCertError(code) {
  return (
    /CERT|SELF_SIGNED/.test(code) ||
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  );
}

/**
 * Plain GET via node:http/https with manual redirect following.
 * When `insecure` is true, TLS certificate validation is disabled
 * (rejectUnauthorized: false) — used to re-inspect a domain whose cert is
 * broken, in case the registrar/host is actually serving a parking page.
 * Returns { status, finalUrl, body }.
 */
function rawGet(url, { timeout, insecure, redirectsLeft = 5 }) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(url);
    } catch (err) {
      reject(err);
      return;
    }
    // Guarantee the promise always settles exactly once, even if the response
    // stream errors after headers (error emits on `res`, not `req`) — otherwise
    // the awaiting probe would hang forever ("unsettled top-level await").
    let settled = false;
    const done = (fn, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      fn(val);
    };
    const hardTimer = setTimeout(() => {
      req.destroy(new Error("timeout"));
      done(reject, new Error("hard timeout"));
    }, timeout + 1000);
    hardTimer.unref?.(); // don't keep the event loop alive on this timer alone

    const mod = u.protocol === "http:" ? http : https;
    const req = mod.get(
      url,
      {
        rejectUnauthorized: !insecure, // ignored by node:http
        headers: BROWSER_HEADERS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const loc = res.headers.location;
        if (status >= 300 && status < 400 && loc && redirectsLeft > 0) {
          res.resume(); // drain
          const next = new URL(loc, url).toString();
          rawGet(next, {
            timeout,
            insecure,
            redirectsLeft: redirectsLeft - 1,
          }).then(
            (v) => done(resolve, v),
            (e) => done(reject, e),
          );
          return;
        }
        const chunks = [];
        let size = 0;
        res.on("data", (c) => {
          size += c.length;
          if (size <= 400_000) chunks.push(c);
        });
        res.on("end", () =>
          done(resolve, {
            status,
            finalUrl: url,
            body: decodeBody(
              Buffer.concat(chunks),
              res.headers["content-type"],
            ),
          }),
        );
        res.on("error", (e) => done(reject, e)); // mid-body stream failure
      },
    );
    req.setTimeout(timeout, () => req.destroy(new Error("timeout")));
    req.on("error", (e) => done(reject, e));
  });
}

/**
 * Build fallback probe URLs for an unreachable link:
 *   1. HTTP (port 80) variant of the original — site may serve plain HTTP only.
 *   2. The registrable domain + its www. variant over both https and http —
 *      a dead subdomain (e.g. blog.example.cn) may have its apex squatted.
 * The exact original https URL is excluded (already tried in checkLink).
 */
function buildProbeUrls(href) {
  let u;
  try {
    u = new URL(href);
  } catch {
    return [];
  }
  const host = u.hostname;
  const apex = registrableDomain(host);
  const urls = new Set();

  if (u.protocol === "https:") urls.add(`http://${host}${u.pathname}`);
  for (const t of [apex, `www.${apex}`]) {
    if (t === host) continue; // apex == original host → its https already tried
    urls.add(`https://${t}/`);
    urls.add(`http://${t}/`);
  }
  urls.delete(href);
  return [...urls];
}

/**
 * Probe HTTP / apex / www fallbacks for an unreachable link and report the most
 * significant finding (priority: SPAM > SOLD > reachable). TLS validation is
 * relaxed so a squatter's broken-cert page is still inspected.
 * Returns { kind, url, finalUrl, status, reason } or null if nothing reachable.
 */
async function fallbackProbe(href) {
  const urls = buildProbeUrls(href);
  let reachable = null;
  for (const url of urls) {
    let r;
    try {
      r = await rawGet(url, { timeout: TIMEOUT_MS, insecure: true });
    } catch {
      continue; // this variant unreachable; try the next
    }
    if (!r || !r.status) continue;
    let finalHost = "";
    try {
      finalHost = new URL(r.finalUrl).hostname;
    } catch {
      /* ignore */
    }
    // classifyBody already runs spam + sale + parking detection on the body.
    const c = classifyBody({ status: r.status, body: r.body, finalHost });
    if (c.verdict === "SPAM" || c.verdict === "SOLD") {
      return {
        kind: c.verdict,
        url,
        finalUrl: r.finalUrl,
        status: r.status,
        reason: c.reason,
      };
    }
    if (!reachable && (c.verdict === "OK" || c.verdict === "WARN")) {
      reachable = {
        kind: c.verdict,
        url,
        finalUrl: r.finalUrl,
        status: r.status,
        reason: c.reason,
      };
    }
  }
  return reachable; // a merely-reachable variant, or null
}

// ── WHOIS (RFC 3912, port 43) ────────────────────────────────────────────────
/** Known multi-label public suffixes we must keep intact for the registrable domain. */
const MULTI_SUFFIXES = [
  "com.cn",
  "net.cn",
  "org.cn",
  "gov.cn",
  "edu.cn",
  "ac.cn",
  "co.uk",
  "org.uk",
  "co.jp",
  "com.tw",
  "com.hk",
];

/** Reduce a hostname to its registrable domain (eTLD+1), heuristically. */
function registrableDomain(hostname) {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  const labels = h.split(".");
  if (labels.length <= 2) return h;
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_SUFFIXES.includes(lastTwo)) return labels.slice(-3).join(".");
  return lastTwo;
}

/** Raw WHOIS query against a server on port 43. */
function whoisQuery(server, query, timeout = WHOIS_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(43, server);
    let data = "";
    socket.setTimeout(timeout);
    socket.on("connect", () => socket.write(query + "\r\n"));
    socket.on("data", (chunk) => (data += chunk.toString("utf8")));
    socket.on("end", () => resolve(data));
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("whois timeout"));
    });
    socket.on("error", reject);
  });
}

// Patterns meaning "no registration record" (domain is available).
const WHOIS_AVAILABLE_RE = [
  /no match/i,
  /not found/i,
  /no data found/i,
  /no entries found/i,
  /no object found/i,
  /domain not found/i,
  /no matching record/i,
  /not been registered/i,
  /object does not exist/i,
  /status:\s*free/i,
  /status:\s*available/i,
  /available for registration/i,
  /this domain (name )?is available/i,
  /没有找到/,
  /未注册/,
];
// Fields that only appear when a domain IS registered.
const WHOIS_REGISTERED_RE = [
  /registrar:/i,
  /sponsoring registrar/i,
  /creation date/i,
  /created on/i,
  /registered on/i,
  /registration time/i,
  /domain status:/i,
  /registry domain id/i,
  /name server:/i,
  /expir/i,
  /registrant/i,
];

/** Resolve the authoritative WHOIS server for a domain via IANA. */
async function resolveWhoisServer(domain) {
  const iana = await whoisQuery("whois.iana.org", domain);
  const m = /refer:\s*(\S+)/i.exec(iana);
  return m ? m[1].trim() : null;
}

/**
 * Look up a hostname's registrable domain and classify registration status.
 * Returns { status: 'available'|'registered'|'unknown', server, note }.
 */
async function whoisLookup(hostname) {
  let domain;
  try {
    domain = registrableDomain(hostname);
  } catch {
    return { status: "unknown", server: "", note: "无法解析域名" };
  }
  let server;
  try {
    server = await resolveWhoisServer(domain);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: "unknown", server: "", note: `IANA 查询失败: ${msg}` };
  }
  if (!server)
    return { status: "unknown", server: "", note: "未找到 WHOIS 服务器" };

  let text;
  try {
    text = await whoisQuery(server, domain);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: "unknown", server, note: `WHOIS 查询失败: ${msg}` };
  }

  // Thin registries (e.g. .com/.net) refer to a registrar WHOIS — follow once
  // to enrich, but the registry answer already settles availability.
  const ref = /(?:Registrar WHOIS Server|Whois Server):\s*(\S+)/i.exec(text);
  if (ref?.[1] && ref[1].toLowerCase() !== server.toLowerCase()) {
    try {
      text += "\n" + (await whoisQuery(ref[1].trim(), domain));
    } catch {
      /* registrar referral optional; ignore failures */
    }
  }

  if (WHOIS_AVAILABLE_RE.some((re) => re.test(text))) {
    return { status: "available", server, domain };
  }
  if (WHOIS_REGISTERED_RE.some((re) => re.test(text))) {
    return { status: "registered", server, domain };
  }
  return { status: "unknown", server, domain, note: "WHOIS 响应未识别" };
}

// ── Parse friends[] from friends.md frontmatter ──────────────────────────────
/**
 * Minimal, comment-aware parser for the `friends:` YAML block.
 * Returns [{ name, href }]. Commented-out entries (`#` lines) are skipped,
 * matching what Astro actually renders.
 */
function parseFriends(md) {
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if (!fmMatch) throw new Error("No frontmatter found in friends.md");
  const lines = fmMatch[1].split(/\r?\n/);

  const startIdx = lines.findIndex((l) => /^friends:\s*$/.test(l));
  if (startIdx === -1) throw new Error("No `friends:` block in frontmatter");

  const friends = [];
  let current = null;
  const stripComment = (l) => l.replace(/\s+#.*$/, ""); // trailing inline comment
  const unquote = (v) =>
    v
      .trim()
      .replace(/^['"]|['"]$/g, "")
      .trim();

  for (let i = startIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    // A top-level (non-indented, non-list) key ends the friends block.
    if (/^\S/.test(raw) && !/^\s*-/.test(raw)) break;

    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue; // skip blanks/comments

    const hrefMatch = /^\s*-\s*href:\s*(.+)$/.exec(stripComment(raw));
    if (hrefMatch) {
      if (current?.href) friends.push(current);
      current = { name: "", href: unquote(hrefMatch[1]) };
      continue;
    }
    const nameMatch = /^\s*name:\s*(.+)$/.exec(stripComment(raw));
    if (nameMatch && current) current.name = unquote(nameMatch[1]);
  }
  if (current?.href) friends.push(current);
  return friends;
}

// ── Single link HTTP check ───────────────────────────────────────────────────
async function checkLink({ name, href }) {
  const result = { name, href, status: 0, finalUrl: href, redirected: false };
  let res;
  try {
    res = await fetch(href, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: BROWSER_HEADERS,
    });
  } catch (err) {
    // err is naturally `unknown` in a catch clause; narrow before reading.
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    if (isTimeout) {
      return { ...result, verdict: "DEAD", reason: `超时 (>${TIMEOUT_MS}ms)` };
    }
    // Node wraps the real network failure in err.cause — surface its code so
    // DNS failures (ENOTFOUND ≈ 域名已失效/可能被出售) are distinguishable from
    // TLS / connection errors.
    const cause = err instanceof Error ? err.cause : undefined;
    const code =
      cause && typeof cause === "object" && "code" in cause
        ? String(cause.code)
        : "";
    const causeMsg =
      cause instanceof Error
        ? cause.message
        : err instanceof Error
          ? err.message
          : String(err);
    // TLS cert error → the host may be serving a parking page over a broken
    // cert. Re-fetch ignoring cert validation and re-run sale detection.
    if (isCertError(code)) {
      const r = await checkInsecure(href, code);
      if (r) return { ...result, ...r };
    }
    const hint =
      code === "ENOTFOUND" || code === "EAI_AGAIN"
        ? "域名无法解析（很可能已过期/被出售）"
        : code === "ECONNREFUSED"
          ? "连接被拒绝（服务器宕机或域名已停用）"
          : isCertError(code)
            ? "TLS 证书错误"
            : "请求失败";
    return {
      ...result,
      verdict: "DEAD",
      reason: `${hint}${code ? ` [${code}]` : ""}: ${causeMsg}`,
    };
  }

  result.status = res.status;
  result.finalUrl = res.url;
  result.redirected = res.redirected;

  let finalHost = "";
  try {
    finalHost = new URL(res.url).hostname;
  } catch {
    /* res.url should always be valid; ignore */
  }

  // Read body (best-effort; cap to ~400KB; decode by the response's charset).
  let body = "";
  try {
    const bytes = Buffer.from(await res.arrayBuffer());
    const capped =
      bytes.byteLength > 400_000 ? bytes.subarray(0, 400_000) : bytes;
    body = decodeBody(capped, res.headers.get("content-type") ?? "");
  } catch {
    /* body unreadable; signature scan simply finds nothing */
  }

  const c = classifyBody({
    status: res.status,
    statusText: res.statusText,
    body,
    finalHost,
  });
  return { ...result, ...c };
}

/**
 * Re-fetch a URL with TLS validation disabled (after a cert error) and
 * re-classify its body. Returns a partial verdict, or null if the insecure
 * fetch also fails (caller then keeps the original DEAD result).
 *   - parking/sale detected → SOLD（域名商挂售页，只是证书没配对）
 *   - reachable, no sale     → WARN（仅证书失效，内容/占位仍可见）
 */
async function checkInsecure(href, code) {
  let r;
  try {
    r = await rawGet(href, { timeout: TIMEOUT_MS, insecure: true });
  } catch {
    return null; // insecure fetch failed too → fall back to DEAD
  }
  let finalHost = "";
  try {
    finalHost = new URL(r.finalUrl).hostname;
  } catch {
    /* ignore */
  }
  const c = classifyBody({ status: r.status, body: r.body, finalHost });
  const tail = `（忽略无效 TLS 证书 [${code}] 后复查）`;
  if (c.verdict === "SOLD") {
    return {
      status: r.status,
      finalUrl: r.finalUrl,
      verdict: "SOLD",
      reason: `${c.reason}${tail}`,
    };
  }
  // Not sold: it's a genuine site with a broken cert (browsers will block it).
  return {
    status: r.status,
    finalUrl: r.finalUrl,
    verdict: "WARN",
    reason: `TLS 证书无效 [${code}]，但忽略后站点可访问且未见出售特征（疑似托管商证书配置错误）；HTTP ${r.status}`,
  };
}

// ── Concurrency-limited map ───────────────────────────────────────────────────
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      out[cur] = await fn(items[cur], cur);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return out;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const md = readFileSync(FRIENDS_MD, "utf-8");
const friends = parseFriends(md);

if (!asJson) {
  console.log(
    `检查 ${friends.length} 个友链（并发 ${CONCURRENCY}，超时 ${TIMEOUT_MS}ms）…\n`,
  );
}

let done = 0;
const results = await mapLimit(friends, CONCURRENCY, async (f) => {
  const r = await checkLink(f);
  done++;
  if (!asJson) {
    const icon = { OK: "✅", SPAM: "🛑", SOLD: "💰", WARN: "⚠️ ", DEAD: "❌" }[
      r.verdict
    ];
    const tag = r.verdict.padEnd(4);
    const label = (r.name || "(无名)").padEnd(14);
    let line = `${icon} [${tag}] ${label} ${r.href}`;
    if (r.verdict !== "OK") line += `\n          ↳ ${r.reason}`;
    if (r.redirected && r.verdict !== "SOLD")
      line += `\n          ↳ 最终: ${r.finalUrl}`;
    console.log(`(${String(done).padStart(2)}/${friends.length}) ${line}`);
  }
  return r;
});

// ── Post-pass for DEAD / inconclusive-WARN links: WHOIS + HTTP/apex probe ──────
// 1. WHOIS (DEAD only) confirms whether the domain is still registered.
// 2. Probe HTTP (port 80) and the apex/www domain. A dead subdomain — or one
//    that returned a blocking/empty response — whose apex now serves squatter
//    spam (SPAM) or a parking page (SOLD) is upgraded accordingly.
const inconclusiveWarn = (r) =>
  r.verdict === "WARN" &&
  ((typeof r.status === "number" && (r.status === 0 || r.status >= 400)) ||
    /占位|建设中|内容过少/.test(r.reason ?? ""));
const postPass = results.filter(
  (r) => r.verdict === "DEAD" || inconclusiveWarn(r),
);
if (postPass.length) {
  if (!asJson) {
    const what = [!noWhois && "WHOIS 复核", !noProbe && "HTTP/一级域名回落探测"]
      .filter(Boolean)
      .join(" + ");
    console.log(`\n── ${postPass.length} 个失效/异常链接：${what} ──`);
  }
  // Sequential-ish (low concurrency) to avoid registry rate limits.
  await mapLimit(postPass, 3, async (r) => {
    const isDead = r.verdict === "DEAD";
    let host = "";
    try {
      host = new URL(r.href).hostname;
    } catch {
      /* malformed href; leave host empty */
    }

    if (isDead && !noWhois) {
      r.whois = host
        ? await whoisLookup(host)
        : { status: "unknown", note: "无效 URL" };
    }

    // Probe fallbacks unless WHOIS proved the domain is gone (no point probing).
    if (!noProbe && r.whois?.status !== "available") {
      const fb = await fallbackProbe(r.href);
      if (fb) {
        r.fallback = fb;
        if (fb.kind === "SPAM" || fb.kind === "SOLD") {
          const verb = fb.kind === "SPAM" ? "疑似被黑灰产抢注" : "已停放/出售";
          const orig = isDead ? "URL 不可达" : `URL 返回 HTTP ${r.status}`;
          r.verdict = fb.kind;
          r.reason = `原 ${orig}，但同域 ${fb.url} ${verb}：${fb.reason}`;
          r.finalUrl = fb.finalUrl;
        }
        // OK/WARN: keep the original verdict (the specific friend URL is still
        // down/blocked); the note is printed below and in the final report.
      }
    }

    if (!asJson) {
      const name = (r.name || "(无名)").padEnd(14);
      if (r.whois) {
        const wIcon = { available: "🟢", registered: "🔵", unknown: "⚪" }[
          r.whois.status
        ];
        const wText = {
          available: "域名已无注册记录（可重新注册，建议移除友链）",
          registered: "域名仍在注册中",
          unknown: `WHOIS 无定论${r.whois.note ? ` — ${r.whois.note}` : ""}`,
        }[r.whois.status];
        console.log(
          `  ${wIcon} ${name} ${r.whois.domain ?? host}  →  ${wText}`,
        );
      }
      if (r.fallback) {
        const fIcon = { SPAM: "🛑", SOLD: "💰", OK: "🟡", WARN: "🟡" }[
          r.fallback.kind
        ];
        const fText =
          r.fallback.kind === "SPAM"
            ? `回落探测：${r.fallback.url} 疑似黑灰产抢注 → ${r.fallback.reason}`
            : r.fallback.kind === "SOLD"
              ? `回落探测：${r.fallback.url} 已停放/出售 → ${r.fallback.reason}`
              : `回落探测：${r.fallback.url} 可访问（HTTP ${r.fallback.status}）→ 原站可能仅 HTTP 可用/已迁移`;
        console.log(`     ${fIcon} ${" ".repeat(13)} ${fText}`);
      }
    }
    return r;
  });
}

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const by = (v) => results.filter((r) => r.verdict === v);
  const ok = by("OK");
  const sold = by("SOLD");
  const spam = by("SPAM");
  const warn = by("WARN");
  const dead = by("DEAD");

  console.log("\n────────────── 汇总 ──────────────");
  console.log(`✅ 正常 (OK)      : ${ok.length}`);
  console.log(`🛑 疑似抢注 (SPAM): ${spam.length}`);
  console.log(`💰 疑似出售 (SOLD): ${sold.length}`);
  console.log(`⚠️  异常 (WARN)    : ${warn.length}`);
  console.log(`❌ 失效 (DEAD)    : ${dead.length}`);
  if (!noWhois && dead.length) {
    const avail = dead.filter((r) => r.whois?.status === "available").length;
    const reg = dead.filter((r) => r.whois?.status === "registered").length;
    console.log(
      `   └ 其中 WHOIS：🟢 已无注册 ${avail} · 🔵 仍注册 ${reg} · ⚪ 无定论 ${dead.length - avail - reg}`,
    );
  }

  const flagged = [...spam, ...sold, ...dead, ...warn];
  if (flagged.length) {
    console.log("\n需要关注的友链：");
    for (const r of flagged) {
      console.log(
        `  ${r.verdict.padEnd(4)} ${(r.name || "(无名)").padEnd(14)} ${r.href}`,
      );
      console.log(`       ↳ ${r.reason}`);
      if (r.whois) {
        const wText = {
          available: "WHOIS: 域名已无注册记录 → 建议移除",
          registered: "WHOIS: 域名仍注册",
          unknown: `WHOIS: 无定论${r.whois.note ? ` (${r.whois.note})` : ""}`,
        }[r.whois.status];
        console.log(`       ↳ ${wText}`);
      }
      if (
        r.fallback &&
        (r.verdict === "DEAD" || r.verdict === "WARN") &&
        (r.fallback.kind === "OK" || r.fallback.kind === "WARN")
      ) {
        console.log(
          `       ↳ 回落: ${r.fallback.url} 可访问（HTTP ${r.fallback.status}）→ 原站可能仅 HTTP/已迁移`,
        );
      }
    }
  }
}

// Non-zero exit if any link needs attention (useful for CI).
const problems = results.filter((r) => r.verdict !== "OK").length;
process.exit(problems > 0 ? 1 : 0);
