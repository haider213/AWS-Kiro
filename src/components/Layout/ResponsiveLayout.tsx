import React from 'react'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
}

// Main responsive container
export const ResponsiveContainer: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`container-responsive ${className}`}>
    {children}
  </div>
)

// Responsive grid layouts
export const ResponsiveGrid: React.FC<ResponsiveLayoutProps & {
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}> = ({ 
  children, 
  className = '', 
  columns = 3,
  gap = 'md'
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  const gapClasses = {
    sm: 'gap-2 lg:gap-4',
    md: 'gap-4 lg:gap-6',
    lg: 'gap-6 lg:gap-8'
  }

  return (
    <div className={`grid ${gridClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

// Responsive flex layouts
export const ResponsiveFlex: React.FC<ResponsiveLayoutProps & {
  direction?: 'row' | 'col'
  wrap?: boolean
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  align?: 'start' | 'center' | 'end' | 'stretch'
  gap?: 'sm' | 'md' | 'lg'
}> = ({ 
  children, 
  className = '',
  direction = 'row',
  wrap = false,
  justify = 'start',
  align = 'start',
  gap = 'md'
}) => {
  const directionClasses = {
    row: 'flex-col sm:flex-row',
    col: 'flex-col'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={`
      flex ${directionClasses[direction]} ${justifyClasses[justify]} 
      ${alignClasses[align]} ${gapClasses[gap]} 
      ${wrap ? 'flex-wrap' : ''} ${className}
    `}>
      {children}
    </div>
  )
}

// Responsive stack (vertical layout with spacing)
export const ResponsiveStack: React.FC<ResponsiveLayoutProps & {
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
}> = ({ 
  children, 
  className = '',
  spacing = 'md'
}) => {
  const spacingClasses = {
    sm: 'space-y-2 lg:space-y-3',
    md: 'space-y-4 lg:space-y-6',
    lg: 'space-y-6 lg:space-y-8',
    xl: 'space-y-8 lg:space-y-12'
  }

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  )
}

// Responsive two-column layout
export const ResponsiveTwoColumn: React.FC<{
  left: React.ReactNode
  right: React.ReactNode
  leftWidth?: 'narrow' | 'normal' | 'wide'
  className?: string
}> = ({ 
  left, 
  right, 
  leftWidth = 'normal',
  className = ''
}) => {
  const widthClasses = {
    narrow: 'lg:grid-cols-[1fr_2fr]',
    normal: 'lg:grid-cols-2',
    wide: 'lg:grid-cols-[2fr_1fr]'
  }

  return (
    <div className={`grid grid-cols-1 ${widthClasses[leftWidth]} gap-4 lg:gap-6 ${className}`}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  )
}

// Responsive sidebar layout
export const ResponsiveSidebarLayout: React.FC<{
  sidebar: React.ReactNode
  main: React.ReactNode
  sidebarPosition?: 'left' | 'right'
  sidebarWidth?: 'narrow' | 'normal' | 'wide'
  className?: string
}> = ({ 
  sidebar, 
  main, 
  sidebarPosition = 'right',
  sidebarWidth = 'normal',
  className = ''
}) => {
  const widthClasses = {
    narrow: sidebarPosition === 'left' ? 'lg:grid-cols-[250px_1fr]' : 'lg:grid-cols-[1fr_250px]',
    normal: sidebarPosition === 'left' ? 'lg:grid-cols-[300px_1fr]' : 'lg:grid-cols-[1fr_300px]',
    wide: sidebarPosition === 'left' ? 'lg:grid-cols-[350px_1fr]' : 'lg:grid-cols-[1fr_350px]'
  }

  return (
    <div className={`grid grid-cols-1 ${widthClasses[sidebarWidth]} gap-4 lg:gap-6 ${className}`}>
      {sidebarPosition === 'left' ? (
        <>
          <div>{sidebar}</div>
          <div>{main}</div>
        </>
      ) : (
        <>
          <div>{main}</div>
          <div>{sidebar}</div>
        </>
      )}
    </div>
  )
}

// Responsive breakpoint utilities
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop'>('mobile')

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1024) {
        setBreakpoint('desktop')
      } else if (width >= 768) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('mobile')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet'
  }
}

export default ResponsiveContainer