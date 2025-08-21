'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Calendar, CreditCard, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Subscription {
  plan: 'free' | 'pro';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
}

interface PurchaseHistoryItem {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending';
  purchaseDate: string;
  validUntil: string;
}

interface SubscriptionData {
  subscription: Subscription;
  purchaseHistory: PurchaseHistoryItem[];
  isExpired: boolean;
  daysUntilExpiry: number;
}

export default function SubscriptionManager() {
  const { user } = useUser();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
        
        // Show renewal modal if subscription is expired
        if (data.isExpired && data.subscription.plan === 'pro') {
          setShowRenewalModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'pro') => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade', plan }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchSubscriptionData();
        setShowRenewalModal(false);
      } else {
        const error = await response.json();
        toast.error(error.error);
      }
    } catch (error) {
      toast.error('Failed to upgrade subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchSubscriptionData();
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const { subscription, purchaseHistory, isExpired, daysUntilExpiry } = subscriptionData;

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            subscription.plan === 'pro' 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {subscription.plan.toUpperCase()}
          </div>
        </div>

        {subscription.plan === 'pro' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isExpired ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <span className={isExpired ? 'text-red-600' : 'text-green-600'}>
                {isExpired ? 'Subscription Expired' : `${daysUntilExpiry} days remaining`}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Renews on {new Date(subscription.endDate).toLocaleDateString()}</span>
            </div>

            {isExpired && (
              <motion.button
                onClick={() => setShowRenewalModal(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Renew Subscription
              </motion.button>
            )}
          </div>
        )}

        {subscription.plan === 'free' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              You're currently on the free plan with limited features.
            </p>
            <motion.button
              onClick={() => handleUpgrade('pro')}
              disabled={upgrading}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
            </motion.button>
          </div>
        )}
      </div>

      {/* Purchase History */}
      {purchaseHistory.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase History</h3>
          <div className="space-y-3">
            {purchaseHistory.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{purchase.plan.toUpperCase()} Plan</div>
                  <div className="text-sm text-gray-600">
                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    ${(purchase.amount / 100).toFixed(2)}
                  </div>
                  <div className={`text-sm ${
                    purchase.status === 'completed' ? 'text-green-600' : 
                    purchase.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {purchase.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      <AnimatePresence>
        {showRenewalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-xl p-6 max-w-md w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Renew Your Subscription</h3>
                <button
                  onClick={() => setShowRenewalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-medium">Your subscription has expired</span>
                </div>
                <p className="text-gray-600">
                  Renew your Pro subscription to continue enjoying unlimited access to all features.
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-gray-900">Pro Plan - $9/month</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Unlimited documents</li>
                  <li>• Unlimited chat messages</li>
                  <li>• Advanced AI analysis</li>
                  <li>• Priority support</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRenewalModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <motion.button
                  onClick={() => handleUpgrade('pro')}
                  disabled={upgrading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {upgrading ? 'Processing...' : 'Renew Now'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}