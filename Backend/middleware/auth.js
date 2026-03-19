const jwt = require("jsonwebtoken");
const Seller = require("../models/Seller");

/**
 * Authentication middleware (protect)
 * - Verifies JWT from Authorization header (Bearer token)
 * - Attaches the authenticated seller document to req.seller
 * - Rejects if token is missing, invalid, expired, or account is deactivated
 *
 * Usage:
 *   router.get("/profile", protect, (req, res) => { ... })
 *   // Inside route handler: req.seller is available (without password)
 */
async function protect(req, res, next) {
  let token;

  // 1. Extract token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Optional: also allow token from cookie or query param (for future flexibility)
  // if (!token && req.cookies?.token) token = req.cookies.token;
  // if (!token && req.query?.token) token = req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided. Please log in.",
    });
  }

  try {
    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the seller and exclude sensitive fields
    const seller = await Seller.findById(decoded.id).select(
      "-password -__v" // exclude password and mongoose version key
    );

    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    if (!seller.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact support.",
      });
    }

    // Optional: you could add more checks here in the future, e.g.
    // if (seller.emailVerified === false) { ... }

    // 4. Attach seller to request object
    req.seller = seller;

    // Optional: attach decoded payload too (useful for token expiration checks, roles, etc.)
    // req.user = decoded;

    next();
  } catch (error) {
    let message = "Not authorized. Authentication failed.";

    if (error.name === "TokenExpiredError") {
      message = "Session expired. Please log in again.";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token. Please log in again.";
    } else if (error.name === "NotBeforeError") {
      message = "Token not yet valid. Please log in again.";
    }

    console.error("[protect middleware error]", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return res.status(401).json({
      success: false,
      message,
      // error: process.env.NODE_ENV === "development" ? error.message : undefined, // optional dev only
    });
  }
}

module.exports = { protect };