"use client";

import { Camera, Check, Eye, EyeOff, KeyRound, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { changePassword, saveAvatar, updateName, type ActionResult } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useT } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";

const AVATAR_SIZE = 256;

/** Square crop from the centre, scaled down to 256 px WebP: a few dozen KB instead of a phone photo. */
async function toAvatarBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/webp", 0.86));
}

function Status({ result }: { result: ActionResult | null }) {
  const t = useT();
  if (!result) return null;
  return result.ok ? (
    <p className="flex items-center gap-1.5 text-sm font-medium text-success-700" role="status">
      <Check className="size-4" strokeWidth={3} aria-hidden /> {t(result.message ?? "Сохранено")}
    </p>
  ) : (
    <p className="text-sm font-medium text-danger-700" role="alert">
      {t(result.error)}
    </p>
  );
}

export function ProfileEditor({
  userId,
  name,
  email,
  avatarUrl,
  needsCurrentPassword,
}: {
  userId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  needsCurrentPassword: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [supabase] = useState(createClient);

  const [avatar, setAvatar] = useState(avatarUrl);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarResult, setAvatarResult] = useState<ActionResult | null>(null);

  const [fullName, setFullName] = useState(name ?? "");
  const [nameResult, setNameResult] = useState<ActionResult | null>(null);
  const [namePending, startName] = useTransition();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [show, setShow] = useState(false);
  const [passwordResult, setPasswordResult] = useState<ActionResult | null>(null);
  const [passwordPending, startPassword] = useTransition();

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setAvatarResult(null);
    if (!file.type.startsWith("image/")) return setAvatarResult({ ok: false, error: "Выберите изображение (JPG, PNG или WebP)" });
    if (file.size > 15 * 1024 * 1024) return setAvatarResult({ ok: false, error: "Файл больше 15 МБ" });
    setAvatarBusy(true);
    const previous = avatar;
    try {
      const blob = await toAvatarBlob(file);
      setAvatar(URL.createObjectURL(blob)); // show it right away
      const path = `${userId}/avatar-${Date.now()}.webp`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const result = await saveAvatar(path);
      setAvatarResult(result.ok ? { ok: true, message: "Фото обновлено" } : result);
      if (!result.ok) setAvatar(previous);
      else router.refresh();
    } catch {
      setAvatar(previous);
      setAvatarResult({ ok: false, error: "Не удалось загрузить фото — попробуйте другое изображение." });
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = async () => {
    setAvatarBusy(true);
    const result = await saveAvatar(null);
    setAvatarBusy(false);
    setAvatarResult(result.ok ? { ok: true, message: "Фото удалено" } : result);
    if (result.ok) {
      setAvatar(null);
      router.refresh();
    }
  };

  const mismatch = repeat.length > 0 && repeat !== next;

  return (
    <div className="space-y-6">
      {/* photo */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <UserAvatar src={avatar} name={fullName || email} className="size-20 text-2xl" />
          {avatarBusy && (
            <span className="absolute inset-0 grid place-items-center rounded-full bg-night/40">
              <Loader2 className="size-6 animate-spin text-white" />
            </span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="soft" disabled={avatarBusy} onClick={() => fileRef.current?.click()}>
              <Camera aria-hidden /> {t(avatar ? "Сменить фото" : "Загрузить фото")}
            </Button>
            {avatar && (
              <Button type="button" size="sm" variant="ghost" disabled={avatarBusy} onClick={removePhoto}>
                <Trash2 aria-hidden /> {t("Удалить")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">{t("JPG, PNG или WebP. Фото обрежется до квадрата.")}</p>
          <Status result={avatarResult} />
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
      </div>

      {/* name */}
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          startName(async () => setNameResult(await updateName(fullName)));
        }}
      >
        <Field label={t("Имя")} htmlFor="profile-name">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="profile-name"
              value={fullName}
              maxLength={80}
              autoComplete="name"
              onChange={(e) => {
                setFullName(e.target.value);
                setNameResult(null);
              }}
            />
            <Button type="submit" disabled={namePending || fullName.trim() === (name ?? "")} className="shrink-0">
              {namePending ? <Loader2 className="animate-spin" aria-hidden /> : null} {t("Сохранить")}
            </Button>
          </div>
        </Field>
        <Status result={nameResult} />
        {email && !email.endsWith(".invalid") && (
          <p className="text-sm text-muted">
            {t("Почта")}: <span className="font-medium text-ink">{email}</span>
          </p>
        )}
      </form>

      {/* password */}
      <form
        className="space-y-3 rounded-2xl border border-line p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (mismatch) return;
          startPassword(async () => {
            const result = await changePassword(current, next);
            setPasswordResult(result);
            if (result.ok) {
              setCurrent("");
              setNext("");
              setRepeat("");
            }
          });
        }}
      >
        <p className="flex items-center gap-2 font-semibold">
          <KeyRound className="size-4 text-brand-600" aria-hidden /> {t(needsCurrentPassword ? "Сменить пароль" : "Задать пароль")}
        </p>
        {!needsCurrentPassword && <p className="text-sm text-muted">{t("Вы вошли через Google или Telegram. С паролем можно будет входить и по почте.")}</p>}
        {/* lets password managers attach the new password to the right account */}
        <input type="text" name="username" autoComplete="username" value={email ?? ""} readOnly hidden />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {needsCurrentPassword && (
            <Field label={t("Текущий пароль")} htmlFor="pw-current">
              <Input id="pw-current" type={show ? "text" : "password"} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </Field>
          )}
          <Field label={t("Новый пароль")} htmlFor="pw-new" hint={t("от 8 символов")}>
            <Input id="pw-new" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
          </Field>
          <Field label={t("Повторите")} htmlFor="pw-repeat" error={mismatch ? t("Пароли не совпадают") : undefined}>
            <Input
              id="pw-repeat"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              aria-invalid={mismatch || undefined}
              required
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={passwordPending || mismatch || !next || !repeat}>
            {passwordPending ? <Loader2 className="animate-spin" aria-hidden /> : null} {t("Обновить пароль")}
          </Button>
          <button type="button" onClick={() => setShow((v) => !v)} className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />} {t(show ? "Скрыть" : "Показать")}
          </button>
          <Status result={passwordResult} />
        </div>
      </form>
    </div>
  );
}
