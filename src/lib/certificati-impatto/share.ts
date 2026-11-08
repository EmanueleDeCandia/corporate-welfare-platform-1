import { HASHTAGS } from "./constants";
import { placeholderCtx, resolveText, unicodeBold, verifyLink } from "./doc";
import type { Doc } from "./types";

export type Channel = "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "WHATSAPP" | "X" | "EMAIL";

export const sourceOf = (c: Channel) => c.toLowerCase();

export function linkFor(doc: Doc, c: Channel | "direct") {
  return verifyLink(doc, { source: c === "direct" ? "direct" : sourceOf(c), medium: c === "direct" ? "link" : "social" });
}

export function captionFor(doc: Doc, c: Channel | "direct", bold = true) {
  const link = linkFor(doc, c);
  const t = resolveText(doc.caption.text, placeholderCtx(doc, link));
  return bold ? unicodeBold(t) : t.replace(/\*\*/g, "");
}

export function intentUrl(doc: Doc, c: Channel): string | null {
  const link = linkFor(doc, c);
  const caption = captionFor(doc, c);
  const e = encodeURIComponent;
  switch (c) {
    case "LINKEDIN": return `https://www.linkedin.com/sharing/share-offsite/?url=${e(link)}`;
    case "FACEBOOK": return `https://www.facebook.com/sharer/sharer.php?u=${e(link)}&quote=${e(caption.slice(0, 500))}`;
    case "WHATSAPP": return `https://wa.me/?text=${e(caption)}`;
    case "X": return `https://twitter.com/intent/tweet?text=${e(caption.replace(link, "").trim().slice(0, 230))}&url=${e(link)}`;
    case "EMAIL": return `mailto:?subject=${e("Il mio Certificato di Impatto Km 0")}&body=${e(caption)}`;
    default: return null;
  }
}

export function blueprint(doc: Doc, c: "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "WHATSAPP") {
  const caption = captionFor(doc, c);
  const imageUrl = "https://CDN-DEL-PARTNER/certificati/" + doc.id + ".png";
  switch (c) {
    case "INSTAGRAM":
      return [
        { step: 1, call: "POST https://graph.facebook.com/v21.0/{ig-user-id}/media", body: { image_url: imageUrl, caption, access_token: "{TOKEN}" } },
        { step: 2, call: "POST https://graph.facebook.com/v21.0/{ig-user-id}/media_publish", body: { creation_id: "{creation_id}", access_token: "{TOKEN}" } },
      ];
    case "FACEBOOK":
      return [{ step: 1, call: "POST https://graph.facebook.com/v21.0/{page-id}/photos", body: { url: imageUrl, caption, access_token: "{PAGE_TOKEN}" } }];
    case "LINKEDIN":
      return [
        { step: 1, call: "POST https://api.linkedin.com/v2/assets?action=registerUpload", body: { registerUploadRequest: { recipes: ["urn:li:digitalmediaRecipe:feedshare-image"], owner: "urn:li:organization:{ID}", serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }] } } },
        { step: 2, call: "PUT {uploadUrl}", body: "<binary PNG>" },
        { step: 3, call: "POST https://api.linkedin.com/v2/ugcPosts", body: { author: "urn:li:organization:{ID}", lifecycleState: "PUBLISHED", specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text: caption }, shareMediaCategory: "IMAGE", media: [{ status: "READY", media: "{asset URN}", title: { text: "Certificato di Impatto — " + doc.partners.promoter } }] } }, visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" } } },
      ];
    case "WHATSAPP":
      return [{ step: 1, call: "POST https://graph.facebook.com/v21.0/{phone-number-id}/messages", body: { messaging_product: "whatsapp", to: "{NUMERO_E164}", type: "image", image: { link: imageUrl, caption: caption.slice(0, 1000) } } }];
  }
}

export function apiPayload(doc: Doc, channels: string[]) {
  return {
    schema: "WelfareKm0CardInputV5",
    user_info: { first_name: doc.user.first, last_name: doc.user.last, csr_company_name: doc.user.company },
    project_partners: { promoter: doc.partners.promoter, logistics_fleet: doc.partners.fleet, startup_partner: doc.partners.startup },
    location_info: { region: "Regione Marche", city: doc.loc.city, distance_km: doc.loc.km },
    design_config: {
      style_id: doc.design.style,
      custom_colors: { bg_color_hex: doc.design.bg, text_color_hex: doc.design.text, accent_color_hex: doc.design.accent },
      symbol_id: doc.design.symbol,
      output_format: doc.design.format,
    },
    social_publishing: { target_channels: channels, custom_caption: captionFor(doc, "direct", false), hashtags: HASHTAGS.split(" ") },
    certificate: { id: doc.id, verify_url: linkFor(doc, "direct") },
  };
}
