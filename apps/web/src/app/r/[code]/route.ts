import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Affiliate } from "@/lib/models/affiliate";
import { AffiliateClick } from "@/lib/models/affiliate-click";
import { Course } from "@/lib/models/course";
import { MockTestBundle } from "@/lib/models/mock-test-bundle";
import { Resource } from "@/lib/models/resource";
import { Seminar } from "@/lib/models/seminar";
import { getProgram } from "@/lib/programs";
import { trackLinkClick } from "@/lib/link-click-tracking";
import {
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_MAX_AGE_SECONDS,
  AFFILIATE_SITE_URL,
  encodeAffiliateCookie,
  newAffiliateClickId,
  normalizeAffiliateCode,
} from "@/lib/affiliate";

const SOCIAL_CRAWLER_PATTERN =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|pinterest|skypeuripreview|embedly|quora link preview/i;

type SocialPreview = {
  title: string;
  description: string;
  image: string;
};

const DEFAULT_PREVIEW: SocialPreview = {
  title: "FlyBridge Education Group",
  description:
    "Practical, self-paced courses for studying, working, and building a career abroad.",
  image: "/opengraph-image",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '\"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function absoluteUrl(value: string): string {
  try {
    const url = new URL(value, `${AFFILIATE_SITE_URL}/`);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : new URL(DEFAULT_PREVIEW.image, `${AFFILIATE_SITE_URL}/`).toString();
  } catch {
    return new URL(DEFAULT_PREVIEW.image, `${AFFILIATE_SITE_URL}/`).toString();
  }
}

async function socialPreviewForDestination(destination: string): Promise<SocialPreview> {
  const pathname = new URL(destination, `${AFFILIATE_SITE_URL}/`).pathname;
  const seminarMatch = pathname.match(/^\/seminars\/([a-f\d]{24})$/i);
  const resourceMatch = pathname.match(/^\/resources\/([a-f\d]{24})$/i);
  const bundleMatch = pathname.match(/^\/mock-tests\/([a-f\d]{24})$/i);
  const programMatch = pathname.match(/^\/programs\/([^/]+)$/);

  try {
    await connectDb();

    if (seminarMatch) {
      const seminar = await Seminar.findById(seminarMatch[1]).select("title description image").lean();
      if (seminar) {
        return {
          title: `${seminar.title} | FlyBridge Education Group`,
          description: seminar.description || DEFAULT_PREVIEW.description,
          image: seminar.image || DEFAULT_PREVIEW.image,
        };
      }
    } else if (resourceMatch) {
      const resource = await Resource.findById(resourceMatch[1])
        .select("title description thumbnail published")
        .lean();
      if (resource && resource.published !== false) {
        return {
          title: `${resource.title} | FlyBridge Education Group`,
          description: resource.description || DEFAULT_PREVIEW.description,
          image: resource.thumbnail || DEFAULT_PREVIEW.image,
        };
      }
    } else if (bundleMatch) {
      const bundle = await MockTestBundle.findById(bundleMatch[1])
        .select("title description image")
        .lean();
      if (bundle) {
        return {
          title: `${bundle.title} | FlyBridge IELTS Mock Tests`,
          description: bundle.description || DEFAULT_PREVIEW.description,
          image: bundle.image || DEFAULT_PREVIEW.image,
        };
      }
    } else if (programMatch) {
      const slug = decodeURIComponent(programMatch[1]);
      const program = getProgram(slug);
      const course = await Course.findOne({ slug }).select("title description image").lean();
      if (course || program) {
        return {
          title: `${course?.title || program?.title || "Program"} | FlyBridge Education Group`,
          description: course?.description || program?.desc || DEFAULT_PREVIEW.description,
          image: course?.image || program?.image || DEFAULT_PREVIEW.image,
        };
      }
    }
  } catch (error) {
    console.error("affiliate social preview lookup failed", error);
  }

  return DEFAULT_PREVIEW;
}

function socialPreviewResponse(
  code: string,
  destination: string,
  preview: SocialPreview
): NextResponse {
  const canonical = new URL(`/r/${encodeURIComponent(code)}`, `${AFFILIATE_SITE_URL}/`);
  if (destination !== "/") canonical.searchParams.set("to", destination);
  const title = escapeHtml(preview.title);
  const description = escapeHtml(preview.description);
  const image = escapeHtml(absoluteUrl(preview.image));
  const url = escapeHtml(canonical.toString());
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="FlyBridge Education Group"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="${title}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}"></head><body><a href="${escapeHtml(new URL(destination, AFFILIATE_SITE_URL).toString())}">Continue to ${title}</a></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Vary": "User-Agent",
    },
  });
}

/**
 * Only same-origin absolute paths are allowed, so the link cannot be turned
 * into an open redirect to another site.
 */
function safeDestination(request: NextRequest): string {
  const to = request.nextUrl.searchParams.get("to") ?? "";
  if (to.startsWith("/") && !to.startsWith("//") && !to.startsWith("/\\")) return to;
  return "/";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = normalizeAffiliateCode(params.code);
  const destination = safeDestination(request);

  if (SOCIAL_CRAWLER_PATTERN.test(request.headers.get("user-agent") ?? "")) {
    const preview = await socialPreviewForDestination(destination);
    return socialPreviewResponse(code, destination, preview);
  }

  const response = NextResponse.redirect(new URL(destination, AFFILIATE_SITE_URL));
  response.headers.set("Vary", "User-Agent");
  response.headers.set("Cache-Control", "no-store");

  if (!code) return response;

  try {
    await connectDb();
    const affiliate = await Affiliate.findOne({ code, status: "active" })
      .select("_id code")
      .lean();
    if (!affiliate) return response;

    const clickId = newAffiliateClickId();
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwardedFor || request.headers.get("x-real-ip")?.trim() || "";
    const params2 = request.nextUrl.searchParams;
    const session = await readSession();

    await AffiliateClick.create({
      affiliate: affiliate._id,
      clickId,
      code: affiliate.code,
      ip: ip.slice(0, 100),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? "",
      referrer: request.headers.get("referer")?.slice(0, 500) ?? "",
      landingPage: destination.slice(0, 300),
      destination: destination.slice(0, 300),
      utm: {
        source: params2.get("utm_source")?.slice(0, 100) ?? "",
        medium: params2.get("utm_medium")?.slice(0, 100) ?? "",
        campaign: params2.get("utm_campaign")?.slice(0, 180) ?? "",
      },
    }).catch((error) => {
      // Click tracking must never block the redirect.
      console.error("affiliate click record failed", error);
    });

    await trackLinkClick({
      request,
      kind: "affiliate",
      page: "",
      userId: session?.userId,
      affiliate: { _id: affiliate._id },
      destination: destination.slice(0, 500),
      label: `affiliate:${affiliate.code}`,
    });

    response.cookies.set(
      AFFILIATE_COOKIE,
      encodeAffiliateCookie({
        affiliateId: affiliate._id.toString(),
        code: affiliate.code,
        clickId,
      }),
      {
        maxAge: AFFILIATE_COOKIE_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      }
    );
  } catch (error) {
    console.error("affiliate redirect error", error);
  }

  return response;
}
