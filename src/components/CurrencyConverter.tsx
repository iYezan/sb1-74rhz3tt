import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface CurrencyConverterProps {
  onAmountChange: (amount: number, convertedAmount: number) => void;
  selectedCountry: string;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ onAmountChange, selectedCountry }) => {
  const [amount, setAmount] = useState<string>('');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        setLoading(true);
        const { data: dbRate, error: dbError } = await supabase
          .from('fees')
          .select('exchange_rate')
          .eq('country', selectedCountry)
          .single();

        if (dbError) throw dbError;

        if (dbRate) {
          setRate(dbRate.exchange_rate);
          // Update conversion with current amount and new rate
          if (amount) {
            updateConversion(amount, dbRate.exchange_rate);
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        toast.error('Error fetching exchange rate');
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRate();
  }, [selectedCountry]);

  const updateConversion = (value: string, currentRate: number) => {
    if (!value || !currentRate) {
      setConvertedAmount(0);
      onAmountChange(0, 0);
      return;
    }
    
    try {
      const numericAmount = parseFloat(value);
      if (isNaN(numericAmount)) {
        setConvertedAmount(0);
        onAmountChange(0, 0);
        return;
      }
      
      const converted = numericAmount * currentRate;
      setConvertedAmount(converted);
      onAmountChange(numericAmount, converted);
    } catch (error) {
      console.error('Error calculating conversion:', error);
      setConvertedAmount(0);
      onAmountChange(0, 0);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    updateConversion(newAmount, rate);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">You send</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">£</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                className="block w-full pl-7 pr-20 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="flex items-center space-x-1 text-gray-500">
                  <img src="https://flagcdn.com/w20/gb.png" alt="GBP" className="h-4 w-6" />
                  <span>GBP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">They receive</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {selectedCountry === 'Somalia' ? '$' : 'KSh'}
                </span>
              </div>
              <input
                type="text"
                value={loading ? 'Calculating...' : convertedAmount.toFixed(2)}
                readOnly
                className="block w-full pl-8 pr-20 py-3 bg-gray-50 border border-gray-300 rounded-md"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="flex items-center space-x-1 text-gray-500">
                  <img 
                    src={`https://flagcdn.com/w20/${selectedCountry === 'Somalia' ? 'so' : 'ke'}.png`}
                    alt={selectedCountry === 'Somalia' ? 'USD' : 'KES'}
                    className="h-4 w-6"
                  />
                  <span>{selectedCountry === 'Somalia' ? 'USD' : 'KES'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {rate > 0 && (
          <div className="text-sm text-gray-500 mt-2">
            Exchange rate: 1 GBP = {rate.toFixed(4)} {selectedCountry === 'Somalia' ? 'USD' : 'KES'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;