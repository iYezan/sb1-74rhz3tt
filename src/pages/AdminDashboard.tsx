import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  converted_amount: number;
  recipient_name: string;
  recipient_mobile: string;
  country: string;
  payment_method: string;
  status: string;
  transaction_stage: string;
  created_at: string;
  profiles: {
    full_name: string;
    mobile_number: string;
  };
}

interface ExchangeRate {
  id: string;
  country: string;
  exchange_rate: number;
  fee_percentage: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalTransactions: 0,
    totalVolume: 0,
    totalProfit: 0
  });

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
    };

    checkAdminAccess();
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions with user profiles
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            *,
            profiles (
              full_name,
              mobile_number
            )
          `)
          .order('created_at', { ascending: false });

        if (transactionError) throw transactionError;
        setTransactions(transactionData || []);

        // Fetch exchange rates
        const { data: rateData, error: rateError } = await supabase
          .from('fees')
          .select('*');

        if (rateError) throw rateError;
        setRates(rateData || []);

        // Fetch statistics
        const { data: statsData } = await supabase
          .from('profiles')
          .select('role, is_approved');

        const totalUsers = statsData?.length || 0;
        const pendingApprovals = statsData?.filter(u => !u.is_approved).length || 0;
        const totalTransactions = transactionData?.length || 0;
        const totalVolume = transactionData?.reduce((sum, t) => sum + t.amount, 0) || 0;
        const totalProfit = transactionData?.reduce((sum, t) => {
          const rate = rateData?.find(r => r.country === t.country);
          return sum + (t.amount * (rate?.fee_percentage || 0) / 100);
        }, 0) || 0;

        setStats({
          totalUsers,
          pendingApprovals,
          totalTransactions,
          totalVolume,
          totalProfit
        });

      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const updateExchangeRate = async (id: string, newRate: number, newFeePercentage: number) => {
    try {
      const { error } = await supabase
        .from('fees')
        .update({ 
          exchange_rate: newRate,
          fee_percentage: newFeePercentage 
        })
        .eq('id', id);

      if (error) throw error;
      
      setRates(rates.map(rate => 
        rate.id === id ? { ...rate, exchange_rate: newRate, fee_percentage: newFeePercentage } : rate
      ));
      
      toast.success('Exchange rate and fee updated successfully');
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      toast.error('Failed to update exchange rate');
    }
  };

  const updateTransactionStatus = async (id: string, status: string, stage: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status, transaction_stage: stage })
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(transactions.map(tx => 
        tx.id === id ? { ...tx, status, transaction_stage: stage } : tx
      ));
      
      toast.success('Transaction status updated successfully');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.pendingApprovals} pending approvals
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transactions</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalTransactions}</p>
          <p className="text-sm text-gray-500 mt-1">
            Volume: £{stats.totalVolume.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profit</h3>
          <p className="text-3xl font-bold text-blue-600">£{stats.totalProfit.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">
            From fees and exchange rates
          </p>
        </div>
      </div>

      {/* Exchange Rates */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-900">Exchange Rates & Fees</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rates.map((rate) => (
              <div key={rate.id} className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">
                  {rate.country} ({rate.country === 'Somalia' ? 'USD' : 'KES'})
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exchange Rate
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={rate.exchange_rate}
                        onChange={(e) => {
                          const newRate = parseFloat(e.target.value);
                          if (!isNaN(newRate)) {
                            updateExchangeRate(rate.id, newRate, rate.fee_percentage);
                          }
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        step="0.0001"
                        min="0"
                      />
                      <span className="text-gray-500">per GBP</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fee Percentage
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={rate.fee_percentage}
                        onChange={(e) => {
                          const newFeePercentage = parseFloat(e.target.value);
                          if (!isNaN(newFeePercentage)) {
                            updateExchangeRate(rate.id, rate.exchange_rate, newFeePercentage);
                          }
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        step="0.01"
                        min="0"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.profiles?.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.profiles?.mobile_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      £{transaction.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.country === 'Somalia' ? '$' : 'KSh'}
                      {transaction.converted_amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.recipient_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.recipient_mobile}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={transaction.status}
                      onChange={(e) => updateTransactionStatus(transaction.id, e.target.value, transaction.transaction_stage)}
                      className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                    <select
                      value={transaction.transaction_stage}
                      onChange={(e) => updateTransactionStatus(transaction.id, transaction.status, e.target.value)}
                      className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md mt-2"
                    >
                      <option value="Money Collection">Money Collection</option>
                      <option value="Admin Approval">Admin Approval</option>
                      <option value="Money Collected">Money Collected</option>
                      <option value="With Company">With Company</option>
                      <option value="Recipient Received">Recipient Received</option>
                      <option value="Done">Done</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => {
                        // Add action handler
                        toast.success('Action completed');
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;