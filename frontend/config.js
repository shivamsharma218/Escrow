// Load configuration from environment
window.env = {
  "escrow-contract-address": import.meta.env?.VITE_ESCROW_CONTRACT_ADDRESS || process.env.VITE_ESCROW_CONTRACT_ADDRESS || "",
  "escrow-admin-address": import.meta.env?.VITE_ESCROW_ADMIN_ADDRESS || process.env.VITE_ESCROW_ADMIN_ADDRESS || ""
};

// Fallback for direct inclusion
if (!window.env["escrow-contract-address"]) {
  // Try to load from meta tags as fallback
  const contractMeta = document.querySelector('meta[name="escrow-contract-address"]');
  if (contractMeta) {
    window.env["escrow-contract-address"] = contractMeta.content;
  }
}

if (!window.env["escrow-admin-address"]) {
  const adminMeta = document.querySelector('meta[name="escrow-admin-address"]');
  if (adminMeta) {
    window.env["escrow-admin-address"] = adminMeta.content;
  }
}

console.log("Config loaded:", {
  contract: window.env["escrow-contract-address"],
  admin: window.env["escrow-admin-address"]
});
