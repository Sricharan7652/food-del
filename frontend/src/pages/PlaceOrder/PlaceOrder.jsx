import { useContext, useEffect, useState } from 'react'
import { StoreContext } from '../../Context/StoreContext'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './PlaceOrder.css'
import axios from 'axios'

const PlaceOrder = () => {
  const [payment, setPayment] = useState("cod")
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: ""
  })

  const { getTotalCartAmount, token, foodList, cartItems, url, setCartItems, currency, deliveryCharge } = useContext(StoreContext)
  const navigate = useNavigate()

  const onChangeHandler = (event) => {
    setData(prev => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const placeOrder = async (e) => {
    e.preventDefault()

    let orderItems = []
    foodList.forEach(item => {
      if (cartItems[item._id] > 0) {
        orderItems.push({ ...item, quantity: cartItems[item._id] })
      }
    })

    const orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() + deliveryCharge,
      userId: token ? "" : undefined // userId will be added on backend by token middleware
    }

    if (payment === "stripe") {
      try {
        const response = await axios.post(
          url + "/api/order/place",
          orderData,
          { headers: { token } }
        )

        if (response.data.success && response.data.session_url) {
          // Redirect to Stripe Checkout page
          window.location.replace(response.data.session_url)
        } else {
          toast.error(response.data.message || "Failed to create Stripe session.")
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Payment processing error.")
      }
    } else {
      // COD payment flow
      try {
        const response = await axios.post(
          url + "/api/order/placecod",
          orderData,
          { headers: { token } }
        )
        if (response.data.success) {
          navigate("/myorders")
          toast.success(response.data.message)
          setCartItems({})
        } else {
          toast.error(response.data.message)
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Order placement error.")
      }
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) {
      toast.error("You must sign in to place an order!")
      navigate('/cart')
    } else if (getTotalCartAmount() === 0) {
      navigate('/cart')
    }
  }, [token])

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        {/* Delivery Information Fields */}
        <p className='title'>Delivery Information</p>
        <div className="multi-field">
          <input type="text" name="firstName" onChange={onChangeHandler} value={data.firstName} placeholder="First name" required />
          <input type="text" name="lastName" onChange={onChangeHandler} value={data.lastName} placeholder="Last name" required />
        </div>
        <input type="email" name="email" onChange={onChangeHandler} value={data.email} placeholder="Email address" required />
        <input type="text" name="street" onChange={onChangeHandler} value={data.street} placeholder="Street" required />
        <div className="multi-field">
          <input type="text" name="city" onChange={onChangeHandler} value={data.city} placeholder="City" required />
          <input type="text" name="state" onChange={onChangeHandler} value={data.state} placeholder="State" required />
        </div>
        <div className="multi-field">
          <input type="text" name="zipcode" onChange={onChangeHandler} value={data.zipcode} placeholder="Zip code" required />
          <input type="text" name="country" onChange={onChangeHandler} value={data.country} placeholder="Country" required />
        </div>
        <input type="text" name="phone" onChange={onChangeHandler} value={data.phone} placeholder="Phone" required />
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details"><p>Subtotal</p><p>{currency}{getTotalCartAmount()}</p></div>
            <hr />
            <div className="cart-total-details"><p>Delivery Fee</p><p>{currency}{getTotalCartAmount() === 0 ? 0 : deliveryCharge}</p></div>
            <hr />
            <div className="cart-total-details"><b>Total</b><b>{currency}{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + deliveryCharge}</b></div>
          </div>
        </div>

        <div className="payment">
          <h2>Payment Method</h2>
          <div onClick={() => setPayment("cod")} className="payment-option">
            <img src={payment === "cod" ? assets.checked : assets.un_checked} alt="" />
            <p>COD ( Cash on delivery )</p>
          </div>
          <div onClick={() => setPayment("stripe")} className="payment-option">
            <img src={payment === "stripe" ? assets.checked : assets.un_checked} alt="" />
            <p>Stripe ( Credit / Debit )</p>
          </div>
        </div>

        <button className='place-order-submit' type='submit'>{payment === "cod" ? "Place Order" : "Proceed To Payment"}</button>
      </div>
    </form>
  )
}

export default PlaceOrder
