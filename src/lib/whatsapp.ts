export async function enviarWhatsApp(mensaje: string): Promise<boolean> {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.replace("+", "");
  const apikey = process.env.NEXT_PUBLIC_CALLMEBOT_APIKEY;

  if (!phone || !apikey) return false;

  try {
    const texto = encodeURIComponent(mensaje);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${texto}&apikey=${apikey}`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}
