import { CustomEmailEditor } from "@/components/admin/email/CustomEmailEditor";

export const dynamic = "force-dynamic";

export default function AdminCustomEmailPage() {
  return (
    <CustomEmailEditor
      deliveryMode={process.env.CSP_EMAIL_DELIVERY_MODE === "live" ? "live" : "dry_run"}
      senderEmail={process.env.BREVO_SENDER_EMAIL?.trim() ?? ""}
      senderName={process.env.BREVO_SENDER_NAME?.trim() ?? "C3"}
    />
  );
}
