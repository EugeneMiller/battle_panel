export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    window.alert("JSON copied to clipboard.");
    return;
  } catch {
    window.prompt("Copy JSON", text);
  }
}
