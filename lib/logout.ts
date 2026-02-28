/**
 * logout.ts
 * Call this whenever you want to log the user out.
 * Clears both localStorage and the auth cookie so middleware redirects them to landing.
 */
export function logout() {
    // Clear localStorage
    localStorage.removeItem("codemap_user_id")
    localStorage.removeItem("codemap_username")
    localStorage.removeItem("codemap_session_id")
    localStorage.removeItem("codemap_role")
  
    // Clear the auth cookie — set it expired
    document.cookie = "codemap_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax"
  
    // Redirect to landing
    window.location.href = "/"
  }