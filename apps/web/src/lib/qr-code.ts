export async function qrCodeDataUrl(text: string, size = 200): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(text, {
    width: size,
    margin: 0,
    errorCorrectionLevel: "H",
    color: {
      dark: "#0A2540",
      light: "#FFFFFF",
    },
  });
}