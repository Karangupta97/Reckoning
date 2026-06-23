import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "8e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d";

async function main() {
  try {
    const claims = {
      sub: "bc5c1975-ad93-4257-9447-6fea259e205d",
      email: "panvel.subdistrict@medicares.in",
      role: "SUB_DISTRICT_ADMIN",
      districtId: "RGD",
      subDistrictId: "panvel",
      country: "INDIA",
    };

    const token = jwt.sign(claims, ADMIN_JWT_SECRET, { expiresIn: "15m" });
    console.log("Generated token:", token);

    console.log("Fetching complaint detail...");
    const detailRes = await axios.get("http://localhost:8000/api/admin/subdistrict/complaints/CMP-1008", {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Result:", JSON.stringify(detailRes.data, null, 2));
  } catch (err: any) {
    console.error("Error:", err.response?.status, JSON.stringify(err.response?.data, null, 2) || err.message);
  }
}

main();
