import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

/* ===========================
   CREATE CHECKOUT SESSION
=========================== */
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid products array" });
    }

    let totalAmount = 0;

    // ✅ Build Stripe line items
    const lineItems = products.map((product) => {
      const unitAmount = Math.round(product.price * 100); // convert to cents safely
      totalAmount += unitAmount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: unitAmount, // must be integer
        },
        quantity: product.quantity || 1,
      };
    });

    /* ===========================
       HANDLE COUPON
    =========================== */
    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });

      if (coupon) {
        const discount = Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
        totalAmount -= discount;
      }
    }

    /* ===========================
       CREATE STRIPE SESSION
    =========================== */
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,

      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,

      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // 🎁 Bonus coupon if order >= $200
    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }

    return res.json({
      id: session.id,
      url: session.url, // ✅ frontend will redirect using this
      totalAmount: totalAmount / 100,
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return res
      .status(500)
      .json({ message: "Error processing checkout", error: error.message });
  }
};

/* ===========================
   CHECKOUT SUCCESS
=========================== */
export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed." });
    }

    // 🔁 Deactivate used coupon
    if (session.metadata.couponCode) {
      await Coupon.findOneAndUpdate(
        {
          code: session.metadata.couponCode,
          userId: session.metadata.userId,
        },
        { isActive: false }
      );
    }

    const products = JSON.parse(session.metadata.products);

    const newOrder = new Order({
      user: session.metadata.userId,
      products: products.map((p) => ({
        product: p.id,
        quantity: p.quantity,
        price: p.price,
      })),
      totalAmount: session.amount_total / 100,
      stripeSessionId: session.id,
    });

    await newOrder.save();

    return res.status(200).json({
      success: true,
      message: "Payment successful. Order stored.",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Error processing successful checkout:", error);
    return res.status(500).json({
      message: "Error processing successful checkout",
      error: error.message,
    });
  }
};

/* ===========================
   CREATE NEW COUPON
=========================== */
async function createNewCoupon(userId) {
  // 🔥 Check if user already has an active coupon
  const existingCoupon = await Coupon.findOne({ userId, isActive: true });

  if (existingCoupon) {
    console.log("User already has an active coupon");
    return existingCoupon;
  }

  const coupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userId: userId,
    isActive: true,
  });

  await coupon.save();
  return coupon;
}

