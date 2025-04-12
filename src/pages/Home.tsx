import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';

const Home = () => {
  const [selectedCountry, setSelectedCountry] = useState('Somalia');
  const [amount, setAmount] = useState<string>('100.00');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    const numericAmount = parseFloat(value) || 0;
    const rate = selectedCountry === 'Somalia' ? 125.19 : 157.23;
    setConvertedAmount(numericAmount * rate);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
    const numericAmount = parseFloat(amount) || 0;
    const rate = e.target.value === 'Somalia' ? 125.19 : 157.23;
    setConvertedAmount(numericAmount * rate);
  };

  return (
    <div className="min-h-screen bg-[#E5F0F1]">
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-purple-600 text-white px-4 py-1 rounded-full text-sm mb-6">
                New customer offer
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#1F4149] mb-4">
                Send money to {selectedCountry}
                <br />
                from the United Kingdom
              </h1>
              <p className="text-lg text-[#1F4149] mb-8">
                No fees on your first transfer with AlahdalPay
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">You send</h2>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">£</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="block w-full pl-8 pr-20 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100.00"
                    value={amount}
                    onChange={handleAmountChange}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <img src="https://flagcdn.com/w20/gb.png" alt="GBP" className="h-4 w-6" />
                      <span>GBP</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">They receive</h2>
                <div className="relative">
                  <select
                    className="block w-full pl-3 pr-20 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={selectedCountry}
                    onChange={handleCountryChange}
                  >
                    <option value="Somalia">Somalia</option>
                    <option value="Kenya">Kenya</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <img 
                        src={`https://flagcdn.com/w20/${selectedCountry === 'Somalia' ? 'so' : 'ke'}.png`}
                        alt={selectedCountry === 'Somalia' ? 'USD' : 'KES'}
                        className="h-4 w-6"
                      />
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {convertedAmount.toFixed(2)} {selectedCountry === 'Somalia' ? 'USD' : 'KES'}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Fee</span>
                  <span>£2.99</span>
                </div>
                <div className="flex justify-between text-sm text-purple-600">
                  <span>Discount</span>
                  <span>-£2.99</span>
                </div>
                <div className="flex justify-between text-sm font-semibold mt-2">
                  <span>Total cost</span>
                  <span>£{parseFloat(amount || '0').toFixed(2)}</span>
                </div>
              </div>

              <Link
                to="/register"
                className="w-full bg-[#2B4D59] text-white py-4 px-6 rounded-md text-center font-medium hover:bg-[#1F4149] transition-colors flex items-center justify-center"
              >
                Get this rate
              </Link>

              <div className="mt-6 flex items-center justify-center space-x-4">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/74/Mpesa.png" alt="M-PESA" className="h-8" />
                <img src="https://www.somalilandcurrent.com/wp-content/uploads/2015/09/ZAAD.png" alt="ZAAD" className="h-8" />
                <img src="https://www.sombanknews.so/wp-content/uploads/2021/02/evc-plus-logo.png" alt="EVC Plus" className="h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;