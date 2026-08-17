import { redirect } from "next/navigation";

// Gallery moved into the merged Media page. Redirect to preserve bookmarks.
export default function GalleryRedirect() {
  redirect("/admin/media?tab=gallery");
}
