import { OAuth2Client } from "google-auth-library";

export const oAuthGoogleClient = new OAuth2Client(
    process.env.GOOGLE_ID,
    process.env.GOOGLE_SECRET,
    process.env.VITE_GOOGLE_REDIRECT_URI
);