import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configuration constants
const currency = "USD";
const deliveryCharge = 5;
const frontend_URL = 'http://localhost:5173';

// Place Order with Stripe payment session
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;

        // Create new order with payment false (not paid yet)
        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address,
            payment: false,
            status: "Food Processing",
            date: new Date(),
        });

        await newOrder.save();

        // Clear user's cart
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Build line items for Stripe checkout
        const line_items = items.map(item => ({
            price_data: {
                currency,
                product_data: { name: item.name },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity,
        }));

        // Add delivery charge as separate item if amount > 0
        if (amount > deliveryCharge) {
            line_items.push({
                price_data: {
                    currency,
                    product_data: { name: "Delivery Charge" },
                    unit_amount: deliveryCharge * 100,
                },
                quantity: 1,
            });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items,
            success_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_URL}/verify?success=false&orderId=${newOrder._id}`,
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.error("Stripe placeOrder error:", error);
        res.json({ success: false, message: "Stripe session creation failed" });
    }
};

// Place Cash on Delivery order
const placeOrderCod = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;

        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address,
            payment: true,
            status: "Food Processing",
            date: new Date(),
        });

        await newOrder.save();
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        res.json({ success: true, message: "Order Placed" });
    } catch (error) {
        console.error("PlaceOrderCod error:", error);
        res.json({ success: false, message: "Error placing COD order" });
    }
};

// List all orders for admin
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("listOrders error:", error);
        res.json({ success: false, message: "Error fetching orders" });
    }
};

// List orders for logged in user
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("userOrders error:", error);
        res.json({ success: false, message: "Error fetching user orders" });
    }
};

// Update order status (admin)
const updateStatus = async (req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.error("updateStatus error:", error);
        res.json({ success: false, message: "Error updating status" });
    }
};

// Verify Stripe payment result
const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Payment confirmed" });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Payment not completed" });
        }
    } catch (error) {
        console.error("verifyOrder error:", error);
        res.json({ success: false, message: "Verification failed" });
    }
};

export { placeOrder, listOrders, userOrders, updateStatus, verifyOrder, placeOrderCod };
