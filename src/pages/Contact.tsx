import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/modules/i18n/I18nProvider";
import { toast } from "sonner";

export default function ContactPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("contact.sent"));
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="container py-12 lg:py-20">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-semibold md:text-4xl text-balance">{t("contact.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("contact.subtitle")}</p>
      </header>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="rounded-3xl border border-border/60 bg-card p-8 shadow-soft md:p-10">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={t("contact.name")} required>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl" />
            </Field>
            <Field label={t("contact.email")} required>
              <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-xl" />
            </Field>
            <Field label={t("contact.phone")} className="md:col-span-2">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 rounded-xl" />
            </Field>
            <Field label={t("contact.message")} required className="md:col-span-2">
              <Textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="rounded-xl text-base" />
            </Field>
          </div>
          <Button type="submit" variant="hero" size="lg" className="mt-6">
            <Send /> {t("contact.send")}
          </Button>
        </form>

        <aside className="space-y-4">
          <InfoCard icon={<Phone className="h-5 w-5" />} title="Téléphone" value="+32 2 000 00 00" />
          <InfoCard icon={<Mail className="h-5 w-5" />} title="E-mail" value="bonjour@houseofliving.be" />
          <InfoCard icon={<MapPin className="h-5 w-5" />} title="Adresse" value="Avenue Louise 200, 1050 Bruxelles" />
        </aside>
      </div>
    </div>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="mb-1.5 block text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      {children}
    </label>
  );
}

function InfoCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </span>
      <div>
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className="mt-1 text-base font-semibold">{value}</div>
      </div>
    </div>
  );
}
