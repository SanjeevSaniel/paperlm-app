'use client';

import { PricingBreakdown as PricingBreakdownType } from '@/config/pricing';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

interface PricingBreakdownProps {
  breakdown: PricingBreakdownType;
  size?: 'sm' | 'md';
}

export default function PricingBreakdown({
  breakdown,
  size = 'md',
}: PricingBreakdownProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (breakdown.currency === 'USD' || breakdown.fees.length === 0) {
    return null; // Don't show breakdown for USD or if no fees
  }

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className='relative inline-block'>
      <motion.button
        className={`${iconSize} text-gray-400 hover:text-gray-600 transition-colors ml-1`}
        onClick={() => setShowBreakdown(!showBreakdown)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title='View pricing breakdown'>
        <Info className={iconSize} />
      </motion.button>

      <AnimatePresence>
        {showBreakdown && (
          <>
            {/* Backdrop */}
            <motion.div
              className='fixed inset-0 bg-black/20 backdrop-blur-sm z-40'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBreakdown(false)}
            />

            {/* Breakdown Modal */}
            <motion.div
              className='absolute top-6 left-0 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50'
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}>
              <div className='flex items-center justify-between mb-3'>
                <h4 className='font-medium text-gray-900'>
                  INR Pricing Breakdown
                </h4>
                <button
                  onClick={() => setShowBreakdown(false)}
                  className='text-gray-400 hover:text-gray-600 transition-colors'>
                  <X className='w-4 h-4' />
                </button>
              </div>

              <div className='space-y-2 text-sm'>
                {breakdown.fees.map((fee, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between py-1'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-1'>
                        <span
                          className={
                            index === 0
                              ? 'font-medium text-gray-900'
                              : 'text-gray-700'
                          }>
                          {fee.name}
                        </span>
                        {fee.percentage && (
                          <span
                            key={`percentage-${index}`}
                            className='text-xs text-gray-500'>
                            ({fee.percentage}%)
                          </span>
                        )}
                      </div>
                      <div className='text-xs text-gray-500 mt-0.5'>
                        {fee.description}
                      </div>
                    </div>
                    <div
                      className={`font-mono text-right ${
                        index === 0 ? 'font-medium' : ''
                      }`}>
                      {index === 0 ? (
                        <span className='text-gray-900'>₹{fee.amount}</span>
                      ) : (
                        <span className='text-gray-600'>+₹{fee.amount}</span>
                      )}
                    </div>
                  </div>
                ))}

                <div className='border-t border-gray-200 pt-2 mt-3'>
                  <div className='flex items-center justify-between'>
                    <span className='font-medium text-gray-900'>
                      Total Amount
                    </span>
                    <span className='font-semibold text-lg text-gray-900 font-mono'>
                      ₹{breakdown.total}
                    </span>
                  </div>
                </div>
              </div>

              <div className='mt-3 p-2 bg-amber-50 rounded-lg'>
                <p className='text-xs text-amber-800 leading-relaxed'>
                  <strong>Note:</strong> All fees are calculated according to
                  Indian banking and payment gateway regulations. Rates may vary
                  slightly based on your bank and payment method.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
