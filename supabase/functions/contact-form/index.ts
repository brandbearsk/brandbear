import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function cleanText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders,
        });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            {
                status: 405,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    }

    try {
        const body = await req.json();

        const name = cleanText(body.name);
        const email = cleanText(body.email);
        const company = cleanText(body.company);
        const phone = cleanText(body.phone);
        const packageName = cleanText(body.package);
        const message = cleanText(body.message);
        const pageUrl = cleanText(body.page_url);

        if (!name || !email || !packageName || !message) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(
                JSON.stringify({ error: "Invalid email" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        const contactToEmail = Deno.env.get("CONTACT_TO_EMAIL");
        const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL");

        if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !contactToEmail || !resendFromEmail) {
            throw new Error("Missing server configuration");
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
            },
        });

        const { error: insertError } = await supabase
            .from("contact_messages")
            .insert({
                name,
                email,
                company: company || null,
                phone: phone || null,
                package: packageName,
                message,
                page_url: pageUrl || null,
                user_agent: req.headers.get("user-agent"),
                status: "new",
            });

        if (insertError) {
            throw insertError;
        }

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeCompany = escapeHtml(company || "-");
        const safePhone = escapeHtml(phone || "-");
        const safePackage = escapeHtml(packageName);
        const safeMessage = escapeHtml(message).replaceAll("\n", "<br>");
        const safePageUrl = escapeHtml(pageUrl || "-");

        const emailHtml = `
            <h2>Nový dopyt z BrandBear formulára</h2>
            <p><strong>Meno:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Firma:</strong> ${safeCompany}</p>
            <p><strong>Telefón:</strong> ${safePhone}</p>
            <p><strong>Typ spolupráce:</strong> ${safePackage}</p>
            <p><strong>Stránka:</strong> ${safePageUrl}</p>
            <hr>
            <p><strong>Správa:</strong></p>
            <p>${safeMessage}</p>
        `;

        const emailText = `
Nový dopyt z BrandBear formulára

Meno: ${name}
Email: ${email}
Firma: ${company || "-"}
Telefón: ${phone || "-"}
Typ spolupráce: ${packageName}
Stránka: ${pageUrl || "-"}

Správa:
${message}
        `.trim();

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: resendFromEmail,
                to: [contactToEmail],
                reply_to: email,
                subject: `Nový dopyt z BrandBear webu: ${name}`,
                html: emailHtml,
                text: emailText,
            }),
        });

        if (!resendResponse.ok) {
            const resendError = await resendResponse.text();
            throw new Error(`Resend error: ${resendError}`);
        }

        return new Response(
            JSON.stringify({ ok: true }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    } catch (error) {
        console.error(error);

        return new Response(
            JSON.stringify({ error: "Form submission failed" }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    }
});