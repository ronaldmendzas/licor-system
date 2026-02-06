export async function sendWhatsApp(message: string): Promise<boolean> {
  const phone = "59168004297";
  const apiKey = ""; // CallMeBot API key - set via env
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}
