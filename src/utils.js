// Turns an API error into a readable message
export function getErrorMessage(err) {
  const data = err.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(" ");
  return data?.message || "Could not reach the server. Is the Laravel API running?";
}

export const formatMoney = (value) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(Number(value));