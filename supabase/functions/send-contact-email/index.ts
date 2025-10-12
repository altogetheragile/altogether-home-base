import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  enquiry_type: string;
  preferred_contact_method?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { name, email, phone, subject, message, enquiry_type, preferred_contact_method }: ContactRequest = await req.json();

    // Send email to admin
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@altogetheragile.com";
    const companyName = Deno.env.get("COMPANY_NAME") || "Altogether Agile";

    const emailResponse = await resend.emails.send({
      from: `${companyName} <noreply@altogetheragile.com>`,
      to: [adminEmail],
      replyTo: email,
      subject: `New Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Type:</strong> ${enquiry_type}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${preferred_contact_method ? `<p><strong>Preferred Contact:</strong> ${preferred_contact_method}</p>` : ''}
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    console.log("Admin notification sent:", emailResponse);

    // Send confirmation email to user
    const confirmationResponse = await resend.emails.send({
      from: `${companyName} <noreply@altogetheragile.com>`,
      to: [email],
      subject: `Thank you for contacting ${companyName}`,
      html: `
        <h1>Thank you for contacting us, ${name}!</h1>
        <p>We have received your message regarding: <strong>${subject}</strong></p>
        <p>We will get back to you as soon as possible via your preferred contact method: ${preferred_contact_method || 'email'}.</p>
        <p>Best regards,<br>The ${companyName} Team</p>
      `,
    });

    console.log("Confirmation email sent:", confirmationResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
