// src/pages/rental/BusinessCoverCard.jsx — NEW FILE
//
// AIM
// Lets the owner upload, replace or remove the business cover photo. The photo shows at the top
// of the business card in the public list and on the public business page. Without one, those
// places show the first letter of the business name on a green background.
// Used inside the owner's Settings page.

import "./BusinessCoverCard.css";
import { useState } from "react";
import { Button, Card, CardBody, CardHeader } from "../../components/ui";
import { useToast } from "../../hooks/useNotifications.js";
import { COVER_MAX_MB, removeBusinessCover, uploadBusinessCover } from "../../lib/api/businessMedia.js";
import { useBusinessStore } from "../../store/businessStore.js";
import { useSession } from "../../store/sessionStore.js";

const ACCEPT = "image/jpeg,image/png,image/webp";

export default function BusinessCoverCard({ business }) {
  const toast = useToast();
  const user = useSession((s) => s.user);
  const [busy, setBusy] = useState("");
  const cover = business.cover_url || "";

  // reload the person's businesses so the new cover shows everywhere
  const refresh = () => useBusinessStore.getState().load(user?.id, true);

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("upload");
    const { error } = await uploadBusinessCover(business.id, file, cover);
    setBusy("");
    if (error) return toast.error(error);
    toast.success("Cover photo saved.");
    refresh();
  }

  async function onRemove() {
    setBusy("remove");
    const { error } = await removeBusinessCover(business.id, cover);
    setBusy("");
    if (error) return toast.error(error);
    toast.success("Cover photo removed.");
    refresh();
  }

  return (
    <Card>
      <CardHeader title="Cover photo" subtitle="Shown on your listing card and your public business page" />
      <CardBody>
        <div className="bcov">
          <div className="bcov__preview" style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
            {!cover && <span aria-hidden="true">{(business.name || "?").charAt(0).toUpperCase()}</span>}
          </div>
          <div className="bcov__actions">
            <label className="bcov__file">
              <span>{busy === "upload" ? "Uploading..." : cover ? "Replace photo" : "Choose a photo"}</span>
              <input type="file" accept={ACCEPT} disabled={busy !== ""} onChange={onPick} aria-label="Upload a cover photo" />
            </label>
            {cover && <Button variant="ghost" loading={busy === "remove"} disabled={busy === "upload"} onClick={onRemove}>Remove photo</Button>}
          </div>
          <p className="rent-muted">JPG, PNG or WebP, up to {COVER_MAX_MB} MB. Use a wide landscape photo with the main subject in the middle, because the edges are cropped on small screens.</p>
        </div>
      </CardBody>
    </Card>
  );
}