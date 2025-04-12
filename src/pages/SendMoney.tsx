import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import CurrencyConverter from '../components/CurrencyConverter';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SendMoney = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Somalia');
  const [amount, setAmount] = useState(0);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientMobile: '',
    paymentMethod: selectedCountry === 'Somalia' ? 'EVC-PLUS' : 'M-PESA'
  });

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setFormData(prev => ({
      ...prev,
      paymentMethod: country === 'Somalia' ? 'EVC-PLUS' : 'M-PESA'
    }));
  };

  const handleAmountChange = (amount: number, converted: number) => {
    setAmount(amount);
    setConvertedAmount(converted);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in to send money');
        navigate('/login');
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            amount,
            converted_amount: convertedAmount,
            recipient_name: formData.recipientName,
            recipient_mobile: formData.recipientMobile,
            country: selectedCountry,
            payment_method: formData.paymentMethod,
            status: 'pending',
            transaction_stage: 'Money Collection'
          }
        ]);

      if (error) throw error;

      toast.success('Transaction created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Money</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Somalia">Somalia</option>
                  <option value="Kenya">Kenya</option>
                </select>
              </div>

              <CurrencyConverter
                onAmountChange={handleAmountChange}
                selectedCountry={selectedCountry}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient's Name
                </label>
                <input
                  type="text"
                  name="recipientName"
                  required
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient's Mobile Number
                </label>
                <input
                  type="tel"
                  name="recipientMobile"
                  required
                  value={formData.recipientMobile}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {selectedCountry === 'Somalia' ? (
                    <>
                      <option value="EVC-PLUS">EVC-PLUS</option>
                      <option value="Money collection">Money Collection</option>
                    </>
                  ) : (
                    <>
                      <option value="M-PESA">M-PESA</option>
                      <option value="Money collection">Money Collection</option>
                    </>
                  )}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">You send</span>
                    <span className="font-medium">£{amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">They receive</span>
                    <span className="font-medium">
                      {selectedCountry === 'Somalia' ? '$' : 'KSh'}{convertedAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fee</span>
                    <span className="font-medium">£2.99</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total to pay</span>
                      <span className="font-bold">£{(amount + 2.99).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || amount <= 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Send Money'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMoney;