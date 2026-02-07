export async function sendWhatsApp(message: string): Promise<boolean> {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "59168004297";
  const apiKey = process.env.NEXT_PUBLIC_CALLMEBOT_APIKEY ?? "";
  if (!apiKey) return false;
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}
