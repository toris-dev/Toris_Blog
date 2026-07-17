/**
 * 엣지 언어 라우팅 — 홈('/')만 가로챈다 (run_worker_first: ["/"]).
 * 규칙: 브라우저 언어(Accept-Language)에 ko가 있으면 한국어,
 *       없으면 영어(/en). 언어 헤더가 없을 때만 국가(KR) 폴백.
 * SEO 안전장치: 검색·AI 봇은 리다이렉트하지 않고(302만 사용),
 *               ?lang= 수동 선택은 쿠키(1년)로 고정된다.
 */
interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

const BOT_RE =
  /bot|crawl|spider|slurp|preview|yeti|daumoa|kakao|naver|petalsearch|gptbot|oai-search|claude|perplexity|bytespider|facebookexternalhit|whatsapp|telegram|slack|discord/i;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname !== '/') return env.ASSETS.fetch(req);

    const q = url.searchParams.get('lang');
    const cookieLang = /(?:^|;\s*)lang=(ko|en)/.exec(
      req.headers.get('cookie') || ''
    )?.[1];

    // 수동 선택(?lang=) — 쿠키로 고정
    if (q === 'ko' || q === 'en') {
      const cookie = `lang=${q}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
      if (q === 'en') {
        return new Response(null, {
          status: 302,
          headers: { Location: '/en', 'Set-Cookie': cookie }
        });
      }
      const res = await env.ASSETS.fetch(new Request(`${url.origin}/`, req));
      const out = new Response(res.body, res);
      out.headers.append('Set-Cookie', cookie);
      return out;
    }

    if (cookieLang === 'ko') return env.ASSETS.fetch(req);
    if (cookieLang === 'en')
      return Response.redirect(`${url.origin}/en`, 302);

    // 검색·AI 봇은 항상 정본(한국어 홈) — 클로킹/색인 유실 방지
    if (BOT_RE.test(req.headers.get('user-agent') || ''))
      return env.ASSETS.fetch(req);

    const al = req.headers.get('accept-language');
    const korean = al
      ? /(^|[,\s])ko\b/i.test(al)
      : ((req as { cf?: { country?: string } }).cf?.country === 'KR');

    return korean
      ? env.ASSETS.fetch(req)
      : Response.redirect(`${url.origin}/en`, 302);
  }
};
