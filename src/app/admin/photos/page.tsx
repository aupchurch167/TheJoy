import { redirect } from "next/navigation";

// Site photos moved into the merged Media page. Redirect to preserve bookmarks.
export default function SitePhotosRedirect() {
  redirect("/admin/media?tab=site-photos");
}
