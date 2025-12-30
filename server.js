import express from "express";
import Stripe from "stripe";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 CLIENT WILL SEND THESE


// ✅ Create Stripe Checkout Session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Photo Download",
              description: "Island Moments photo download",
            },
            unit_amount: 300, // $3.00
          },
          quantity: 1,
        },
      ],
      success_url: `http://127.0.0.1:5500/public/index.html?paid=true&url=${encodeURIComponent(imageUrl)}`,
      cancel_url: `http://127.0.0.1:5500/public/index.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Secure download endpoint
app.get("/download", async (req, res) => {
  const { session_id, url } = req.query;

  if (!session_id || !url) {
    return res.status(403).send("Payment required");
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status !== "paid") {
    return res.status(403).send("Payment not verified");
  }

  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=island-moments.jpg"
  );
  res.send(Buffer.from(buffer));
});


app.listen(4242, () => {
  console.log("✅ Stripe server running on http://localhost:4242");
});
