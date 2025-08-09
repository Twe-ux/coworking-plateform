'use client'

import { motion } from 'framer-motion'
import { SkeletonCard, SkeletonStats, SkeletonBooking } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Loading state for the header section
export function HeaderLoadingSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6 md:p-8 backdrop-blur-sm border border-orange-100/50"
    >
      {/* Floating background elements */}
      <motion.div 
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-4 right-16 w-20 h-20 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-xl"
      />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar skeleton */}
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative overflow-hidden h-16 w-16 rounded-full bg-gradient-to-br from-orange-200/60 to-amber-200/60"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            
            <div className="space-y-2">
              {/* Name skeleton */}
              <motion.div
                className="relative overflow-hidden h-8 w-48 rounded-lg bg-gradient-to-r from-orange-200/60 to-amber-200/60"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              
              {/* Description skeleton */}
              <motion.div
                className="relative overflow-hidden h-4 w-64 rounded bg-gradient-to-r from-orange-200/40 to-amber-200/40"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              
              {/* Time skeleton */}
              <motion.div
                className="relative overflow-hidden h-3 w-40 rounded bg-gradient-to-r from-orange-200/30 to-amber-200/30"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </div>
          
          {/* Right side controls skeleton */}
          <div className="flex items-center gap-3">
            {/* Search skeleton */}
            <motion.div
              className="relative overflow-hidden hidden md:block w-64 h-10 rounded-xl bg-white/40 backdrop-blur-sm"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            
            {/* Weather skeleton */}
            <motion.div
              className="relative overflow-hidden hidden lg:block w-20 h-10 rounded-xl bg-white/40 backdrop-blur-sm"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2.3, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            
            {/* Notification button skeleton */}
            <motion.div
              className="relative overflow-hidden w-12 h-12 rounded-xl bg-white/40 backdrop-blur-sm"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Loading state for quick actions
export function QuickActionsLoadingSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <motion.div
          className="relative overflow-hidden h-8 w-40 rounded-lg bg-gradient-to-r from-orange-200/60 to-amber-200/60"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-2xl p-6 cursor-pointer backdrop-blur-sm border border-white/20 bg-gradient-to-br from-orange-400/80 to-red-400/80"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            />
            
            <div className="relative z-10 text-center space-y-4">
              {/* Icon skeleton */}
              <motion.div
                className="inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-2xl"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="h-8 w-8 bg-white/40 rounded-lg" />
              </motion.div>
              
              <div className="space-y-2">
                {/* Title skeleton */}
                <div className="h-5 w-32 mx-auto bg-white/30 rounded" />
                {/* Description skeleton */}
                <div className="h-4 w-40 mx-auto bg-white/20 rounded" />
              </div>
              
              {/* Action text skeleton */}
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-16 bg-white/30 rounded" />
                <div className="h-4 w-4 bg-white/30 rounded" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Loading state for bookings list
export function BookingsLoadingSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <motion.div
          className="relative overflow-hidden h-6 w-48 rounded bg-gradient-to-r from-orange-300/60 to-amber-300/60"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        <div className="h-5 w-16 bg-orange-200/60 rounded-full" />
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBooking key={i} />
        ))}
      </div>
      
      {/* Add booking skeleton */}
      <motion.div
        className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200/50"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-200/20 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 flex items-center justify-center gap-2">
          <div className="h-4 w-4 bg-orange-300/60 rounded" />
          <div className="h-4 w-48 bg-orange-300/60 rounded" />
        </div>
      </motion.div>
    </motion.div>
  )
}

// Complete dashboard loading state
export function DashboardLoadingSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 space-y-8 pb-8"
    >
      {/* Header Loading */}
      <HeaderLoadingSkeleton />
      
      {/* Stats Loading */}
      <SkeletonStats />
      
      {/* Quick Actions Loading */}
      <QuickActionsLoadingSkeleton />
      
      {/* Main Content Grid Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings Loading */}
        <div className="lg:col-span-2">
          <BookingsLoadingSkeleton />
        </div>
        
        {/* Sidebar Loading */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white/60 backdrop-blur-sm border-orange-200/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <motion.div
                    className="relative overflow-hidden h-5 w-32 rounded bg-gradient-to-r from-orange-300/60 to-amber-300/60"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                    />
                  </motion.div>
                  <div className="h-5 w-8 bg-orange-200/60 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <motion.div 
                    key={j}
                    className="relative overflow-hidden flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/30"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: (i * 0.2) + (j * 0.1) }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: (i * 0.3) + (j * 0.2) }}
                    />
                    <div className="relative z-10 flex items-center gap-3 w-full">
                      <div className="p-2 bg-gradient-to-br from-blue-200/60 to-blue-300/60 rounded-lg w-8 h-8" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-24 bg-orange-300/60 rounded" />
                        <div className="h-3 w-32 bg-orange-200/60 rounded" />
                      </div>
                      <div className="h-3 w-8 bg-yellow-300/60 rounded" />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  )
}