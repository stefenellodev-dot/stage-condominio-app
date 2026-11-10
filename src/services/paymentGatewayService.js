import { supabase } from '../lib/supabase';

export const ACTIVE_PAYMENT_PROVIDER = 'sandbox';

export const paymentGatewayService = {
  async initiatePayment(billId, provider = ACTIVE_PAYMENT_PROVIDER) {
    const { data, error } = await supabase.rpc('initiate_online_payment', {
      p_bill_id: billId,
      p_provider: provider
    });
    if (error) throw error;
    return data;
  },

  async processSandboxPayment({ buyOrder, shouldApprove, cardLastDigits = '4242' }) {
    const action = shouldApprove ? 'authorize' : 'reject';
    const authCode = shouldApprove ? `AUT-${Math.floor(100000 + Math.random() * 900000)}` : null;
    const { data, error } = await supabase.rpc('complete_online_payment', {
      p_buy_order: buyOrder,
      p_action: action,
      p_auth_code: authCode,
      p_payment_type: 'VD',
      p_card_last_digits: cardLastDigits,
      p_gateway_payload: { simulator: true, timestamp: new Date().toISOString(), channel: 'Webpay Plus Sandbox Simulator' }
    });
    if (error) throw error;
    return data;
  }
};
