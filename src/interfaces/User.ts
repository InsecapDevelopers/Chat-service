export interface User {
    sub: string; // Unique identifier for the user
    role: string; // User role, e.g., "admin", "user", "guest"
    tenantId?: string; // Optional tenant identifier
    sessionToken?: string; // Optional session token for authentication
    claims?: Claims; // Optional additional claims
}

export interface Claims {
    [key: string]: unknown; // Flexible key-value pairs for additional claims
}