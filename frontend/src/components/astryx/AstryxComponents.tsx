import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'sunlit'
}

export const AstryxCard: React.FC<CardProps> = ({ children, className = '', variant = 'default', ...props }) => {
  const borderStyle = 'border border-[#d0d7cd]'
  const bgStyle = 'bg-white rounded-xl'
  const shadowStyle = variant === 'elevated' ? 'shadow-md' : 'shadow-sm'
  
  return (
    <div className={`${bgStyle} ${borderStyle} ${shadowStyle} p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export interface BadgeProps {
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'earth'
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export const AstryxBadge: React.FC<BadgeProps> = ({ color = 'green', children, size = 'md' }) => {
  const colorMap = {
    green: 'bg-[#dcfce7] text-[#14532d] border-[#86efac]',
    yellow: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
    red: 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]',
    blue: 'bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]',
    earth: 'bg-[#f7f1e6] text-[#6a4320] border-[#dcc19e]'
  }

  const sizeMap = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base font-semibold px-3.5 py-1.5'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colorMap[color]} ${sizeMap[size]}`}>
      {children}
    </span>
  )
}

export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'warn' | 'earth' | 'outline'
  size?: 'md' | 'lg' | 'farmer'
}

export const AstryxButton: React.FC<TactileButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  let btnClass = 'btn-tactile-primary'
  if (variant === 'warn') btnClass = 'btn-tactile-warn'
  if (variant === 'earth') btnClass = 'btn-tactile-earth'
  if (variant === 'outline') {
    btnClass = 'bg-white text-[#1c2826] border border-[#d0d7cd] hover:bg-[#f4f6f2] shadow-sm active:translate-y-0.5'
  }

  const sizeClasses = {
    md: 'px-4 py-2 text-sm rounded-lg font-medium',
    lg: 'px-5 py-3 text-base rounded-xl font-semibold',
    farmer: 'px-6 py-4 text-lg rounded-2xl font-bold min-h-[64px] flex items-center justify-center gap-3'
  }

  return (
    <button className={`cursor-pointer select-none transition-all ${btnClass} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
